/**
 * Session Persistence
 * Saves/restores app state so it survives phone lock/reload
 * Uses IndexedDB for large data (photos, collage) — no 5MB limit
 * Uses sessionStorage for lightweight metadata (screen, plate index)
 */

const DB_NAME = 'seletti_hybrid';
const DB_VERSION = 1;
const STORE_NAME = 'session';
const META_KEY = 'seletti_hybrid_meta';

/**
 * Open IndexedDB connection
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Put a value into IndexedDB
 */
function idbPut(db, key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get a value from IndexedDB
 */
function idbGet(db, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clear all data from IndexedDB store
 */
function idbClear(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Save current app state
 * Photos stored as Blobs in IndexedDB (no base64, no size limit)
 */
export async function saveSession(screenName, state) {
  try {
    const db = await openDB();

    // Store photos as raw Blobs in IndexedDB
    for (let i = 0; i < state.photos.length; i++) {
      if (state.photos[i]) {
        await idbPut(db, `photo_${i}`, state.photos[i]);
      }
    }
    await idbPut(db, 'photoCount', state.photos.length);

    // Store collage data URL if present
    if (state.collageDataUrl) {
      await idbPut(db, 'collageDataUrl', state.collageDataUrl);
    }

    db.close();

    // Lightweight metadata in sessionStorage
    sessionStorage.setItem(META_KEY, JSON.stringify({
      screen: screenName,
      selectedPlate: state.selectedPlate,
      emails: state.emails,
      hasCollage: !!state.collageDataUrl
    }));
  } catch (e) {
    console.warn('Failed to save session:', e);
  }
}

/**
 * Restore saved session
 * Returns null if no saved session or on error
 */
export async function restoreSession() {
  try {
    const raw = sessionStorage.getItem(META_KEY);
    if (!raw) return null;

    const meta = JSON.parse(raw);
    if (!meta.screen) return null;

    // Don't restore to processing screen (it requires active work)
    let screen = meta.screen;
    if (screen === 'processing') {
      screen = meta.hasCollage ? 'final' : 'photosReady';
    }
    // Restore success/final only if collage exists, otherwise fall back
    if ((screen === 'success' || screen === 'final') && !meta.hasCollage) {
      screen = 'photosReady';
    }

    const db = await openDB();

    // Restore photos as Blobs
    const photoCount = (await idbGet(db, 'photoCount')) || 0;
    const photos = [];
    for (let i = 0; i < photoCount; i++) {
      const blob = await idbGet(db, `photo_${i}`);
      if (blob) photos.push(blob);
    }

    // Fallback: if restoring to photosReady but not enough photos
    if (screen === 'photosReady' && photos.length < 2) {
      screen = 'camera';
    }

    // Restore collage
    let collageDataUrl = null;
    if (meta.hasCollage) {
      collageDataUrl = await idbGet(db, 'collageDataUrl');
    }

    db.close();

    return {
      screen,
      state: {
        photos,
        selectedPlate: meta.selectedPlate ?? null,
        collageDataUrl: collageDataUrl ?? null,
        emails: meta.emails ?? []
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
    sessionStorage.removeItem(META_KEY);
  } catch (e) {
    // ignore
  }
  try {
    openDB().then(db => {
      idbClear(db).then(() => db.close());
    });
  } catch (e) {
    // ignore
  }
}
