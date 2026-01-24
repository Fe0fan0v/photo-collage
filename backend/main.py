"""
Background Removal API
Simple FastAPI server using rembg for background removal
With face detection for accurate positioning
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from rembg import remove, new_session
from PIL import Image
import cv2
import numpy as np
import io
import base64

app = FastAPI(title="Background Removal API")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pre-load models on startup
session = None
face_cascade = None

@app.on_event("startup")
async def startup_event():
    global session, face_cascade
    print("Loading rembg model...")
    session = new_session("u2net")
    print("Loading face detection model...")
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    print("Models loaded!")

@app.get("/health")
async def health_check():
    return {"status": "ok", "model_loaded": session is not None}

def detect_face(image_bytes):
    """Detect face in image and return bounding box as percentage of image size"""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    height, width = img.shape[:2]

    # Detect faces
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    if len(faces) > 0:
        # Take the largest face
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])

        # Return as percentages of image dimensions
        return {
            "x": x / width,
            "y": y / height,
            "width": w / width,
            "height": h / height,
            "found": True
        }

    return {"found": False}

@app.post("/remove-background")
async def remove_background_simple(file: UploadFile = File(...)):
    """
    Remove background from uploaded image
    Returns PNG with transparent background
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()
        input_image = Image.open(io.BytesIO(contents))
        output_image = remove(input_image, session=session)

        output_buffer = io.BytesIO()
        output_image.save(output_buffer, format="PNG", quality=95)
        output_buffer.seek(0)

        return Response(
            content=output_buffer.getvalue(),
            media_type="image/png"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-face")
async def process_face(file: UploadFile = File(...)):
    """
    Remove background and detect face position
    Returns JSON with base64 image and face coordinates
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()

        # Detect face BEFORE removing background (better detection on original)
        face_info = detect_face(contents)

        # Remove background
        input_image = Image.open(io.BytesIO(contents))
        output_image = remove(input_image, session=session)

        # Convert to base64
        output_buffer = io.BytesIO()
        output_image.save(output_buffer, format="PNG", quality=95)
        output_buffer.seek(0)

        image_base64 = base64.b64encode(output_buffer.getvalue()).decode('utf-8')

        return JSONResponse({
            "image": f"data:image/png;base64,{image_base64}",
            "face": face_info,
            "width": output_image.width,
            "height": output_image.height
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    import os

    cert_file = "../certs/cert.pem"
    key_file = "../certs/key.pem"

    ssl_config = {}
    if os.path.exists(cert_file) and os.path.exists(key_file):
        ssl_config = {
            "ssl_certfile": cert_file,
            "ssl_keyfile": key_file
        }

    uvicorn.run(app, host="0.0.0.0", port=3008, **ssl_config)
