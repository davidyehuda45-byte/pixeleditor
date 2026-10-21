/**
 * Application actions shared by menus, shortcuts, the command palette, and
 * dialogs. These are thin orchestration layers over the framework-free core.
 */
import { PixelDocument } from '../core/document.js';
import { Palette, PaletteSet, parsePaletteFile, serializeGpl, serializeHex, serializeJasc, extractPalette, medianCut } from '../core/palette.js';
import { Selection } from '../core/selection.js';
import { parseProject, stringifyProject } from '../io/project.js';
import {
  pickFiles, readText, readBytes, saveFile, filesFromDrop, isPfxFile, isImageFile, isPaletteFile,
} from '../io/file.js';
import { saveAutosave, deleteAutosave } from '../io/autosave.js';
import { decodeImageFile, sliceSpriteSheet, convertToPixelArt } from '../io/imageImport.js';
import { encodePNGBlob } from '../io/png.js';
import { trimBounds, maskBounds, rotatePixels } from '../utils/raster.js';
import { translate } from '../i18n.js';
import {
  addLayer, deleteFrame, mergeLayerDown, flattenDocument, setPalette, applySelection,
  commitPixelEdit, undo, redo, selectionAll, selectionNone, selectionInvert, selectionGrow,
  applyCelEffect, runStructural, cropCanvas, resizeCanvas, setDocumentProps,
} from '../core/commands.js';
import { renderComposite } from '../core/compositor.js';
import { parseHex, toHex } from '../utils/color.js';
import { outline, dropShadow, removeIsolated, replaceColor, invertColors, grayscale, adjustColors } from '../core/effects.js';

const t = (store, key, vars) => translate(store.ui.language || 'id', key, vars);

let clipboard = null;

export function getClipboard() {
  return clipboard;
}

export function setClipboard(value) {
  clipboard = value;
}

// ---- Documents ----------------------------------------------------------

/** Create and activate a fresh document. */
export function newDocument(store, {
  width = 32, height = 32, title = null, background = null, grid = null, paletteColors = null,
} = {}) {
  const w = Math.max(1, Math.min(1024, Math.round(width)));
  const h = Math.max(1, Math.min(1024, Math.round(height)));
  const doc = PixelDocument.create({ width: w, height: h, title: title || 'Tanpa judul', layerName: 'Layer 1' });
  if (grid) doc.grid = { ...doc.grid, ...grid };
  if (background) {
    const cel = doc.cels.values().next().value;
    const color = parseHex(background);
    if (color[3] > 0) {
      const pixels = cel.ensurePixels();
      for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = color[0]; pixels[i + 1] = color[1]; pixels[i + 2] = color[2]; pixels[i + 3] = 255;
      }
    }
  }
  if (paletteColors?.length) {
    doc.palette = new PaletteSet({ palettes: [new Palette({ name: 'Imported', colors: paletteColors })], active: 0 });
  }
  const session = store.createSession(doc, { fileName: `${doc.title}.pfx`, dirty: false });
  store.setUI({ tool: 'pencil' });
  return session;
}

/** Validate and add a parsed .pfx document as a tab. */
export function openProjectText(store, text, { fileName = 'proyek.pfx', fileHandle = null, dirty = false } = {}) {
  const doc = parseProject(text);
  const existing = store.sessions.find((s) => s.doc.id === doc.id);
  if (existing) {
    store.setActiveSession(store.sessions.indexOf(existing));
    return existing;
  }
  const session = store.createSession(doc, { fileName, fileHandle, dirty });
  // Never leave a group as the active paint layer.
  const active = doc.getLayer(session.activeLayerId);
  if (!active || active.type !== 'layer') {
    const paint = [...doc.layers].reverse().find((l) => l.type === 'layer');
    if (paint) session.activeLayerId = paint.id;
  }
  return session;
}

export async function openProjectPicked(store, picked) {
  try {
    const text = await readText(picked);
    const session = openProjectText(store, text, { fileName: picked.name, fileHandle: picked.handle });
    store.toast(t(store, 'toast.imported'), 'success');
    return session;
  } catch (error) {
    store.toast(t(store, 'toast.openFailed', { message: error.message }), 'error', 4500);
    return null;
  }
}

export async function openProjectDialog(store) {
  const files = await pickFiles(['pfx'], { multiple: false });
  if (!files.length) return null;
  return openProjectPicked(store, files[0]);
}

export function autosaveRecord(store, session = store.activeSession, { clean = false } = {}) {
  if (!session?.doc) return null;
  return {
    id: session.doc.id,
    title: session.doc.title,
    fileName: session.fileName,
    width: session.doc.width,
    height: session.doc.height,
    frames: session.doc.frames.length,
    layers: session.doc.layers.length,
    dirty: clean ? false : !!session.dirty,
    pfx: stringifyProject(session.doc),
  };
}

