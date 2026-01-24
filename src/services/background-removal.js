/**
 * Background Removal Service
 * Uses Python backend with rembg for background removal
 */

// API endpoint - same host, different port
const API_URL = `${window.location.protocol}//${window.location.hostname}:3008`;

let isApiReady = false;

/**
 * Check if API is available (called on welcome screen)
 */
export async function preloadModel(onProgress = () => {}) {
  try {
    onProgress(50);
    const response = await fetch(`${API_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      isApiReady = data.model_loaded;
      onProgress(100);
    }
  } catch (err) {
    console.warn('API health check failed:', err);
    onProgress(100);
  }
}

/**
 * Check if API is ready
 */
export function isModelReady() {
  return isApiReady;
}

/**
 * Remove background from an image using backend API
 * @param {Blob} imageBlob - Input image
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Blob>} - Image with transparent background (PNG)
 */
export async function removeImageBackground(imageBlob, onProgress = () => {}) {
  try {
    onProgress(10);

    const formData = new FormData();
    formData.append('file', imageBlob, 'image.jpg');

    onProgress(20);

    const response = await fetch(`${API_URL}/remove-background`, {
      method: 'POST',
      body: formData
    });

    onProgress(80);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'API error');
    }

    const resultBlob = await response.blob();
    onProgress(100);

    return resultBlob;
  } catch (error) {
    console.error('Background removal error:', error);
    throw new Error('Не удалось удалить фон. Попробуйте ещё раз.');
  }
}

/**
 * Process multiple images
 * @param {Blob[]} images
 * @param {Function} onProgress - Progress callback (0-100, imageIndex)
 * @returns {Promise<Blob[]>}
 */
export async function processMultipleImages(images, onProgress = () => {}) {
  const results = [];
  const total = images.length;

  for (let i = 0; i < total; i++) {
    const imageProgress = (progress) => {
      const baseProgress = (i / total) * 100;
      const contribution = (progress / 100) * (100 / total);
      onProgress(Math.round(baseProgress + contribution), i);
    };

    const processed = await removeImageBackground(images[i], imageProgress);
    results.push(processed);
  }

  return results;
}
