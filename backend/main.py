"""
Background Removal API
Simple FastAPI server using rembg for background removal
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from rembg import remove, new_session
from PIL import Image
import io

app = FastAPI(title="Background Removal API")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pre-load model on startup
session = None

@app.on_event("startup")
async def startup_event():
    global session
    print("Loading rembg model...")
    session = new_session("u2net")
    print("Model loaded!")

@app.get("/health")
async def health_check():
    return {"status": "ok", "model_loaded": session is not None}

@app.post("/remove-background")
async def remove_background(file: UploadFile = File(...)):
    """
    Remove background from uploaded image
    Returns PNG with transparent background
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        # Read uploaded image
        contents = await file.read()
        input_image = Image.open(io.BytesIO(contents))

        # Remove background
        output_image = remove(input_image, session=session)

        # Convert to PNG bytes
        output_buffer = io.BytesIO()
        output_image.save(output_buffer, format="PNG", quality=95)
        output_buffer.seek(0)

        return Response(
            content=output_buffer.getvalue(),
            media_type="image/png"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3008)