export async function autosaveSession(store, session = store.activeSession) {
  if (!session?.doc || !store.ui.autoSave) return false;
  try {
    const record = autosaveRecord(store, session);
    const ok = await saveAutosave(record);
    if (ok) {
      session.autosaveAt = Date.now();
      store.emit('autosave:saved', { sessionId: session.id, at: session.autosaveAt });
    }
    return ok;
  } catch (error) {
    console.warn('[PixelForge] Autosave failed:', error);
    return false;
  }
}

export async function saveProject(store, { saveAs = false, copy = false } = {}) {
  const session = store.activeSession;
  if (!session) return null;
  const title = (session.doc.title || 'tanpa-judul').replace(/\\s+/g, '_').replace(/[\\\\/:*?\"<>|]/g, '-');
  let fileName = session.fileName || `${title}.pfx`;
  if (copy) fileName = fileName.replace(/\\.pfx$/i, '') + '_copy.pfx';
  try {
    const text = stringifyProject(session.doc);
    const result = await saveFile({
      name: fileName,
      data: text,
      mime: 'application/json',
      handle: copy ? null : session.fileHandle,
      saveAs: saveAs || copy,
    });
    if (result?.cancelled) return result;
    if (!copy) {
      store.markSaved(result.name || fileName, result.handle ?? session.fileHandle);
    }
    // Keep a clean autosave copy so the project appears in recents.
    const record = autosaveRecord(store, session, { clean: true });
    if (record) await saveAutosave({ ...record, fileName: result.name || fileName });
    store.toast(t(store, copy ? 'toast.savedCopy' : 'toast.saved', { name: result.name || fileName }), 'success');
    return result;
  } catch (error) {
    store.toast(t(store, 'toast.saveFailed', { message: error.message }), 'error', 4500);
    return null;
  }
}

export function requestCloseSession(store, sessionId = store.activeSession?.id) {
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return;
  if (session.dirty) {
    store.setDialog({ type: 'unsaved', sessionId, title: session.doc.title });
  } else {
    store.closeSession(sessionId);
    if (!store.sessions.length) newDocument(store);
  }
}

export function closeSessionNow(store, sessionId) {
  store.closeSession(sessionId);
  if (!store.sessions.length) newDocument(store);
}

export async function restoreAutosave(store, record) {
  try {
    if (!record?.pfx) throw new Error('Data autosave kosong.');
    const session = openProjectText(store, record.pfx, { fileName: record.fileName || 'autosave.pfx', dirty: true });
    store.toast(t(store, 'recovery.success'), 'success');
    return session;
  } catch (error) {
    store.toast(t(store, 'recovery.failed', { message: error.message }), 'error', 4500);
    return null;
  }
}

export async function discardAutosave(store, record) {
  if (!record?.id) return;
  await deleteAutosave(record.id);
  store.toast(t(store, 'toast.discarded'), 'info');
}

// ---- Canvas / images ----------------------------------------------------

function normalizeAlpha(data) {
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    out[i] = data[i]; out[i + 1] = data[i + 1]; out[i + 2] = data[i + 2]; out[i + 3] = 255;
  }
  return out;
}

function limitSize(width, height, max = 1024) {
  const scale = Math.min(1, max / width, max / height);
  return { width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale)) };
}

function buildDocFromFrames(frames, { title, palette = null, background = null } = {}) {
  const first = frames[0];
  const size = limitSize(first.width, first.height);
  const doc = PixelDocument.create({ width: size.width, height: size.height, title: title || 'Imported' });
  const layer = doc.layers[0];
  layer.name = 'Imported';
  const normalizedFrames = frames.map((frame) => {
    let data = normalizeAlpha(frame.data);
    if (frame.width !== size.width || frame.height !== size.height) {
      // Nearest downscale keeps hard edges.
      const out = new Uint8ClampedArray(size.width * size.height * 4);
      for (let y = 0; y < size.height; y++) for (let x = 0; x < size.width; x++) {
        const sx = Math.min(frame.width - 1, Math.floor((x * frame.width) / size.width));
        const sy = Math.min(frame.height - 1, Math.floor((y * frame.height) / size.height));
        const si = (sy * frame.width + sx) * 4, di = (y * size.width + x) * 4;
        out[di] = data[si]; out[di + 1] = data[si + 1]; out[di + 2] = data[si + 2]; out[di + 3] = data[si + 3];
      }
      data = out;
    }
    return { ...frame, data };
  });
  for (let i = 0; i < normalizedFrames.length; i++) {
    const frame = i === 0 ? doc.frames[0] : doc.addFrame({ duration: normalizedFrames[i].duration || 100 });
    frame.duration = Math.max(20, normalizedFrames[i].duration || 100);
    const cel = doc.ensureCel(layer.id, frame.id);
    cel.pixels = normalizedFrames[i].data;
    cel.width = size.width; cel.height = size.height; cel.x = 0; cel.y = 0;
  }
  if (background) {
    const color = parseHex(background);
    for (const cel of doc.cels.values()) {
      if (!cel.pixels) continue;
      for (let i = 0; i < cel.pixels.length; i += 4) {
        if (cel.pixels[i + 3]) continue;
        cel.pixels[i] = color[0]; cel.pixels[i + 1] = color[1]; cel.pixels[i + 2] = color[2]; cel.pixels[i + 3] = 255;
      }
    }
  }
  if (palette?.length) {
    doc.palette = new PaletteSet({ palettes: [new Palette({ name: 'Imported', colors: palette })], active: 0 });
  }
  return doc;
}

