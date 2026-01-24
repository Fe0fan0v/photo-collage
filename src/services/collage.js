/**
 * Collage Service
 * Creates a plate-framed face mashup from two photos
 *
 * Process:
 * 1. Remove background from both photos
 * 2. Draw background pattern
 * 3. Draw plate
 * 4. Overlay faces (left half of person1, right half of person2)
 */

import { loadImage, blobToBase64 } from '../utils/helpers.js';
import { processMultipleImages } from './background-removal.js';

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
const FACE_SIZE = 620; // Face area inside plate

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

  // Step 1: Remove backgrounds (0-60%)
  onProgress(5);

  const processedPhotos = await processMultipleImages([photo1, photo2], (progress, idx) => {
    // Map 0-100 to 5-60%
    const mappedProgress = 5 + Math.round(progress * 0.55);
    onProgress(mappedProgress);
  });

  onProgress(60);

  // Step 2: Load plate image
  const plateDataUrl = await fetchImageAsDataUrl(PLATE_URLS[plateIndex]);
  const plateImg = await loadImage(plateDataUrl);

  // Step 3: Load processed face images
  const [face1DataUrl, face2DataUrl] = await Promise.all([
    blobToBase64(processedPhotos[0]),
    blobToBase64(processedPhotos[1])
  ]);

  const [faceImg1, faceImg2] = await Promise.all([
    loadImage(face1DataUrl),
    loadImage(face2DataUrl)
  ]);

  onProgress(70);

  // Step 4: Draw background pattern
  drawBackgroundPattern(ctx, OUTPUT_SIZE);

  // Step 5: Draw plate (circular, centered)
  drawPlate(ctx, plateImg, centerX, centerY, PLATE_SIZE);

  onProgress(80);

  // Step 6: Draw faces on top of plate
  const faceRadius = FACE_SIZE / 2;

  // Clip to inner circle for faces
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, faceRadius, 0, Math.PI * 2);
  ctx.clip();

  // Draw both face halves
  drawFaceHalves(ctx, faceImg1, faceImg2, centerX, centerY, FACE_SIZE);

  ctx.restore();

  onProgress(90);

  // Step 7: Draw dividing line
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - faceRadius);
  ctx.lineTo(centerX, centerY + faceRadius);
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
 * Draw two face halves side by side
 * Left half from face1, right half from face2
 */
function drawFaceHalves(ctx, faceImg1, faceImg2, centerX, centerY, diameter) {
  const radius = diameter / 2;

  // Calculate scale to fit faces nicely
  // We want the face to fill most of the circle vertically
  const targetHeight = diameter * 0.9;

  const scale1 = targetHeight / faceImg1.height;
  const scale2 = targetHeight / faceImg2.height;
  const scale = Math.min(scale1, scale2); // Use smaller scale for consistency

  const scaledWidth1 = faceImg1.width * scale;
  const scaledHeight1 = faceImg1.height * scale;
  const scaledWidth2 = faceImg2.width * scale;
  const scaledHeight2 = faceImg2.height * scale;

  // Face 1 - left half of result
  // Draw the image centered, but only show the right half (which is left half of mirrored selfie)
  ctx.save();
  ctx.beginPath();
  ctx.rect(centerX - radius, centerY - radius, radius, diameter);
  ctx.clip();

  const offsetX1 = centerX - scaledWidth1 / 2;
  const offsetY1 = centerY - scaledHeight1 / 2;
  ctx.drawImage(faceImg1, offsetX1, offsetY1, scaledWidth1, scaledHeight1);
  ctx.restore();

  // Face 2 - right half of result
  ctx.save();
  ctx.beginPath();
  ctx.rect(centerX, centerY - radius, radius, diameter);
  ctx.clip();

  const offsetX2 = centerX - scaledWidth2 / 2;
  const offsetY2 = centerY - scaledHeight2 / 2;
  ctx.drawImage(faceImg2, offsetX2, offsetY2, scaledWidth2, scaledHeight2);
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
