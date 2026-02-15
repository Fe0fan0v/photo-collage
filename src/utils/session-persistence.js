/**
 * Session Persistence
 * Saves/restores app state to sessionStorage so it survives phone lock/reload
 */

const STORAGE_KEY = 'seletti_hybrid_session';

/**
 * Save current app state to sessionStorage
 * Photos are stored as base64 data URLs
 */
export async function saveSession(screenName, state) {
  try {
    const data = {
      screen: screenName,
      selectedPlate: state.selectedPlate,
      collageDataUrl: state.collageDataUrl,
      emails: state.emails,
      photos: []
    };

    // Convert photo blobs to base64 data URLs for storage
    for (const blob of state.photos) {
      if (blob) {
        const dataUrl = await blobToDataUrl(blob);
        data.photos.push(dataUrl);
      }
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save session:', e);
  }
}

/**
 * Restore saved session from sessionStorage
 * Returns null if no saved session or on error
 */
export async function restoreSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (!data.screen) return null;

    // Don't restore to transient screens — fall back to a safe screen
    const transientScreens = ['processing', 'success', 'final'];
    let screen = data.screen;
    if (transientScreens.includes(screen)) {
      if (data.photos && data.photos.length >= 2) {
        screen = 'photosReady';
      } else {
        screen = 'camera';
      }
    }

    // Convert base64 data URLs back to Blobs
    const photos = [];
    if (data.photos) {
      for (const dataUrl of data.photos) {
        if (dataUrl) {
          photos.push(dataUrlToBlob(dataUrl));
        }
      }
    }

    return {
      screen,
      state: {
        photos,
        selectedPlate: data.selectedPlate ?? null,
        collageDataUrl: data.collageDataUrl ?? null,
        emails: data.emails ?? []
      }
    };
  } catch (e) {
    console.warn('Failed to restore session:', e);
    clearSession();
    return null;
  }
}

/**
 * Clear saved session
 */
export function clearSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore
  }
}

// --- helpers ---

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const [header, b64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }
  return new Blob([arr], { type: mime });
}