/** Place decoded pixels into a new layer in the active document. */
export function addImageLayer(store, decoded, { name = 'Imported', palette = null, center = true } = {}) {
  const session = store.activeSession;
  if (!session) return null;
  const doc = session.doc;
  let data = normalizeAlpha(decoded.data);
  if (palette?.length) {
    const converted = convertToPixelArt({ ...decoded, data }, { targetWidth: decoded.width, targetHeight: decoded.height, palette });
    data = converted.data;
  }
  const frameId = session.activeFrameId;
  runImportLayer(store, doc, frameId, decoded.width, decoded.height, data, name, center);
  return session;
}

function runImportLayer(store, doc, frameId, w, h, data, name, center) {
  const session = store.activeSession;
  if (!session) return null;
  return runStructural(store, 'Impor gambar', (d) => {
    const active = d.getLayer(session.activeLayerId);
    const parentId = active?.parentId ?? null;
    const layer = d.addLayer({
      name, parentId,
      index: active ? d.layers.findIndex((l) => l.id === active.id) + 1 : d.layers.length,
    });
    const cel = d.ensureCel(layer.id, frameId);
    const ox = center ? Math.floor((d.width - w) / 2) : 0;
    const oy = center ? Math.floor((d.height - h) / 2) : 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = x + ox, dy = y + oy;
      if (dx < 0 || dy < 0 || dx >= d.width || dy >= d.height) continue;
      const si = (y * w + x) * 4, di = (dy * d.width + dx) * 4;
      if (!data[si + 3]) continue;
      cel.pixels[di] = data[si]; cel.pixels[di + 1] = data[si + 1]; cel.pixels[di + 2] = data[si + 2]; cel.pixels[di + 3] = 255;
    }
    session.activeLayerId = layer.id;
    return layer;
  }, { icon: 'image' });
}

export async function importImagePicked(store, picked, opts = {}) {
  try {
    const decoded = await decodeImageFile(picked);
    const mode = opts.mode || 'document';
    const title = (picked.name || 'Imported').replace(/\\.[^.]+$/, '');
    if (mode === 'layer') {
      addImageLayer(store, decoded, { name: title, palette: opts.palette || null });
      store.toast(t(store, 'toast.imageImported'), 'success');
      return store.activeSession;
    }
    let frames = decoded.frames;
    if (!frames && opts.frameWidth && opts.frameHeight) {
      frames = sliceSpriteSheet(decoded, {
        frameWidth: opts.frameWidth, frameHeight: opts.frameHeight,
        columns: opts.columns || 0, rows: opts.rows || 0, margin: opts.margin || 0,
        spacing: opts.spacing || 0, count: opts.count || 0,
      });
    }
    if (frames) {
      if (opts.palette?.length) {
        frames = frames.map((f) => ({ ...f, ...convertToPixelArt(f, { targetWidth: f.width, targetHeight: f.height, palette: opts.palette, dither: opts.dither || 'none' }) }));
      }
      const doc = buildDocFromFrames(frames, { title, palette: opts.newPalette || null });
      const session = store.createSession(doc, { fileName: `${title}.pfx`, dirty: true });
      store.toast(t(store, 'toast.gifFrames', { n: frames.length }), 'success');
      return session;
    }
    let source = decoded;
    if (opts.targetWidth || opts.targetHeight || opts.convert) {
      const converted = convertToPixelArt(decoded, {
        targetWidth: opts.targetWidth, targetHeight: opts.targetHeight,
        palette: opts.palette || null, colorCount: opts.colorCount || 16, dither: opts.dither || 'none',
      });
      const doc = buildDocFromFrames([{ ...converted, duration: 100 }], { title, palette: opts.newPalette || converted.palette });
      const session = store.createSession(doc, { fileName: `${title}.pfx`, dirty: true });
      store.toast(t(store, 'toast.imageImported'), 'success');
      return session;
    }
    const size = limitSize(source.width, source.height);
    let data = normalizeAlpha(source.data);
    if (size.width !== source.width || size.height !== source.height) {
      const converted = convertToPixelArt(source, { targetWidth: size.width, targetHeight: size.height });
      data = converted.data;
      if (!opts.newPalette) opts.newPalette = converted.palette;
    }
    const doc = buildDocFromFrames([{ width: size.width, height: size.height, data, duration: 100 }], {
      title, palette: opts.newPalette || null, background: opts.background || null,
    });
    const session = store.createSession(doc, { fileName: `${title}.pfx`, dirty: true });
    store.toast(t(store, 'toast.imageImported'), 'success');
    return session;
  } catch (error) {
    store.toast(t(store, 'toast.importFailed', { message: error.message }), 'error', 4500);
    return null;
  }
}

