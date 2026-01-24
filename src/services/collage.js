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
const PLATE_SIZE = 900; // Size to draw the plate
const FACE_SIZE = 580;  // Smaller face area to show more of plate border

/**
 * Create the final collage
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

  const centerX = OUTPUT_SIZE / 2;
  const centerY = OUTPUT_SIZE / 2;

  // Step 1: Draw background pattern
  drawBackgroundPattern(ctx, OUTPUT_SIZE);
  onProgress(50);

  // Step 2: Draw the plate as background (full plate image)
  drawPlateBackground(ctx, plateImg, centerX, centerY, PLATE_SIZE);
  onProgress(60);

  // Step 3: Draw combined faces on top, clipped to inner circle
  const faceRadius = FACE_SIZE / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, faceRadius, 0, Math.PI * 2);
  ctx.clip();

  drawCombinedFaces(ctx, img1, img2, centerX, centerY, FACE_SIZE);
  ctx.restore();

  onProgress(80);

  // Step 4: Draw dividing line
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - faceRadius);
  ctx.lineTo(centerX, centerY + faceRadius);
  ctx.stroke();

  onProgress(100);

  // Export as JPEG
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
 * Draw plate image as circular background
 */
function drawPlateBackground(ctx, plateImg, centerX, centerY, size) {
  const radius = size / 2;

  // Clip to circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();

  // Draw plate scaled to fill the circle
  const scale = Math.max(size / plateImg.width, size / plateImg.height);
  const scaledWidth = plateImg.width * scale;
  const scaledHeight = plateImg.height * scale;
  const offsetX = centerX - scaledWidth / 2;
  const offsetY = centerY - scaledHeight / 2;

  ctx.drawImage(plateImg, offsetX, offsetY, scaledWidth, scaledHeight);
  ctx.restore();
}

/**
 * Draw combined faces from two photos
 * Both photos are centered and scaled the same way
 */
function drawCombinedFaces(ctx, img1, img2, centerX, centerY, diameter) {
  const radius = diameter / 2;

  // Use the same scale for both images based on the larger dimension
  // This ensures both faces are at similar scale
  const scale1 = diameter / Math.min(img1.width, img1.height);
  const scale2 = diameter / Math.min(img2.width, img2.height);

  // Use average scale for consistency
  const scale = (scale1 + scale2) / 2;

  // Photo 1 - LEFT side of result (shows RIGHT half of mirrored photo)
  const scaledWidth1 = img1.width * scale;
  const scaledHeight1 = img1.height * scale;

  ctx.save();
  ctx.beginPath();
  ctx.rect(centerX - radius, centerY - radius, radius, diameter);
  ctx.clip();

  // Center the image
  const offsetX1 = centerX - scaledWidth1 / 2;
  const offsetY1 = centerY - scaledHeight1 / 2;
  ctx.drawImage(img1, offsetX1, offsetY1, scaledWidth1, scaledHeight1);
  ctx.restore();

  // Photo 2 - RIGHT side of result (shows LEFT half of mirrored photo)
  const scaledWidth2 = img2.width * scale;
  const scaledHeight2 = img2.height * scale;

  ctx.save();
  ctx.beginPath();
  ctx.rect(centerX, centerY - radius, radius, diameter);
  ctx.clip();

  const offsetX2 = centerX - scaledWidth2 / 2;
  const offsetY2 = centerY - scaledHeight2 / 2;
  ctx.drawImage(img2, offsetX2, offsetY2, scaledWidth2, scaledHeight2);
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
