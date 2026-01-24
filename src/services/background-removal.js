/**
 * Background Removal Service
 * Uses Python backend with rembg for background removal
 * Now includes face detection for accurate positioning
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
 * Process face: remove background and detect face position
 * @param {Blob} imageBlob - Input image
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<{image: string, face: Object, width: number, height: number}>}
 */
export async function processFace(imageBlob, onProgress = () => {}) {
  try {
    onProgress(10);

    const formData = new FormData();
    formData.append('file', imageBlob, 'image.jpg');

    onProgress(20);

    const response = await fetch(`${API_URL}/process-face`, {
      method: 'POST',
      body: formData
    });

    onProgress(80);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'API error');
    }

    const result = await response.json();
    onProgress(100);

    return result;
  } catch (error) {
    console.error('Face processing error:', error);
    throw new Error('Не удалось обработать фото. Попробуйте ещё раз.');
  }
}

/**
 * Process multiple faces
 * @param {Blob[]} images
 * @param {Function} onProgress - Progress callback (0-100, imageIndex)
 * @returns {Promise<Array<{image: string, face: Object, width: number, height: number}>>}
 */
export async function processMultipleFaces(images, onProgress = () => {}) {
  const results = [];
  const total = images.length;

  for (let i = 0; i < total; i++) {
    const imageProgress = (progress) => {
      const baseProgress = (i / total) * 100;
      const contribution = (progress / 100) * (100 / total);
      onProgress(Math.round(baseProgress + contribution), i);
    };

    const processed = await processFace(images[i], imageProgress);
    results.push(processed);
  }

  return results;
}