export async function importPalettePicked(store, picked, { asNewSet = true } = {}) {
  try {
    const text = await readText(picked);
    const bytes = await readBytes(picked);
    const colors = parsePaletteFile(picked.name, text, bytes.buffer);
    if (!colors.length) throw new Error(t(store, 'toast.paletteInvalid'));
    const name = (picked.name || 'Palette').replace(/\\.[^.]+$/, '');
    if (asNewSet) {
      setPalette(store, (set) => {
        set.palettes.push(new Palette({ name, colors }));
        set.active = set.palettes.length - 1;
      }, 'Impor palette');
    } else {
      setPalette(store, (set) => {
        for (const c of colors) set.current.add(c);
      }, 'Impor warna');
    }
    store.toast(t(store, 'toast.paletteImported', { n: colors.length }), 'success');
    return colors;
  } catch (error) {
    store.toast(t(store, 'toast.importFailed', { message: error.message }), 'error', 4500);
    return null;
  }
}

export async function exportPaletteFile(store, format = 'gpl') {
  const palette = store.doc?.palette?.current;
  if (!palette) return null;
  const ext = format === 'hex' ? 'hex' : format === 'pal' ? 'pal' : 'gpl';
  const text = format === 'hex' ? serializeHex(palette) : format === 'pal' ? serializeJasc(palette) : serializeGpl(palette);
  try {
    const result = await saveFile({ name: `${palette.name || 'palette'}.${ext}`, data: text, mime: 'text/plain' });
    if (!result?.cancelled) store.toast(t(store, 'toast.paletteExported'), 'success');
    return result;
  } catch (error) {
    store.toast(t(store, 'toast.saveFailed', { message: error.message }), 'error', 4500);
    return null;
  }
}

/** Route files dropped onto the app or picked in the open dialog. */
export async function importDropped(store, dataTransfer) {
  const files = filesFromDrop(dataTransfer);
  return importPickedFiles(store, files);
}

export async function importPickedFiles(store, files) {
  let last = null;
  for (const picked of files) {
    if (isPfxFile(picked.name)) last = await openProjectPicked(store, picked);
    else if (isPaletteFile(picked.name)) last = await importPalettePicked(store, picked);
    else if (isImageFile(picked.name)) last = await importImagePicked(store, picked);
    else store.toast(t(store, 'dialog.open.invalid'), 'error');
  }
  return last;
}

// ---- Clipboard / transform ---------------------------------------------

function activeCelInfo(store) {
  const session = store.activeSession;
  if (!session) return null;
  const cel = session.doc.getCel(session.activeLayerId, session.activeFrameId);
  return { session, doc: session.doc, cel };
}

export function copySelection(store, { silent = false } = {}) {
  const info = activeCelInfo(store);
  if (!info?.cel?.pixels) {
    if (!silent) store.toast(t(store, 'toast.copyEmpty'), 'warn');
    return null;
  }
  const { doc, cel } = info;
  const hasSelection = doc.selection && !doc.selection.empty;
  const bounds = hasSelection ? maskBounds(doc.selection.mask, doc.width, doc.height) : trimBounds(cel.pixels, doc.width, doc.height);
  if (!bounds || !bounds.w) {
    if (!silent) store.toast(t(store, 'toast.copyEmpty'), 'warn');
    return null;
  }
  const data = new Uint8ClampedArray(bounds.w * bounds.h * 4);
  for (let y = 0; y < bounds.h; y++) for (let x = 0; x < bounds.w; x++) {
    const sx = bounds.x + x, sy = bounds.y + y;
    if (sx < 0 || sy < 0 || sx >= doc.width || sy >= doc.height) continue;
    if (hasSelection && !doc.selection.contains(sx, sy)) continue;
    const si = (sy * doc.width + sx) * 4, di = (y * bounds.w + x) * 4;
    data[di] = cel.pixels[si]; data[di + 1] = cel.pixels[si + 1];
    data[di + 2] = cel.pixels[si + 2]; data[di + 3] = cel.pixels[si + 3];
  }
  clipboard = {
    width: bounds.w, height: bounds.h, data, x: bounds.x, y: bounds.y,
    sourceTitle: doc.title, layerId: info.session.activeLayerId, frameId: info.session.activeFrameId,
  };
  // Best-effort system clipboard: all data stays local, but other apps can paste it.
  try {
    const blob = encodePNGBlob(data, bounds.w, bounds.h);
    if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).catch(() => {});
    }
  } catch {
    // System clipboard unsupported; internal clipboard still works.
  }
  if (!silent) store.toast(t(store, 'toast.copied'), 'success', 1600);
  return clipboard;
}

