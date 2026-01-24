/**
 * Collage Service
 * Creates a plate-framed face mashup from two photos
 *
 * Process:
 * 1. Remove background from both photos + detect face position
 * 2. Draw background pattern
 * 3. Draw plate
 * 4. Overlay faces (left half of person1, right half of person2)
 */

import { loadImage, blobToBase64 } from '../utils/helpers.js';
import { processMultipleFaces } from './background-removal.js';

// Import plate images
import plate1Url from '../assets/plate-1.jpg';
import plate2Url from '../assets/plate-2.jpg';
import plate3Url from '../assets/plate-3.jpg';

const PLATE_URLS = [plate1Url, plate2Url, plate3Url];

/**
 * Fetch image as data URL
 */
async function fetchImageAsDataUrl(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return blobToBase64(blob);
}

// Output dimensions
const OUTPUT_SIZE = 1000;
const PLATE_SIZE = 900;
const FACE_WIDTH = 500;  // Oval width for face
const FACE_HEIGHT = 620; // Oval height for face (taller than wide)

/**
 * Create the final collage
 */
export async function createCollage(photo1, photo2, plateIndex, onProgress = () => {}) {
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');

  const centerX = OUTPUT_SIZE / 2;
  const centerY = OUTPUT_SIZE / 2;

  // Step 1: Process faces - remove backgrounds and detect face positions (0-60%)
  onProgress(5);

  const processedFaces = await processMultipleFaces([photo1, photo2], (progress, idx) => {
    const mappedProgress = 5 + Math.round(progress * 0.55);
    onProgress(mappedProgress);
  });

  onProgress(60);

  // Step 2: Load plate image
  const plateDataUrl = await fetchImageAsDataUrl(PLATE_URLS[plateIndex]);
  const plateImg = await loadImage(plateDataUrl);

  // Step 3: Load processed face images
  const [faceImg1, faceImg2] = await Promise.all([
    loadImage(processedFaces[0].image),
    loadImage(processedFaces[1].image)
  ]);

  onProgress(70);

  // Step 4: Draw background pattern
  drawBackgroundPattern(ctx, OUTPUT_SIZE);

  // Step 5: Draw plate (circular, centered)
  drawPlate(ctx, plateImg, centerX, centerY, PLATE_SIZE);

  onProgress(80);

  // Step 6: Draw faces on top of plate in oval shape
  const radiusX = FACE_WIDTH / 2;
  const radiusY = FACE_HEIGHT / 2;

  // Clip to oval for faces
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.clip();

  // Draw both face halves using detected face positions
  drawFaceHalves(
    ctx,
    faceImg1, processedFaces[0].face,
    faceImg2, processedFaces[1].face,
    centerX, centerY, FACE_WIDTH, FACE_HEIGHT
  );

  ctx.restore();

  onProgress(90);

  // Step 7: Draw dividing line
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - radiusY);
  ctx.lineTo(centerX, centerY + radiusY);
  ctx.stroke();

  onProgress(100);

  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Draw zigzag background pattern
 */
function drawBackgroundPattern(ctx, size) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#000000';
  const step = 20;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const offset = (Math.floor(y / step) % 2) * (step / 2);
      ctx.beginPath();
      ctx.moveTo(x + offset, y);
      ctx.lineTo(x + offset + step / 2, y + step / 2);
      ctx.lineTo(x + offset, y + step);
      ctx.lineTo(x + offset - step / 2, y + step / 2);
      ctx.closePath();
      ctx.fill();
    }
  }
}

/**
 * Draw plate as circular image
 */
function drawPlate(ctx, plateImg, centerX, centerY, size) {
  const radius = size / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();

  const scale = Math.max(size / plateImg.width, size / plateImg.height);
  const scaledWidth = plateImg.width * scale;
  const scaledHeight = plateImg.height * scale;
  const offsetX = centerX - scaledWidth / 2;
  const offsetY = centerY - scaledHeight / 2;

  ctx.drawImage(plateImg, offsetX, offsetY, scaledWidth, scaledHeight);
  ctx.restore();
}

/**
 * Draw two face halves side by side in oval shape
 * Uses detected face positions for accurate placement
 */
function drawFaceHalves(ctx, faceImg1, face1, faceImg2, face2, centerX, centerY, width, height) {
  const radiusX = width / 2;
  const radiusY = height / 2;

  // Draw face 1 (left half)
  drawSingleFace(ctx, faceImg1, face1, centerX, centerY, radiusX, radiusY, 'left');

  // Draw face 2 (right half)
  drawSingleFace(ctx, faceImg2, face2, centerX, centerY, radiusX, radiusY, 'right');
}

/**
 * Draw a single face, scaled and positioned based on detected face coordinates
 */
function drawSingleFace(ctx, faceImg, faceInfo, centerX, centerY, radiusX, radiusY, side) {
  ctx.save();

  // Clip to left or right half
  if (side === 'left') {
    ctx.beginPath();
    ctx.rect(centerX - radiusX, centerY - radiusY, radiusX, radiusY * 2);
    ctx.clip();
  } else {
    ctx.beginPath();
    ctx.rect(centerX, centerY - radiusY, radiusX, radiusY * 2);
    ctx.clip();
  }

  const imgWidth = faceImg.width;
  const imgHeight = faceImg.height;

  let scale, offsetX, offsetY;

  if (faceInfo && faceInfo.found) {
    // Use detected face coordinates
    // Face info contains percentages: x, y, width, height
    const faceX = faceInfo.x * imgWidth;
    const faceY = faceInfo.y * imgHeight;
    const faceW = faceInfo.width * imgWidth;
    const faceH = faceInfo.height * imgHeight;

    // Center of detected face
    const faceCenterX = faceX + faceW / 2;
    const faceCenterY = faceY + faceH / 2;

    // Scale so the detected face height fits nicely in the oval
    // Add some padding around the face (face should be ~70% of oval height)
    scale = (radiusY * 2 * 0.7) / faceH;

    // Position so face center aligns with oval center
    const scaledFaceCenterX = faceCenterX * scale;
    const scaledFaceCenterY = faceCenterY * scale;

    offsetX = centerX - scaledFaceCenterX;
    offsetY = centerY - scaledFaceCenterY;
  } else {
    // Fallback: assume face is in top 40% of image, centered horizontally
    const assumedFaceY = imgHeight * 0.2;
    const assumedFaceH = imgHeight * 0.35;

    scale = (radiusY * 2 * 0.8) / assumedFaceH;

    const scaledImgWidth = imgWidth * scale;
    const scaledAssumedFaceCenter = assumedFaceY * scale + (assumedFaceH * scale) / 2;

    offsetX = centerX - scaledImgWidth / 2;
    offsetY = centerY - scaledAssumedFaceCenter;
  }

  const scaledWidth = imgWidth * scale;
  const scaledHeight = imgHeight * scale;

  ctx.drawImage(faceImg, offsetX, offsetY, scaledWidth, scaledHeight);
  ctx.restore();
}

/**
 * Export collage as Blob
 */
export function collageToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }

  return new Blob([array], { type: mime });
}
