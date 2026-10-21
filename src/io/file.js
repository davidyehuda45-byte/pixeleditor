/**
 * Local file helpers. Prefers the File System Access API and falls back to
 * ordinary file inputs/downloads in Firefox and Safari. No upload ever occurs.
 */

export const FILE_KINDS = {
  pfx: {
    description: 'PixelForge project',
    accept: { 'application/json': ['.pfx'] },
    extensions: ['.pfx'],
  },
  image: {
    description: 'Image',
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'], 'image/gif': ['.gif'] },
    extensions: ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
  },
  palette: {
    description: 'Palette',
    accept: {
      'text/plain': ['.gpl', '.hex', '.pal'],
      'application/octet-stream': ['.act'],
    },
    extensions: ['.gpl', '.hex', '.pal', '.act'],
  },
  json: {
    description: 'JSON metadata',
    accept: { 'application/json': ['.json'] },
    extensions: ['.json'],
  },
};

export function supportsFileSystemAccess() {
  return typeof window !== 'undefined' && typeof window.showOpenFilePicker === 'function' && typeof window.showSaveFilePicker === 'function';
}

export function extensionOf(name = '') {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx).toLowerCase() : '';
}

export function isPfxFile(name) {
  return extensionOf(name) === '.pfx';
}

export function isImageFile(name) {
  return ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(extensionOf(name));
}

export function isPaletteFile(name) {
  return ['.gpl', '.hex', '.pal', '.act'].includes(extensionOf(name));
}

export function isJsonFile(name) {
  return extensionOf(name) === '.json';
}

function combinedTypes(kinds) {
  return kinds.map((k) => FILE_KINDS[k]).filter(Boolean);
}

function acceptAttribute(kinds) {
  return kinds.flatMap((k) => FILE_KINDS[k]?.extensions || []).join(',');
}

/** Pick one or more local files. Returns [] when cancelled. */
export async function pickFiles(kinds = ['pfx', 'image', 'palette'], { multiple = false, description = 'Pilih berkas' } = {}) {
  if (supportsFileSystemAccess()) {
    try {
      const handles = await window.showOpenFilePicker({
        multiple,
        types: combinedTypes(kinds),
        excludeAcceptAllOption: false,
      });
      const files = [];
      for (const handle of handles) {
        const file = await handle.getFile();
        files.push({ file, handle, name: file.name, size: file.size, type: file.type });
      }
      return files;
    } catch (error) {
      if (error?.name === 'AbortError') return [];
      // Some environments expose the API but deny it (permissions/policy).
    }
  }
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptAttribute(kinds);
    input.multiple = multiple;
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    let settled = false;
    const finish = (files) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(files);
    };
    input.addEventListener('change', () => {
      const list = Array.from(input.files || []).map((file) => ({ file, handle: null, name: file.name, size: file.size, type: file.type }));
      finish(list);
    });
    window.addEventListener('focus', () => {
      setTimeout(() => {
        if (!input.files || !input.files.length) finish([]);
      }, 600);
    }, { once: true });
    document.body.appendChild(input);
    input.click();
    // Description is only used by the native picker; kept for API symmetry.
    void description;
  });
}

export async function readText(picked) {
  if (!picked?.file) return '';
  return picked.file.text();
}

export async function readArrayBuffer(picked) {
  if (!picked?.file) return new ArrayBuffer(0);
  return picked.file.arrayBuffer();
}

export async function readBytes(picked) {
  return new Uint8Array(await readArrayBuffer(picked));
}

export function toBlob(data, mime = 'application/octet-stream') {
  if (data instanceof Blob) return data;
  if (typeof data === 'string') return new Blob([data], { type: mime });
  if (data instanceof ArrayBuffer) return new Blob([data], { type: mime });
  if (ArrayBuffer.isView(data)) return new Blob([data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)], { type: mime });
  return new Blob([JSON.stringify(data)], { type: mime });
}

function downloadBlob(name, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name || 'download';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function savePickerOptions(name, mime) {
  const ext = extensionOf(name) || '.bin';
  const accept = {};
  const clean = (mime || 'application/octet-stream').split(';')[0];
  accept[clean || 'application/octet-stream'] = [ext];
  return {
    suggestedName: name || 'untitled',
    types: [{ description: 'PixelForge export', accept }],
  };
}

/**
 * Save binary/text data, reusing an existing FileSystemFileHandle when
 * available. Returns `{ name, handle }`; on browser fallback the file is
 * downloaded and `handle` is null.
 */
export async function saveFile({ name, data, mime = 'application/octet-stream', handle = null, saveAs = false } = {}) {
  const blob = toBlob(data, mime);
  if (supportsFileSystemAccess()) {
    try {
      let target = handle;
      if (!target || saveAs) {
        target = await window.showSaveFilePicker(savePickerOptions(name, mime));
      } else if (target.queryPermission) {
        const permission = await target.queryPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          const requested = await target.requestPermission({ mode: 'readwrite' });
          if (requested !== 'granted') throw new Error('Izin tulis berkas ditolak.');
        }
      }
      const writable = await target.createWritable();
      await writable.write(blob);
      await writable.close();
      return { name: target.name || name, handle: target };
    } catch (error) {
      if (error?.name === 'AbortError') return { cancelled: true, name, handle: null };
      if (error?.name === 'SecurityError' || !handle) {
        // Fall through to download on permission/policy failures.
      } else {
        throw error;
      }
    }
  }
  downloadBlob(name, blob);
  return { name, handle: null, downloaded: true };
}

/** Save several files. ZIP bundling is handled by callers. */
export async function downloadFiles(files = []) {
  for (const file of files) {
    if (!file?.data) continue;
    downloadBlob(file.name, toBlob(file.data, file.type || 'application/octet-stream'));
    await new Promise((resolve) => setTimeout(resolve, 90));
  }
}

export function downloadSingle(file) {
  downloadBlob(file.name, toBlob(file.data, file.type || 'application/octet-stream'));
}

export async function writeHandle(handle, data, mime = 'application/octet-stream') {
  const writable = await handle.createWritable();
  await writable.write(toBlob(data, mime));
  await writable.close();
}

/** Turn a drop event into picked-file records. */
export function filesFromDrop(dataTransfer) {
  return Array.from(dataTransfer?.files || []).map((file) => ({
    file, handle: null, name: file.name, size: file.size, type: file.type,
  }));
}
