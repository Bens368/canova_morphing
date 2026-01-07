import os
import mimetypes
import base64
import io
from fastapi import FastAPI, HTTPException, Body, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

SYSTEM_PROMPT = (
    "You are a medical before/after morphing tool. Preserve the subject's identity, pose, camera angle, "
    "lighting, background, and all existing elements unless the request explicitly asks to change them. "
    "Apply only the specified edits and avoid inventing new objects, text, logos, accessories, or background "
    "elements. Hair can be adjusted when requested or when a procedure implies hair changes (e.g., implants). "
    "You may remove clearly distracting artifacts (bandages, markers, stickers) if they are not part of the "
    "requested change. If anything is ambiguous, make the minimal change needed."
)

# Configuration CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate")
async def generate_image(
    prompt: str = Body(...),
    image: UploadFile = File(...)
):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    client = genai.Client(api_key=api_key)
    model = "gemini-3-pro-image-preview"

    print(f"Generating morphing for prompt: {prompt}")

    try:
        # Read uploaded image bytes
        image_bytes = await image.read()
        image_mime = image.content_type or "image/jpeg"
        full_prompt = f"{SYSTEM_PROMPT}\n\nUser request: {prompt}"

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
        if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if part.inline_data and part.inline_data.data:
                    # Found image data
                    image_data = part.inline_data.data
                    mime_type = part.inline_data.mime_type
                    # Convert bytes to base64 string for frontend
                    image_data_b64 = base64.b64encode(image_data).decode('utf-8')
                    return {
                        "image": f"data:{mime_type};base64,{image_data_b64}",
                        "message": "Success"
                    }
        
        raise HTTPException(status_code=500, detail="No image generated from the model.")

    except Exception as e:
        print(f"Error generating image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
