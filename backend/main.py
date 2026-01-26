"""
Background Removal API
Simple FastAPI server using rembg for background removal
With face detection using MediaPipe for accurate eye-based positioning
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from rembg import remove, new_session
from PIL import Image
import cv2
import numpy as np
import mediapipe as mp
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
face_mesh = None
face_cascade = None  # Fallback

# MediaPipe face mesh landmarks for eyes
# Left eye: landmarks around 33, 133, 159, 145 (outer corner, inner corner, top, bottom)
# Right eye: landmarks around 362, 263, 386, 374
LEFT_EYE_CENTER = 468  # MediaPipe provides iris center at 468
RIGHT_EYE_CENTER = 473  # MediaPipe provides iris center at 473
# Alternative: use eye corner landmarks
LEFT_EYE_OUTER = 33
LEFT_EYE_INNER = 133
RIGHT_EYE_OUTER = 362
RIGHT_EYE_INNER = 263

@app.on_event("startup")
async def startup_event():
    global session, face_mesh, face_cascade
    print("Loading rembg model...")
    session = new_session("u2net")
    print("Loading MediaPipe face mesh model...")
    face_mesh = mp.solutions.face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True,  # Includes iris landmarks
        min_detection_confidence=0.5
    )
    print("Loading fallback face cascade...")
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    print("Models loaded!")

@app.get("/health")
async def health_check():
    return {"status": "ok", "model_loaded": session is not None}

def detect_face_with_eyes(image_bytes):
    """
    Detect face and eye positions using MediaPipe
    Returns face bounding box and eye centers as percentages
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    height, width = img.shape[:2]

    # Convert BGR to RGB for MediaPipe
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Process with MediaPipe
    results = face_mesh.process(rgb_img)

    if results.multi_face_landmarks:
        landmarks = results.multi_face_landmarks[0].landmark

        # Get eye centers using iris landmarks (more accurate)
        # MediaPipe with refine_landmarks=True provides iris centers at 468 and 473
        try:
            left_eye = landmarks[LEFT_EYE_CENTER]
            right_eye = landmarks[RIGHT_EYE_CENTER]
        except IndexError:
            # Fallback to eye corner midpoints if iris landmarks not available
            left_outer = landmarks[LEFT_EYE_OUTER]
            left_inner = landmarks[LEFT_EYE_INNER]
            right_outer = landmarks[RIGHT_EYE_OUTER]
            right_inner = landmarks[RIGHT_EYE_INNER]

            left_eye_x = (left_outer.x + left_inner.x) / 2
            left_eye_y = (left_outer.y + left_inner.y) / 2
            right_eye_x = (right_outer.x + right_inner.x) / 2
            right_eye_y = (right_outer.y + right_inner.y) / 2

            class EyePoint:
                def __init__(self, x, y):
                    self.x = x
                    self.y = y

            left_eye = EyePoint(left_eye_x, left_eye_y)
            right_eye = EyePoint(right_eye_x, right_eye_y)

        # Calculate eye center (midpoint between eyes)
        eye_center_x = (left_eye.x + right_eye.x) / 2
        eye_center_y = (left_eye.y + right_eye.y) / 2

        # Calculate inter-eye distance for scaling reference
        eye_distance = np.sqrt(
            (right_eye.x - left_eye.x) ** 2 +
            (right_eye.y - left_eye.y) ** 2
        )

        # Get face bounding box from landmarks
        x_coords = [lm.x for lm in landmarks]
        y_coords = [lm.y for lm in landmarks]

        min_x, max_x = min(x_coords), max(x_coords)
        min_y, max_y = min(y_coords), max(y_coords)

        face_width = max_x - min_x
        face_height = max_y - min_y

        return {
            "x": min_x,
            "y": min_y,
            "width": face_width,
            "height": face_height,
            "found": True,
            "eyes": {
                "left": {"x": left_eye.x, "y": left_eye.y},
                "right": {"x": right_eye.x, "y": right_eye.y},
                "center": {"x": eye_center_x, "y": eye_center_y},
                "distance": eye_distance
            }
        }

    # Fallback to Haar cascade if MediaPipe fails
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    if len(faces) > 0:
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])

        # Estimate eye positions (roughly 30% from top, 30% and 70% from left)
        eye_y = (y + h * 0.35) / height
        left_eye_x = (x + w * 0.3) / width
        right_eye_x = (x + w * 0.7) / width

        return {
            "x": x / width,
            "y": y / height,
            "width": w / width,
            "height": h / height,
            "found": True,
            "eyes": {
                "left": {"x": left_eye_x, "y": eye_y},
                "right": {"x": right_eye_x, "y": eye_y},
                "center": {"x": (left_eye_x + right_eye_x) / 2, "y": eye_y},
                "distance": (right_eye_x - left_eye_x),
                "estimated": True  # Flag that these are estimated, not detected
            }
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
    Remove background and detect face position with eye landmarks
    Returns JSON with base64 image, face coordinates, and eye positions
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()

        # Detect face and eyes BEFORE removing background (better detection on original)
        face_info = detect_face_with_eyes(contents)

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
