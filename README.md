# Canova Morphing – Verification Walkthrough

This document outlines how to run and verify the **Plastic Surgeon Image Generator** application.

---

## Prerequisites

### Backend Configuration

1. Open the environment file:

   ```bash
   backend/.env
   ```

   > Create it if it does not exist, using `.env.example` as a reference.

2. Add your API key:

   ```env
   GEMINI_API_KEY=your_actual_key_here
   ```

3. Start the backend:

   ```bash
   cd backend
   python -m uvicorn main:app --reload
   ```

4. Verify the backend is running:

   * Open your browser and visit:

     ```
     http://localhost:8000/health
     ```
   * You should see:

     ```json
     {"status": "ok"}
     ```

---

### Frontend Setup

1. Open a new terminal in the frontend directory:

   ```bash
   cd frontend
   npm run dev
   ```

2. Access the application:

   * Open the URL shown in the terminal (usually):

     ```
     http://localhost:5173
     ```

---

## Usage Verification

1. **Upload Photo**

   * Drag and drop a patient's face image into the upload zone.

2. **Select Procedures**

   * Click on one of the available options:

     * **Lips**
     * **Face Lifting**

3. **Enter Diagnosis**

   * In the text area, type a specific correction detail.

4. **Generate Visualization**

   * Click on **Generate Visualization**.

5. **Result**

   * The generated **After** image will appear next to the **Before** image.

---

## Troubleshooting

* **No Image Generated**

  * Check backend logs for API errors.
  * Ensure your API key has access to `gemini-3-pro-image-preview`.

* **Connection Error**

  * Ensure the backend is running on port **8000**.
