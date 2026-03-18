import base64
import json
import os
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

BASE_SYSTEM_PROMPT = """
You are a clinical aesthetic image-editing engine.

Your task is to edit exactly one uploaded patient photograph and return exactly one edited after image.
The uploaded image is already the source photo. Never render the source image alongside the result.

Non-negotiable output rules:
- Return one single edited photograph only.
- Do not create a before/after diptych, side-by-side comparison, split screen, collage, duplicate face, picture-in-picture, or multi-panel layout.
- Do not add text, letters, words, captions, labels, arrows, measurement marks, watermarks, logos, branding, borders, UI chrome, or decorative graphics.
- Keep the same person, same identity, same age range, same ethnicity, same facial proportions, same camera angle, same framing, same gaze direction, same expression, same lighting, same background, and same hairstyle unless the selected intervention explicitly requires a local change.
- Preserve all anatomy and image regions that are not targeted by the selected intervention(s).
- Do not beautify globally, do not apply makeup effects, do not smooth the whole face, do not change body shape unless explicitly requested, and do not make the patient look dramatically younger.
- The edit must be clearly visible in the treated area so the result is useful in consultation, but it must remain medically plausible and realistically achievable.
- Keep skin texture, pores, and normal natural asymmetry. Avoid plastic, waxy, overfiltered, or obviously AI-generated skin.
- If the request is ambiguous, apply a conservative but noticeable localized correction only in the specified area.
"""

PROCEDURE_LIBRARY = {
    "botox_front": {
        "label": "Botox Front",
        "directive": "Reduce horizontal forehead rhytids at rest and soften dynamic forehead creasing while preserving natural forehead texture and normal brow mobility. Do not create a frozen, over-tight, or perfectly flat forehead.",
    },
    "botox_glabella": {
        "label": "Botox Glabelle",
        "directive": "Soften the vertical glabellar frown lines between the eyebrows while preserving natural brow position and expression. Avoid an overarched brow or an unnaturally immobile upper face.",
    },
    "botox_eyes": {
        "label": "Botox Patte d'oie",
        "directive": "Reduce crow's feet at the outer corners of the eyes while keeping realistic eyelid anatomy, smile dynamics, and periocular skin texture. Do not erase all expression around the eyes.",
    },
    "lips_filler": {
        "label": "Lèvres (Acide Hyaluronique)",
        "directive": "Enhance lip hydration, contour, and volume only to the degree implied by the request. Keep natural lip proportions, cupid's bow definition, and oral competence. Avoid overfilled or duck-lip results.",
    },
    "nasolabial_filler": {
        "label": "Sillons Nasogéniens",
        "directive": "Soften the nasolabial folds moderately and locally, preserving a natural transition between cheeks and mouth. Avoid overfilling or changing the entire lower face volume.",
    },
    "marionette_lines": {
        "label": "Plis d'amertume",
        "directive": "Soften the marionette lines from the mouth corners toward the chin and subtly reduce oral commissure downturn if present. Keep the lower face natural, not overfilled, and preserve realistic mouth shape.",
    },
    "dark_circles": {
        "label": "Cernes",
        "directive": "Reduce tear trough hollowing, under-eye darkness, and shadowing while preserving eyelid anatomy and natural under-eye texture. Avoid removing all texture or making the under-eye region unnaturally bright.",
    },
    "cheek_volume": {
        "label": "Volume Pommettes",
        "directive": "Restore subtle midface support and cheek projection in a balanced way. The cheeks should appear refreshed and supported, not oversized or overly sculpted.",
    },
    "jawline": {
        "label": "Jawline & Menton",
        "directive": "Refine jawline and chin definition with a cleaner contour while keeping bone structure, facial harmony, and realistic soft tissue transitions. Avoid exaggerated angularity.",
    },
    "double_chin": {
        "label": "Double Menton",
        "directive": "Reduce submental fullness under the chin in a realistic, localized manner while preserving neck anatomy and skin texture. Avoid an unnaturally sharp or surgically over-tight neck.",
    },
    "blepharoplasty": {
        "label": "Blépharoplastie",
        "directive": "Reduce excess upper or lower eyelid skin/puffiness with a realistic postoperative aesthetic result while maintaining the patient's eye shape and identity. Avoid doll-eye, hollowed eyes, or excessive tightening.",
    },
    "rhinoplasty": {
        "label": "Rhinoplastie",
        "directive": "Refine the nasal shape only according to the request, preserving ethnic identity and facial harmony. Changes may include a smoother dorsum, refined tip, or subtle projection adjustment, but must remain realistic and proportional.",
    },
    "face_lifting": {
        "label": "Lifting Facial",
        "directive": "Create a realistic subtle lift of the midface and lower face with reduced laxity, softer jowls, and slightly improved facial definition. Avoid over-tight skin, unnaturally elevated features, or a facelift mask effect.",
    },
    "otoplasty": {
        "label": "Otoplastie",
        "directive": "Bring the ears slightly closer to the head in a natural way while preserving realistic ear anatomy, size, and symmetry. Avoid flattening or distorting the ears.",
    },
    "breast_augmentation": {
        "label": "Poitrine - Augmentation",
        "directive": "If the uploaded image shows the chest area, increase breast volume and projection in a proportionate, realistic manner consistent with a plausible surgical result. Preserve body proportions and avoid exaggerated enlargement.",
    },
    "breast_reduction": {
        "label": "Poitrine - Réduction",
        "directive": "If the uploaded image shows the chest area, reduce breast volume in a proportionate, realistic manner consistent with a plausible surgical result. Preserve torso anatomy and avoid over-reduction.",
    },
    "liposuction": {
        "label": "Lipoaspiration",
        "directive": "If the requested body area is visible, reduce localized fat volume only in the targeted zones while preserving natural skin folds, body proportions, and realistic contour transitions. Avoid global slimming.",
    },
}

