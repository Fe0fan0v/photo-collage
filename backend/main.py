"""
Background Removal API
Simple FastAPI server using rembg for background removal
With face detection using MediaPipe for accurate eye-based positioning
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from fastapi.staticfiles import StaticFiles
from rembg import remove, new_session
from PIL import Image
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import io
import asyncio
import base64
import os
import urllib.request
from datetime import datetime
import secrets

from google_services import google_services
from email_service import email_service

app = FastAPI(title="Background Removal API")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Mount static files for serving uploaded collages
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Pre-load models on startup
session = None
face_landmarker = None
face_cascade = None  # Fallback

# MediaPipe face landmarks indices for eyes
# https://github.com/google/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png
LEFT_EYE_CENTER = 468  # Left iris center
RIGHT_EYE_CENTER = 473  # Right iris center
# Fallback eye corners
LEFT_EYE_OUTER = 33
LEFT_EYE_INNER = 133
RIGHT_EYE_OUTER = 362
RIGHT_EYE_INNER = 263

MODEL_PATH = os.path.join(os.path.dirname(__file__), "face_landmarker.task")
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"

def download_model():
    """Download MediaPipe face landmarker model if not exists"""
    if not os.path.exists(MODEL_PATH):
        print(f"Downloading MediaPipe model to {MODEL_PATH}...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        print("Model downloaded!")

@app.on_event("startup")
async def startup_event():
    global session, face_landmarker, face_cascade
    print("Loading rembg model...")
    session = new_session("u2net")

    print("Loading MediaPipe face landmarker model...")
    try:
        download_model()
        base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
            num_faces=1
        )
        face_landmarker = vision.FaceLandmarker.create_from_options(options)
        print("MediaPipe model loaded!")
    except Exception as e:
        print(f"Failed to load MediaPipe: {e}")
        face_landmarker = None

    print("Loading fallback face cascade...")
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    print("All models loaded!")

@app.get("/health")
async def health_check():
    return {"status": "ok", "model_loaded": session is not None, "mediapipe_loaded": face_landmarker is not None}

def detect_face_with_eyes(image_bytes):
    """
    Detect face and eye positions using MediaPipe
    Returns face bounding box and eye centers as percentages
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    height, width = img.shape[:2]

    # Try MediaPipe first
    if face_landmarker is not None:
        try:
            # Convert BGR to RGB
            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_img)

            # Detect face landmarks
            result = face_landmarker.detect(mp_image)

            if result.face_landmarks and len(result.face_landmarks) > 0:
                landmarks = result.face_landmarks[0]

                # Get eye centers
                # Try iris landmarks first (more accurate)
                try:
                    left_eye = landmarks[LEFT_EYE_CENTER]
                    right_eye = landmarks[RIGHT_EYE_CENTER]
                    left_eye_x, left_eye_y = left_eye.x, left_eye.y
                    right_eye_x, right_eye_y = right_eye.x, right_eye.y
                except (IndexError, AttributeError):
                    # Fallback to eye corner midpoints
                    left_outer = landmarks[LEFT_EYE_OUTER]
                    left_inner = landmarks[LEFT_EYE_INNER]
                    right_outer = landmarks[RIGHT_EYE_OUTER]
                    right_inner = landmarks[RIGHT_EYE_INNER]

                    left_eye_x = (left_outer.x + left_inner.x) / 2
                    left_eye_y = (left_outer.y + left_inner.y) / 2
                    right_eye_x = (right_outer.x + right_inner.x) / 2
                    right_eye_y = (right_outer.y + right_inner.y) / 2

                # Calculate eye center and distance
                eye_center_x = (left_eye_x + right_eye_x) / 2
                eye_center_y = (left_eye_y + right_eye_y) / 2
                eye_distance = np.sqrt(
                    (right_eye_x - left_eye_x) ** 2 +
                    (right_eye_y - left_eye_y) ** 2
                )

                # Get face bounding box from landmarks
                x_coords = [lm.x for lm in landmarks]
                y_coords = [lm.y for lm in landmarks]

                min_x, max_x = min(x_coords), max(x_coords)
                min_y, max_y = min(y_coords), max(y_coords)

                return {
                    "x": min_x,
                    "y": min_y,
                    "width": max_x - min_x,
                    "height": max_y - min_y,
                    "found": True,
                    "eyes": {
                        "left": {"x": left_eye_x, "y": left_eye_y},
                        "right": {"x": right_eye_x, "y": right_eye_y},
                        "center": {"x": eye_center_x, "y": eye_center_y},
                        "distance": eye_distance
                    }
                }
        except Exception as e:
            print(f"MediaPipe detection failed: {e}")

    # Fallback to Haar cascade
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    if len(faces) > 0:
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])

        # Estimate eye positions (roughly 35% from top, 30% and 70% from left)
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
                "estimated": True
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