export function deleteSelectionContent(store) {
  const info = activeCelInfo(store);
  if (!info?.cel?.pixels) return false;
  const { doc, cel, session } = info;
  if (!doc.selection || doc.selection.empty) {
    store.toast(t(store, 'toast.noSelection'), 'warn', 1800);
    return false;
  }
  const before = cel.pixels.slice();
  let count = 0;
  for (let i = 0; i < doc.selection.mask.length; i++) {
    if (!doc.selection.mask[i]) continue;
    const p = i * 4;
    if (cel.pixels[p + 3]) count++;
    cel.pixels[p] = 0; cel.pixels[p + 1] = 0; cel.pixels[p + 2] = 0; cel.pixels[p + 3] = 0;
  }
  if (!count) return false;
  commitPixelEdit(store, 'Hapus isi seleksi', session.activeLayerId, session.activeFrameId, before, cel.pixels.slice(), { icon: 'eraser' });
  store.toast(t(store, 'toast.deleted'), 'success', 1600);
  return true;
}

export function cutSelection(store) {
  const copied = copySelection(store, { silent: true });
  if (!copied) {
    store.toast(t(store, 'toast.copyEmpty'), 'warn');
    return false;
  }
  deleteSelectionContent(store);
  store.toast(t(store, 'toast.cut'), 'success', 1600);
  return true;
}

async function readSystemClipboardImage() {
  if (!navigator.clipboard?.read || typeof ClipboardItem === 'undefined') return null;
  const items = await navigator.clipboard.read();
  for (const item of items) {
    const type = item.types.find((t) => t.startsWith('image/'));
    if (!type) continue;
    const blob = await item.getType(type);
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width; canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    return { width: canvas.width, height: canvas.height, data: imageData.data, x: 0, y: 0 };
  }
  return null;
}

export async function pasteClipboard(store, { asNewLayer = false, at = null } = {}) {
  let clip = clipboard;
  if (!clip) {
    try {
      clip = await readSystemClipboardImage();
      if (clip) clipboard = clip;
    } catch {
      clip = null;
    }
  }
  if (!clip) {
    store.toast(t(store, 'toast.nothingToPaste'), 'warn');
    return false;
  }
  const session = store.activeSession;
  if (!session) return false;
  if (asNewLayer) {
    const layer = addLayer(store, { name: 'Pasted' });
    if (!layer) return false;
  }
  const layerId = store.activeSession.activeLayerId;
  const frameId = store.activeSession.activeFrameId;
  const doc = store.activeSession.doc;
  const cel = doc.ensureCel(layerId, frameId);
  const before = cel.pixels.slice();
  const ox = at ? Math.round(at.x) : Math.round(clip.x || 0);
  const oy = at ? Math.round(at.y) : Math.round(clip.y || 0);
  for (let y = 0; y < clip.height; y++) for (let x = 0; x < clip.width; x++) {
    const dx = ox + x, dy = oy + y;
    if (dx < 0 || dy < 0 || dx >= doc.width || dy >= doc.height) continue;
    const si = (y * clip.width + x) * 4, di = (dy * doc.width + dx) * 4;
    if (!clip.data[si + 3]) continue;
    cel.pixels[di] = clip.data[si]; cel.pixels[di + 1] = clip.data[si + 1];
    cel.pixels[di + 2] = clip.data[si + 2]; cel.pixels[di + 3] = clip.data[si + 3];
  }
  commitPixelEdit(store, 'Tempel', layerId, frameId, before, cel.pixels.slice(), { icon: 'paste' });
  if (doc.selection) {
    doc.selection.clear();
    for (let y = 0; y < clip.height; y++) for (let x = 0; x < clip.width; x++) {
      const dx = ox + x, dy = oy + y;
      if (dx < 0 || dy < 0 || dx >= doc.width || dy >= doc.height) continue;
      if (clip.data[(y * clip.width + x) * 4 + 3]) doc.selection.mask[dy * doc.width + dx] = 1;
    }
    doc.selection.dirty = true;
    store.emit('selection:change');
  }
  store.toast(t(store, 'toast.pasted'), 'success', 1600);
  return true;
}