REALISM_RULES = [
    "The result must look achievable by common aesthetic medicine or plastic surgery, not by fantasy retouching.",
    "Edits should be clearly perceptible in the treated area, stronger than a barely visible change, yet still subtle enough to remain credible.",
    "Never remove all wrinkles, folds, laxity, or texture completely when that would look impossible. Improve them significantly but plausibly.",
    "When multiple interventions are selected, combine them coherently without changing untreated areas.",
]

NEGATIVE_RULES = [
    "No text inside the image.",
    "No split-screen or comparison layout.",
    "No duplicated face or second version of the patient.",
    "No extra objects, accessories, hands, tools, syringes, bandages, or clinical overlays unless they already exist in the uploaded photo and are unrelated to the edit.",
    "No background redesign.",
]


def parse_procedures(raw_procedures: str | None) -> list[str]:
    if not raw_procedures:
        return []

    try:
        parsed = json.loads(raw_procedures)
    except json.JSONDecodeError:
        return []

    if not isinstance(parsed, list):
        return []

    normalized = []
    for value in parsed:
        if isinstance(value, str) and value in PROCEDURE_LIBRARY:
            normalized.append(value)
    return normalized


def build_intervention_block(procedure_ids: list[str]) -> str:
    if not procedure_ids:
        return (
            "No validated procedure ID was provided. Apply only the explicit user diagnosis, "
            "as a localized realistic edit, without unrelated beautification."
        )

    lines = []
    for procedure_id in procedure_ids:
        procedure = PROCEDURE_LIBRARY[procedure_id]
        lines.append(f"- {procedure['label']}: {procedure['directive']}")
    return "\n".join(lines)


def build_request_prompt(
    procedure_ids: list[str],
    diagnosis: str,
    refinement: str,
    round_number: int,
    fallback_prompt: str,
) -> str:
    selected_labels = [
        PROCEDURE_LIBRARY[procedure_id]["label"] for procedure_id in procedure_ids
    ]
    diagnosis_text = diagnosis.strip() or "No additional diagnosis supplied."
    refinement_text = refinement.strip()
    fallback_text = fallback_prompt.strip()

    sections = [
        "Edit brief: Produce one single after image for consultation preview from the uploaded patient photo.",
        (
            "Selected interventions: "
            + (", ".join(selected_labels) if selected_labels else "None explicitly validated.")
        ),
        f"Clinical intent and user notes: {diagnosis_text}",
        "Procedure-specific directives:\n" + build_intervention_block(procedure_ids),
        "Realism rules:\n" + "\n".join(f"- {rule}" for rule in REALISM_RULES),
        "Forbidden output patterns:\n" + "\n".join(f"- {rule}" for rule in NEGATIVE_RULES),
    ]

    if round_number > 1 and refinement_text:
        sections.append(
            f"Refinement round {round_number}: preserve all successful edits already visible in the current input image and adjust only these remaining issues: {refinement_text}"
        )

    if fallback_text:
        sections.append(f"Legacy operator notes: {fallback_text}")

    sections.append(
        "Final instruction: the treated area must show a noticeable, believable improvement while the patient remains unmistakably the same person."
    )

    return "\n\n".join(sections)

# Configuration CORS
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/generate")
async def generate_image(
    prompt: str = Form(""),
    procedures: str = Form("[]"),
    diagnosis: str = Form(""),
    refinement: str = Form(""),
    round_number: int = Form(1),
    image: UploadFile = File(...),
):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    client = genai.Client(api_key=api_key)
    model = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-3.1-flash-image-preview")

    procedure_ids = parse_procedures(procedures)
    final_prompt = build_request_prompt(
        procedure_ids=procedure_ids,
        diagnosis=diagnosis,
        refinement=refinement,
        round_number=max(round_number, 1),
        fallback_prompt=prompt,
    )
    full_prompt = f"{BASE_SYSTEM_PROMPT.strip()}\n\n{final_prompt}"

    print("Generating morphing with structured prompt")
    print(full_prompt)

    try:
        # Read uploaded image bytes
        image_bytes = await image.read()
        image_mime = image.content_type or "image/jpeg"

        contents = [
            types.Content(
                role="user",
                parts=[
                    # User's uploaded image
                    types.Part.from_bytes(data=image_bytes, mime_type=image_mime),
                    # Text prompt describing corrections
                    types.Part.from_text(text=full_prompt),
                ],
            ),
        ]

        generate_content_config = types.GenerateContentConfig(
            response_modalities=["IMAGE"],
            image_config=types.ImageConfig(
                image_size="1K",
            ),
        )

        # Call the API
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=generate_content_config,
        )

        # Parse response for image
        if (
            response.candidates
            and response.candidates[0].content
            and response.candidates[0].content.parts
        ):
            for part in response.candidates[0].content.parts:
                if part.inline_data and part.inline_data.data:
                    # Found image data
                    image_data = part.inline_data.data
                    mime_type = part.inline_data.mime_type
                    # Convert bytes to base64 string for frontend
                    image_data_b64 = base64.b64encode(image_data).decode("utf-8")
                    return {
                        "image": f"data:{mime_type};base64,{image_data_b64}",
                        "message": "Success",
                    }

        raise HTTPException(
            status_code=500, detail="No image generated from the model."
        )

    except Exception as e:
        print(f"Error generating image: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