@app.post("/save-collage")
async def save_collage(data: dict = Body(...)):
    """
    Save collage image to Google Drive and Google Sheets
    Expects JSON with 'image', 'email', 'customerType' fields
    Returns JSON with 'url' and 'collageId'
    """
    try:
        image_data = data.get('image', '')
        email = data.get('email', '')
        customer_type = data.get('customerType', '')

        if not image_data:
            raise HTTPException(status_code=400, detail="No image data provided")

        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]

        # Decode base64
        image_bytes = base64.b64decode(image_data)

        # Generate unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        random_suffix = secrets.token_hex(4)
        filename = f"collage_{timestamp}_{random_suffix}.png"

        # Save locally as backup
        filepath = os.path.join(UPLOADS_DIR, filename)
        with open(filepath, 'wb') as f:
            f.write(image_bytes)

        local_url = f"/uploads/{filename}"

        # Try to upload to Google Drive
        drive_url = None
        if google_services.is_configured():
            drive_url = google_services.upload_to_drive(image_bytes, filename)

        # Use Drive URL if available, otherwise use local URL
        public_url = drive_url if drive_url else f"{os.getenv('PUBLIC_URL', 'https://collage.heliad.ru')}{local_url}"

        # Get next collage ID and save to Google Sheets
        collage_id = google_services.get_next_collage_id()

        if google_services.is_configured() and email:
            # Format datetime for Russian locale
            datetime_str = datetime.now().strftime('%d.%m.%Y %H:%M:%S')

            success = google_services.append_to_sheet({
                'collage_id': collage_id,
                'datetime': datetime_str,
                'email': email,
                'customer_type': customer_type,
                'collage_url': public_url
            })

            if not success:
                print("Warning: Failed to save to Google Sheets, but file was uploaded")

        return JSONResponse({
            "success": True,
            "url": public_url,
            "collageId": collage_id,
            "filename": filename,
            "savedToSheets": google_services.is_configured()
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/send-email")
async def send_email(data: dict = Body(...)):
    """
    Send collage email via SMTP
    Expects JSON with 'image' (data URL) and 'recipients' ([{email, customerType}])
    """
    try:
        image_data = data.get('image', '')
        recipients = data.get('recipients', [])
        collage_info = data.get('collageInfo', None)

        if not image_data:
            return JSONResponse({'success': False, 'message': 'Изображение не предоставлено', 'results': []})

        if not recipients:
            return JSONResponse({'success': False, 'message': 'Не указаны получатели', 'results': []})

        if not email_service.is_configured():
            return JSONResponse({'success': False, 'message': 'SMTP не настроен. Обратитесь к администратору.', 'results': []})

        # Remove data URL prefix
        if ',' in image_data:
            image_data = image_data.split(',')[1]

        image_bytes = base64.b64decode(image_data)

        # Run blocking SMTP in a thread
        results = await asyncio.to_thread(email_service.send_to_multiple, recipients, image_bytes)

        # Send manager notification in background (don't block the response)
        asyncio.create_task(
            asyncio.to_thread(email_service.send_manager_notification, image_bytes, recipients, collage_info)
        )

        all_ok = all(r['success'] for r in results)

        return JSONResponse({
            'success': all_ok,
            'results': results,
            'message': 'Все письма отправлены' if all_ok else 'Некоторые письма не удалось отправить'
        })

    except Exception as e:
        return JSONResponse({'success': False, 'message': str(e), 'results': []}, status_code=500)


if __name__ == "__main__":
    import uvicorn

    cert_file = "../certs/cert.pem"
    key_file = "../certs/key.pem"

    ssl_config = {}
    if os.path.exists(cert_file) and os.path.exists(key_file):
        ssl_config = {
            "ssl_certfile": cert_file,
            "ssl_keyfile": key_file
        }

    uvicorn.run(app, host="0.0.0.0", port=3008, **ssl_config)
