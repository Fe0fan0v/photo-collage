/**
 * Collage Service
 * Creates a plate-framed face mashup from two photos
 *
 * Layers (bottom to top):
 * 1. Background pattern (zigzag)
 * 2. Combined face photo (left half + right half, masked to circle)
 * 3. Plate overlay (frame with transparent center)
 */

import { loadImage, blobToBase64 } from '../utils/helpers.js';

// Import assets as URLs
import plate1Url from '../assets/plate-1.jpg';
import plate2Url from '../assets/plate-2.jpg';
import plate3Url from '../assets/plate-3.jpg';

const PLATE_URLS = [plate1Url, plate2Url, plate3Url];

/**
 * Fetch image as data URL to avoid CORS/security issues
 */
async function fetchImageAsDataUrl(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return blobToBase64(blob);
}

// Output dimensions (square for the plate)
const OUTPUT_SIZE = 1000;
const PLATE_SIZE = 800; // Diameter of the plate
const FACE_SIZE = 700; // Diameter of the face area inside the plate

/**
 * Create the final collage
 * @param {Blob} photo1 - First photo (left half of face)
 * @param {Blob} photo2 - Second photo (right half of face)
 * @param {number} plateIndex - Selected plate index (0, 1, 2)
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<string>} - Collage as data URL
 */
export async function createCollage(photo1, photo2, plateIndex, onProgress = () => {}) {
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');

  onProgress(10);

  // Load all images
  const [img1DataUrl, img2DataUrl] = await Promise.all([
    blobToBase64(photo1),
    blobToBase64(photo2)
  ]);

  onProgress(20);

  // Load plate as data URL to avoid canvas security issues
  const plateDataUrl = await fetchImageAsDataUrl(PLATE_URLS[plateIndex]);

  onProgress(30);

  const [img1, img2, plateImg] = await Promise.all([
    loadImage(img1DataUrl),
    loadImage(img2DataUrl),
    loadImage(plateDataUrl)
  ]);

  onProgress(40);

  // Step 1: Draw background pattern (using programmatic pattern to avoid security issues)
  drawBackgroundPattern(ctx, null, OUTPUT_SIZE);
  onProgress(50);

  // Step 2: Combine and draw faces in circular mask
  const centerX = OUTPUT_SIZE / 2;
  const centerY = OUTPUT_SIZE / 2;
  const faceRadius = FACE_SIZE / 2;

  // Create circular clipping path for faces
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, faceRadius, 0, Math.PI * 2);
  ctx.clip();

  // Draw combined faces (aligned by height)
  drawCombinedFaces(ctx, img1, img2, centerX, centerY, FACE_SIZE);
  ctx.restore();

  onProgress(70);

  // Step 3: Draw plate overlay (as circular frame)
  drawPlateOverlay(ctx, plateImg, centerX, centerY, PLATE_SIZE, FACE_SIZE);

  onProgress(100);

  // Export as JPEG
  return canvas.toDataURL('image/jpeg', 0.92);
}


/**
 * Draw zigzag background pattern
 */
function drawBackgroundPattern(ctx, patternImg, size) {
  if (patternImg) {
    // Create repeating pattern
    const pattern = ctx.createPattern(patternImg, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, size, size);
  } else {
    // Fallback: draw simple zigzag pattern
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
}

/**
 * Draw combined faces from two photos
 * Left half of photo1 + Right half of photo2
 * Aligned by center (assumes faces are roughly same size)
 */
function drawCombinedFaces(ctx, img1, img2, centerX, centerY, diameter) {
  const radius = diameter / 2;

  // Calculate how to fit faces - we want to show the face area
  // Assuming photos are portrait-oriented with face in center

  // For photo 1: draw the right half of the image (which appears on the left due to mirror)
  // For photo 2: draw the left half of the image (which appears on the right due to mirror)

  // Calculate source and destination rectangles
  // We'll scale the photos to fit the face area by height

  const targetHeight = diameter;
  const targetWidth = diameter;

  // Photo 1 - left side of result
  const scale1 = Math.max(targetHeight / img1.height, (targetWidth / 2) / (img1.width / 2));
  const scaledWidth1 = img1.width * scale1;
  const scaledHeight1 = img1.height * scale1;

  // Draw right half of photo1 on the left side of canvas
  ctx.save();
  ctx.beginPath();
  ctx.rect(centerX - radius, centerY - radius, radius, diameter);
  ctx.clip();

  // Position: center the scaled image, but offset to show the right half
  const offsetX1 = centerX - scaledWidth1 / 2;
  const offsetY1 = centerY - scaledHeight1 / 2;
  ctx.drawImage(img1, offsetX1, offsetY1, scaledWidth1, scaledHeight1);
  ctx.restore();

  // Photo 2 - right side of result
  const scale2 = Math.max(targetHeight / img2.height, (targetWidth / 2) / (img2.width / 2));
  const scaledWidth2 = img2.width * scale2;
  const scaledHeight2 = img2.height * scale2;

  // Draw left half of photo2 on the right side of canvas
  ctx.save();
  ctx.beginPath();
  ctx.rect(centerX, centerY - radius, radius, diameter);
  ctx.clip();

  const offsetX2 = centerX - scaledWidth2 / 2;
  const offsetY2 = centerY - scaledHeight2 / 2;
  ctx.drawImage(img2, offsetX2, offsetY2, scaledWidth2, scaledHeight2);
  ctx.restore();

  // Draw vertical dividing line
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - radius);
  ctx.lineTo(centerX, centerY + radius);
  ctx.stroke();
}

/**
 * Draw plate overlay as a circular frame
 * The plate image is drawn as a ring around the face area
 */
function drawPlateOverlay(ctx, plateImg, centerX, centerY, plateSize, holeSize) {
  const plateRadius = plateSize / 2;
  const holeRadius = holeSize / 2;

  // Create a temporary canvas for the plate with transparent center
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = plateSize;
  tempCanvas.height = plateSize;
  const tempCtx = tempCanvas.getContext('2d');

  // Draw the plate image
  const scale = Math.max(plateSize / plateImg.width, plateSize / plateImg.height);
  const scaledWidth = plateImg.width * scale;
  const scaledHeight = plateImg.height * scale;
  const offsetX = (plateSize - scaledWidth) / 2;
  const offsetY = (plateSize - scaledHeight) / 2;

  tempCtx.drawImage(plateImg, offsetX, offsetY, scaledWidth, scaledHeight);

  // Cut out the center circle
  tempCtx.globalCompositeOperation = 'destination-out';
  tempCtx.beginPath();
  tempCtx.arc(plateSize / 2, plateSize / 2, holeRadius, 0, Math.PI * 2);
  tempCtx.fill();

  // Draw the plate frame onto the main canvas
  const destX = centerX - plateRadius;
  const destY = centerY - plateRadius;
  ctx.drawImage(tempCanvas, destX, destY);

  // Add subtle shadow around the inner edge
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, holeRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

/**
 * Export collage as Blob
 * @param {string} dataUrl
 * @returns {Blob}
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