/** Arrow-key nudge. Moves selection content (and the selection) or layer pixels. */
export function nudgeContent(store, dx, dy) {
  const info = activeCelInfo(store);
  if (!info?.cel?.pixels) return false;
  const { doc, cel, session } = info;
  const before = cel.pixels.slice();
  const hasSelection = doc.selection && !doc.selection.empty;
  const mask = hasSelection ? doc.selection.mask.slice() : null;
  const src = before.slice();
  if (mask) for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    const p = i * 4;
    cel.pixels[p] = 0; cel.pixels[p + 1] = 0; cel.pixels[p + 2] = 0; cel.pixels[p + 3] = 0;
  } else {
    cel.pixels.fill(0);
  }
  for (let y = 0; y < doc.height; y++) for (let x = 0; x < doc.width; x++) {
    const i = y * doc.width + x;
    if (mask && !mask[i]) continue;
    const si = i * 4;
    if (!src[si + 3]) continue;
    const tx = x + dx, ty = y + dy;
    if (tx < 0 || ty < 0 || tx >= doc.width || ty >= doc.height) continue;
    const di = (ty * doc.width + tx) * 4;
    cel.pixels[di] = src[si]; cel.pixels[di + 1] = src[si + 1]; cel.pixels[di + 2] = src[si + 2]; cel.pixels[di + 3] = src[si + 3];
  }
  let afterMask = null;
  if (mask) {
    afterMask = new Uint8Array(mask.length);
    for (let y = 0; y < doc.height; y++) for (let x = 0; x < doc.width; x++) {
      if (!mask[y * doc.width + x]) continue;
      const tx = x + dx, ty = y + dy;
      if (tx < 0 || ty < 0 || tx >= doc.width || ty >= doc.height) continue;
      afterMask[ty * doc.width + tx] = 1;
    }
    doc.selection.mask.set(afterMask);
    doc.selection.dirty = true;
  }
  commitPixelEdit(store, 'Geser 1 px', session.activeLayerId, session.activeFrameId, before, cel.pixels.slice(), {
    icon: 'move', selectionBefore: mask, selectionAfter: afterMask,
  });
  store.emit('selection:change');
  return true;
}

export function flipActive(store, axis = 'h') {
  const info = activeCelInfo(store);
  if (!info?.cel?.pixels) return false;
  const { doc, cel, session } = info;
  const before = cel.pixels.slice();
  const mask = doc.selection && !doc.selection.empty ? doc.selection.mask : null;
  // Transform only the selected pixels when a selection exists; otherwise all.
  const src = before.slice();
  for (let y = 0; y < doc.height; y++) for (let x = 0; x < doc.width; x++) {
    const i = y * doc.width + x;
    if (mask && !mask[i]) continue;
    const tx = axis === 'h' ? doc.width - 1 - x : x;
    const ty = axis === 'v' ? doc.height - 1 - y : y;
    const si = i * 4, di = (ty * doc.width + tx) * 4;
    if (!mask) { cel.pixels[di] = src[si]; cel.pixels[di + 1] = src[si + 1]; cel.pixels[di + 2] = src[si + 2]; cel.pixels[di + 3] = src[si + 3]; }
    else if (src[si + 3]) { cel.pixels[di] = src[si]; cel.pixels[di + 1] = src[si + 1]; cel.pixels[di + 2] = src[si + 2]; cel.pixels[di + 3] = src[si + 3]; }
  }
  if (mask) {
    // Clear source pixels that were not overwritten by the mirrored selection.
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) continue;
      const p = i * 4;
      const x = i % doc.width, y = Math.floor(i / doc.width);
      const tx = axis === 'h' ? doc.width - 1 - x : x;
      const ty = axis === 'v' ? doc.height - 1 - y : y;
      if (mask[ty * doc.width + tx]) continue;
      cel.pixels[p] = 0; cel.pixels[p + 1] = 0; cel.pixels[p + 2] = 0; cel.pixels[p + 3] = 0;
    }
    const newMask = new Uint8Array(mask.length);
    for (let y = 0; y < doc.height; y++) for (let x = 0; x < doc.width; x++) {
      if (!mask[y * doc.width + x]) continue;
      const tx = axis === 'h' ? doc.width - 1 - x : x;
      const ty = axis === 'v' ? doc.height - 1 - y : y;
      newMask[ty * doc.width + tx] = 1;
    }
    doc.selection.mask.set(newMask);
    doc.selection.dirty = true;
  }
  commitPixelEdit(store, axis === 'h' ? 'Flip horizontal' : 'Flip vertikal', session.activeLayerId, session.activeFrameId, before, cel.pixels.slice(), { icon: 'transform' });
  store.emit('selection:change');
  return true;
}

