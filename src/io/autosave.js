/**
 * IndexedDB autosave store. Projects are serialized `.pfx` strings, so recovery
 * goes through the same validated deserializer as a normal file open.
 */
const DB_NAME = 'pixelforge';
const DB_VERSION = 1;
const STORE = 'autosaves';
const MAX_AUTOSAVES = 12;

let dbPromise = null;

function openDB() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB gagal dibuka.'));
  }).catch((error) => {
    console.warn('[PixelForge] IndexedDB unavailable:', error);
    return null;
  });
  return dbPromise;
}

function requestAsPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction(mode, fn) {
  const db = await openDB();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    let result;
    try {
      result = fn(store);
    } catch (error) {
      reject(error);
      return;
    }
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transaksi IndexedDB dibatalkan.'));
  });
}

export async function saveAutosave(record) {
  if (!record?.id || !record?.pfx) return false;
  const entry = {
    id: String(record.id),
    title: String(record.title || 'Tanpa judul'),
    fileName: String(record.fileName || 'untitled.pfx'),
    updatedAt: Date.now(),
    width: record.width || 0,
    height: record.height || 0,
    frames: record.frames || 0,
    layers: record.layers || 0,
    dirty: !!record.dirty,
    pfx: String(record.pfx),
  };
  try {
    const result = await transaction('readwrite', (store) => requestAsPromise(store.put(entry)));
    await pruneAutosaves();
    return !!result || true;
  } catch (error) {
    console.warn('[PixelForge] Autosave failed:', error);
    return false;
  }
}

export async function listAutosaves() {
  try {
    const result = await transaction('readonly', (store) => requestAsPromise(store.getAll()));
    return (result || [])
      .filter((entry) => entry && entry.id && entry.pfx)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (error) {
    console.warn('[PixelForge] Could not list autosaves:', error);
    return [];
  }
}

export async function getAutosave(id) {
  if (!id) return null;
  try {
    return await transaction('readonly', (store) => requestAsPromise(store.get(String(id))));
  } catch {
    return null;
  }
}

export async function deleteAutosave(id) {
  if (!id) return false;
  try {
    await transaction('readwrite', (store) => requestAsPromise(store.delete(String(id))));
    return true;
  } catch {
    return false;
  }
}

export async function clearAutosaves() {
  try {
    await transaction('readwrite', (store) => requestAsPromise(store.clear()));
    return true;
  } catch {
    return false;
  }
}

async function pruneAutosaves() {
  try {
    const entries = await listAutosaves();
    for (const entry of entries.slice(MAX_AUTOSAVES)) await deleteAutosave(entry.id);
  } catch {
    // Pruning is best-effort.
  }
}

export { MAX_AUTOSAVES };
