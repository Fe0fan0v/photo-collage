/**
 * Background Removal Service
 * Uses @imgly/background-removal to remove background from photos
 */

import { removeBackground, preload } from '@imgly/background-removal';

let isModelPreloaded = false;
let preloadPromise = null;

/**
 * Preload the background removal model
 * Call this early (e.g., on welcome screen) to download the model in advance
 */
export async function preloadModel() {
  if (isModelPreloaded || preloadPromise) {
    return preloadPromise;
  }

  console.log('Preloading background removal model...');

  preloadPromise = preload({
    model: 'medium'
  }).then(() => {
    isModelPreloaded = true;
    console.log('Background removal model preloaded!');
  }).catch(err => {
    console.warn('Model preload failed:', err);
  });

  return preloadPromise;
}

/**
 * Check if model is preloaded
 */
export function isModelReady() {
  return isModelPreloaded;
}

/**
 * Remove background from an image
 * @param {Blob} imageBlob - Input image
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Blob>} - Image with transparent background (PNG)
 */
export async function removeImageBackground(imageBlob, onProgress = () => {}) {
  try {
    const config = {
      model: 'medium',
      output: {
        format: 'image/png',
        quality: 0.9
      },
      progress: (key, current, total) => {
        let progress = 0;
        if (key === 'fetch:model') {
          progress = Math.round((current / total) * 50);
        } else if (key === 'compute:inference') {
          progress = 50 + Math.round((current / total) * 50);
        }
        onProgress(progress);
      }
    };

    const result = await removeBackground(imageBlob, config);
    return result;
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