export function applyEffect(store, effect, opts = {}) {
  const defs = {
    outline: { label: 'Outline', fn: (data, w, h, mask) => outline(data, w, h, { ...opts, mask }) },
    shadow: { label: 'Drop shadow', fn: (data, w, h, mask) => dropShadow(data, w, h, { ...opts, mask }) },
    isolated: { label: 'Hapus terisolasi', fn: (data, w, h, mask) => removeIsolated(data, w, h, mask) },
    replace: { label: 'Ganti warna', fn: (data, w, h, mask) => replaceColor(data, w, h, opts.from, opts.to, opts.tolerance || 0, mask) },
    invert: { label: 'Invert', fn: (data, w, h, mask) => invertColors(data, w, h, mask) },
    grayscale: { label: 'Grayscale', fn: (data, w, h, mask) => grayscale(data, w, h, mask) },
    adjust: { label: 'Sesuaikan warna', fn: (data, w, h, mask) => adjustColors(data, w, h, opts, mask) },
  };
  const def = defs[effect];
  if (!def) return false;
  const selectionOnly = opts.selectionOnly !== false;
  return applyCelEffect(store, def.label, (data, width, height) => {
    const mask = selectionOnly && store.doc.selection && !store.doc.selection.empty
      ? store.doc.selection.mask
      : null;
    return def.fn(data, width, height, mask);
  }, { icon: 'effects', selectionOnly });
}

// ---- Palette helpers -----------------------------------------------------

export function duplicatePalette(store) {
  const current = store.doc?.palette?.current;
  if (!current) return;
  setPalette(store, (set) => {
    const copy = current.clone();
    copy.name = `${current.name} copy`;
    set.palettes.push(copy);
    set.active = set.palettes.length - 1;
  }, 'Duplikat palette');
}

export function extractPaletteFromFrame(store, { maxColors = 32, median = true } = {}) {
  const session = store.activeSession;
  if (!session) return null;
  const doc = session.doc;
  const cel = doc.getCel(session.activeLayerId, session.activeFrameId);
  if (!cel?.pixels) return null;
  const colors = median ? medianCut(cel.pixels, maxColors) : extractPalette(cel.pixels, maxColors);
  if (!colors.length) return null;
  setPalette(store, (set) => {
    set.palettes.push(new Palette({ name: 'Extracted', colors }));
    set.active = set.palettes.length - 1;
  }, 'Ekstrak palette');
  return colors;
}

function localize(store, key, vars) {
  return translate(store.ui.language || 'id', key, vars);
}

function rotateRect(rect, docWidth, docHeight, degrees) {
  const { x, y, w, h } = rect;
  if (degrees === 180) return { ...rect, x: docWidth - x - w, y: docHeight - y - h };
  if (degrees === 90) return { ...rect, x: docHeight - y - h, y: x, w: h, h: w };
  return { ...rect, x: y, y: docWidth - x - w, w: h, h: w };
}

/** Rotate the whole canvas and every cel by 90, 180 or 270 degrees. */
export function rotateDocument(store, degrees = 90) {
  const session = store.activeSession;
  if (!session) return false;
  const deg = ((degrees % 360) + 360) % 360;
  if (![90, 180, 270].includes(deg)) return false;
  const w = session.doc.width, h = session.doc.height;
  const ok = runStructural(store, deg === 180 ? 'Putar 180°' : deg === 90 ? 'Putar 90°' : 'Putar 270°', (d) => {
    const seen = new Set();
    for (const cel of d.cels.values()) {
      if (seen.has(cel)) continue;
      seen.add(cel);
      const cw = cel.width || w, ch = cel.height || h;
      if (cel.pixels) {
        const result = rotatePixels(cel.pixels, cw, ch, deg);
        cel.pixels = result.data;
        cel.width = result.width;
        cel.height = result.height;
      } else {
        cel.width = deg === 180 ? cw : ch;
        cel.height = deg === 180 ? ch : cw;
      }
      cel.x = 0; cel.y = 0;
    }
    if (deg !== 180) { d.width = h; d.height = w; }
    d.selection = new Selection(d.width, d.height);
    d.slices = (d.slices || []).map((s) => ({ ...s, rect: rotateRect(s.rect || s, w, h, deg) }));
    d.hitboxes = (d.hitboxes || []).map((s) => ({ ...s, rect: rotateRect(s.rect || s, w, h, deg) }));
    d.anchors = (d.anchors || []).map((a) => ({ ...a, x: deg === 180 ? w - a.x : h - a.y, y: deg === 180 ? h - a.y : a.x }));
    d.grid = { ...d.grid, w: d.grid.h, h: d.grid.w };
  }, { icon: 'rotate-cw' });
  if (ok) {
    store.emit('selection:change');
    store.emit('doc:change', { reason: 'rotate' });
    store.toast(localize(store, 'toast.rotated', { deg }), 'success', 1600);
  }
  return ok;
}

/** Crop the canvas to the current selection. */
export function cropToSelection(store) {
  const doc = store.doc;
  if (!doc?.selection || doc.selection.empty) {
    store.toast(localize(store, 'toast.noSelection'), 'warn');
    return false;
  }
  const rect = doc.selection.bounds;
  if (!rect) return false;
  const ok = cropCanvas(store, rect);
  if (ok) {
    store.emit('selection:change');
    store.toast(localize(store, 'toast.cropped'), 'success', 1600);
  }
  return ok;
}

/** Crop the canvas to the opaque bounds of the animation. */
export function trimToContent(store) {
  const session = store.activeSession;
  if (!session) return false;
  const doc = session.doc;
  let union = null;
  for (const frame of doc.frames) {
    const composite = renderComposite(doc, frame.id).data;
    const bounds = trimBounds(composite, doc.width, doc.height);
    if (!bounds) continue;
    if (!union) union = { ...bounds };
    else {
      const x = Math.min(union.x, bounds.x);
      const y = Math.min(union.y, bounds.y);
      const x2 = Math.max(union.x + union.w, bounds.x + bounds.w);
      const y2 = Math.max(union.y + union.h, bounds.y + bounds.h);
      union = { x, y, w: x2 - x, h: y2 - y };
    }
  }
  if (!union) {
    store.toast(localize(store, 'dialog.resize.trimEmpty'), 'warn');
    return false;
  }
  if (union.x === 0 && union.y === 0 && union.w === doc.width && union.h === doc.height) {
    store.toast(localize(store, 'toast.nothingToTrim'), 'info');
    return false;
  }
  const ok = cropCanvas(store, union);
  if (ok) {
    store.emit('selection:change');
    store.toast(localize(store, 'toast.cropped'), 'success', 1600);
  }
  return ok;
}

/** Select the opaque pixels of the active layer. */
export function selectLayerAlpha(store, { mode = 'replace' } = {}) {
  const session = store.activeSession;
  if (!session) return false;
  const cel = session.doc.getCel(session.activeLayerId, session.activeFrameId);
  if (!cel?.pixels) {
    store.toast(localize(store, 'toast.copyEmpty'), 'warn');
    return false;
  }
  const mask = new Uint8Array(session.doc.width * session.doc.height);
  for (let i = 0; i < mask.length; i++) mask[i] = cel.pixels[i * 4 + 3] > 0 ? 1 : 0;
  applySelection(store, mask, { mode, label: 'Pilih alpha layer' });
  return true;
}

/** Select pixels close to a colour in the composited image. */
export function selectByColor(store, hex, { tolerance = 0 } = {}) {
  const session = store.activeSession;
  if (!session) return false;
  const composite = renderComposite(session.doc, session.activeFrameId).data;
  const target = parseHex(hex);
  const tol = Math.max(0, tolerance);
  const mask = new Uint8Array(session.doc.width * session.doc.height);
  for (let i = 0; i < mask.length; i++) {
    const p = i * 4;
    if (composite[p + 3] === 0) continue;
    const d = Math.max(
      Math.abs(composite[p] - target[0]),
      Math.abs(composite[p + 1] - target[1]),
      Math.abs(composite[p + 2] - target[2]),
    );
    if (d <= tol) mask[i] = 1;
  }
  applySelection(store, mask, { label: 'Pilih warna' });
  return true;
}

/** Set document title/background/pixel aspect with undo. */
export function renameDocument(store, title) {
  if (!store.doc) return false;
  const clean = String(title || '').trim();
  if (!clean) return false;
  setDocumentProps(store, { title: clean }, 'Ganti judul');
  return true;
}

/** Close all tabs, prompting once when any tab is dirty. */
export function requestCloseAll(store) {
  const dirty = store.sessions.filter((s) => s.dirty);
  const closeAll = () => {
    store.closeAll();
    newDocument(store);
  };
  if (dirty.length) {
    store.askConfirm({
      title: localize(store, 'confirm.closeAll.title'),
      message: localize(store, 'confirm.closeAll.message', { n: dirty.length }),
      confirmLabel: localize(store, 'confirm.closeAll.confirm'),
      danger: true,
      onConfirm: closeAll,
    });
  } else {
    closeAll();
  }
}

export { undo, redo, selectionAll, selectionNone, selectionInvert, selectionGrow, mergeLayerDown, flattenDocument, deleteFrame, resizeCanvas };
