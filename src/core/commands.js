import { changedBounds } from '../utils/raster.js';
import { Selection } from './selection.js';
import { Palette } from './palette.js';

/** Approximate memory footprint of a document snapshot for history limits. */
export function estimateDocSize(doc) {
  let bytes = 512;
  const seen = new Set();
  for (const cel of doc.cels.values()) {
    if (cel.pixels && !seen.has(cel)) { bytes += cel.pixels.byteLength; seen.add(cel); }
  }
  return bytes;
}

function pushEntry(store, entry, { dirty = true } = {}) {
  const session = store.activeSession;
  if (!session) return false;
  session.history.push(entry);
  if (dirty) session.dirty = true;
  store.emit('history:change', { label: entry.label });
  if (dirty) store.emit('doc:change', { reason: entry.label });
  return true;
}

/**
 * Generic structural command: snapshots before/after and restores by clone.
 * Use for layer/frame/canvas operations where correctness is critical.
 */
export function runStructural(store, label, fn, { icon = null } = {}) {
  const session = store.activeSession;
  if (!session) return false;
  const activeBefore = { layer: session.activeLayerId, frame: session.activeFrameId };
  const before = session.doc.clone();
  const result = fn(session.doc, session);
  if (result === false) {
    session.doc = before;
    session.activeLayerId = activeBefore.layer;
    session.activeFrameId = activeBefore.frame;
    store.emit('doc:change', { reason: label, cancelled: true });
    return false;
  }
  if (!session.doc.getLayer(session.activeLayerId)) session.activeLayerId = session.doc.layers[session.doc.layers.length - 1]?.id || null;
  if (!session.doc.getFrame(session.activeFrameId)) session.activeFrameId = session.doc.frames[0]?.id || null;
  const activeAfter = { layer: session.activeLayerId, frame: session.activeFrameId };
  const after = session.doc.clone();
  const entry = {
    label, icon,
    size: estimateDocSize(before) + estimateDocSize(after),
    undo: () => {
      session.doc = before.clone();
      session.activeLayerId = activeBefore.layer && session.doc.getLayer(activeBefore.layer) ? activeBefore.layer : session.doc.layers[session.doc.layers.length - 1]?.id || null;
      session.activeFrameId = activeBefore.frame && session.doc.getFrame(activeBefore.frame) ? activeBefore.frame : session.doc.frames[0]?.id || null;
      store.emit('doc:replaced', { reason: 'undo' });
    },
    redo: () => {
      session.doc = after.clone();
      session.activeLayerId = activeAfter.layer && session.doc.getLayer(activeAfter.layer) ? activeAfter.layer : session.doc.layers[session.doc.layers.length - 1]?.id || null;
      session.activeFrameId = activeAfter.frame && session.doc.getFrame(activeAfter.frame) ? activeAfter.frame : session.doc.frames[0]?.id || null;
      store.emit('doc:replaced', { reason: 'redo' });
    },
  };
  const ok = pushEntry(store, entry);
  store.emit('doc:change', { reason: label });
  return ok ? result : false;
}

export function undo(store) {
  const session = store.activeSession;
  if (!session?.history.canUndo) return false;
  const entry = session.history.undo();
  session.dirty = true;
  store.emit('doc:replaced', { reason: 'undo', label: entry?.label });
  store.emit('history:change');
  store.emit('doc:change');
  return true;
}

export function redo(store) {
  const session = store.activeSession;
  if (!session?.history.canRedo) return false;
  const entry = session.history.redo();
  session.dirty = true;
  store.emit('doc:replaced', { reason: 'redo', label: entry?.label });
  store.emit('history:change');
  store.emit('doc:change');
  return true;
}

export function jumpHistory(store, index) {
  const session = store.activeSession;
  if (!session) return;
  session.history.jumpTo(index);
  session.dirty = true;
  store.emit('doc:replaced', { reason: 'history-jump' });
  store.emit('history:change');
  store.emit('doc:change');
}

// ---- Pixel edits ---------------------------------------------------------

function extractRect(data, width, rect) {
  const out = new Uint8ClampedArray(rect.w * rect.h * 4);
  for (let y = 0; y < rect.h; y++) {
    const src = ((rect.y + y) * width + rect.x) * 4;
    const dst = y * rect.w * 4;
    out.set(data.subarray(src, src + rect.w * 4), dst);
  }
  return out;
}

function writeRect(cel, rect, source) {
  const w = cel.width;
  for (let y = 0; y < rect.h; y++) {
    const cy = rect.y + y;
    if (cy < 0 || cy >= cel.height) continue;
    for (let x = 0; x < rect.w; x++) {
      const cx = rect.x + x;
      if (cx < 0 || cx >= cel.width) continue;
      const si = (y * rect.w + x) * 4;
      const di = (cy * w + cx) * 4;
      cel.pixels[di] = source[si];
      cel.pixels[di + 1] = source[si + 1];
      cel.pixels[di + 2] = source[si + 2];
      cel.pixels[di + 3] = source[si + 3];
    }
  }
}

/**
 * Push a pixel diff. `before` and `after` are full-canvas RGBA buffers.
 * Only the changed bounding rect is stored.
 */
export function commitPixelEdit(store, label, layerId, frameId, before, after, { icon = 'pencil', selectionBefore = null, selectionAfter = null } = {}) {
  const doc = store.doc;
  if (!doc) return false;
  const rect = changedBounds(before, after, doc.width, doc.height);
  if (!rect) return false;
  const beforeRect = extractRect(before, doc.width, rect);
  const afterRect = extractRect(after, doc.width, rect);
  const applySelection = (mask) => {
    const d = store.doc;
    if (!d?.selection || !mask || mask.length !== d.selection.mask.length) return;
    d.selection.mask.set(mask);
    store.emit('selection:change');
  };
  const apply = (buffer, mask) => {
    const d = store.doc;
    const cel = d?.getCel(layerId, frameId);
    if (!cel) return;
    if (!cel.pixels) cel.ensurePixels();
    if (cel.width !== d.width || cel.height !== d.height) return; // stale, size changed
    writeRect(cel, rect, buffer);
    applySelection(mask);
    store.emit('pixels:changed', { layerId, frameId, rect: { ...rect }, full: false });
    store.emit('doc:change', { reason: label });
  };
  const entry = {
    label, icon,
    size: beforeRect.byteLength + afterRect.byteLength + (selectionBefore?.length || 0) + (selectionAfter?.length || 0),
    undo: () => apply(beforeRect, selectionBefore),
    redo: () => apply(afterRect, selectionAfter),
  };
  const ok = pushEntry(store, entry);
  store.emit('pixels:changed', { layerId, frameId, rect: { ...rect }, full: false });
  return ok;
}

/** Replace an entire cel buffer with a pixel-diff command. */
export function applyCelBuffer(store, label, data, { layerId = null, frameId = null, icon = 'wand' } = {}) {
  const doc = store.doc;
  const session = store.activeSession;
  if (!doc || !session) return false;
  layerId = layerId || session.activeLayerId;
  frameId = frameId || session.activeFrameId;
  const cel = doc.getCel(layerId, frameId);
  if (!cel) return false;
  const before = cel.pixels ? cel.pixels.slice() : new Uint8ClampedArray(doc.width * doc.height * 4);
  doc.ensureCel(layerId, frameId);
  cel.pixels.set(data.subarray(0, cel.pixels.length));
  const after = cel.pixels.slice();
  return commitPixelEdit(store, label, layerId, frameId, before, after, { icon });
}

/** Apply a pure function to the active cel and commit a pixel diff. */
export function applyCelEffect(store, label, fn, { layerId = null, frameId = null, icon = 'wand', selectionOnly = true } = {}) {
  const doc = store.doc;
  const session = store.activeSession;
  if (!doc || !session) return false;
  layerId = layerId || session.activeLayerId;
  frameId = frameId || session.activeFrameId;
  const cel = doc.getCel(layerId, frameId);
  if (!cel) return false;
  const before = cel.pixels ? cel.pixels.slice() : new Uint8ClampedArray(doc.width * doc.height * 4);
  const base = before.slice();
  const mask = selectionOnly && !doc.selection.empty ? doc.selection.mask : null;
  const result = fn(base, doc.width, doc.height, mask, doc);
  doc.ensureCel(layerId, frameId);
  cel.pixels.set(result.subarray(0, cel.pixels.length));
  return commitPixelEdit(store, label, layerId, frameId, before, cel.pixels.slice(), { icon });
}

// ---- Selection -----------------------------------------------------------

export function applySelection(store, mask, { mode = 'replace', label = 'Seleksi' } = {}) {
  const session = store.activeSession;
  if (!session) return;
  const doc = session.doc;
  if (!doc.selection || doc.selection.width !== doc.width || doc.selection.height !== doc.height) {
    doc.selection = new Selection(doc.width, doc.height);
  }
  const before = doc.selection.mask.slice();
  let next;
  if (mode === 'replace') next = mask.slice();
  else if (mode === 'add') next = before.map((v, i) => (v || mask[i] ? 1 : 0));
  else if (mode === 'subtract') next = before.map((v, i) => (v && !mask[i] ? 1 : 0));
  else if (mode === 'intersect') next = before.map((v, i) => (v && mask[i] ? 1 : 0));
  else next = mask.slice();
  if (!next.some((v) => v) && mode === 'replace') {
    // empty selection means "no active selection" — still a valid state
  }
  doc.selection.mask = next;
  const after = next.slice();
  const entry = {
    label, icon: 'select', size: before.byteLength + after.byteLength,
    undo: () => { if (store.doc?.selection) store.doc.selection.mask = before.slice(); store.emit('selection:change'); },
    redo: () => { if (store.doc?.selection) store.doc.selection.mask = after.slice(); store.emit('selection:change'); },
  };
  pushEntry(store, entry);
  store.emit('selection:change');
}

export function selectionAll(store) {
  const doc = store.doc;
  if (!doc) return;
  applySelection(store, new Uint8Array(doc.width * doc.height).fill(1), { label: 'Pilih semua' });
}

export function selectionNone(store) {
  const doc = store.doc;
  if (!doc) return;
  applySelection(store, new Uint8Array(doc.width * doc.height), { label: 'Batal pilih' });
}

export function selectionInvert(store) {
  const doc = store.doc;
  if (!doc) return;
  const mask = new Uint8Array(doc.width * doc.height);
  if (doc.selection.empty) mask.fill(1);
  else for (let i = 0; i < mask.length; i++) mask[i] = doc.selection.mask[i] ? 0 : 1;
  applySelection(store, mask, { label: 'Balik seleksi' });
}

export function selectionGrow(store, amount) {
  const doc = store.doc;
  if (!doc || doc.selection.empty) return;
  const sel = doc.selection.clone();
  sel.grow(amount);
  applySelection(store, sel.mask, { label: amount >= 0 ? 'Perluas seleksi' : 'Kecilkan seleksi' });
}

// ---- Layers --------------------------------------------------------------

export function addLayer(store, opts = {}) {
  const session = store.activeSession;
  if (!session) return false;
  const doc = session.doc;
  const active = doc.getLayer(session.activeLayerId);
  const asGroup = opts.type === 'group';
  return runStructural(store, asGroup ? 'Tambah grup' : 'Tambah layer', (d) => {
    const index = opts.index ?? (active ? d.layers.findIndex((l) => l.id === active.id) + 1 : d.layers.length);
    const parentId = opts.parentId !== undefined
      ? opts.parentId
      : active?.type === 'group' ? active.id : active?.parentId ?? null;
    const layer = d.addLayer({
      name: opts.name || (asGroup ? 'Group' : `Layer ${d.layers.length + 1}`),
      type: asGroup ? 'group' : 'layer',
      parentId,
      index,
      opacity: 255,
    });
    session.activeLayerId = layer.id;
    return layer;
  }, { icon: 'layer-add' });
}

export function duplicateLayer(store, layerId = null) {
  const session = store.activeSession;
  if (!session) return;
  const doc = session.doc;
  const id = layerId || session.activeLayerId;
  const src = doc.getLayer(id);
  if (!src) return;
  runStructural(store, 'Duplikat layer', (d) => {
    const idx = d.layers.findIndex((l) => l.id === id);
    const copy = src.clone();
    copy.name = `${src.name} copy`;
    d.layers.splice(idx + 1, 0, copy);
    for (const frame of d.frames) {
      const cel = d.getCel(id, frame.id);
      if (cel) {
        const c = cel.clone(false);
        c.layerId = copy.id; c.frameId = frame.id;
        d.setCel(copy.id, frame.id, c);
      } else {
        d.getOrCreateCel(copy.id, frame.id);
      }
    }
    session.activeLayerId = copy.id;
    return copy;
  }, { icon: 'layer-dup' });
}

export function deleteLayer(store, layerId = null) {
  const session = store.activeSession;
  if (!session) return;
  const doc = session.doc;
  const id = layerId || session.activeLayerId;
  const layer = doc.getLayer(id);
  if (!layer) return;
  if (doc.layers.filter((l) => l.type === 'layer').length <= 1 && layer.type === 'layer' && !doc.descendantIds(id).length) {
    store.toast('Dokumen harus punya minimal satu layer.', 'warn');
    return;
  }
  runStructural(store, 'Hapus layer', (d) => {
    const idx = d.layers.findIndex((l) => l.id === id);
    d.removeLayer(id);
    session.activeLayerId = d.layers[Math.max(0, Math.min(idx - 1, d.layers.length - 1))]?.id || null;
  }, { icon: 'layer-del' });
}

export function mergeLayerDown(store, layerId = null) {
  const session = store.activeSession;
  if (!session) return;
  const id = layerId || session.activeLayerId;
  const ok = runStructural(store, 'Merge layer', (d) => d.mergeDown(id), { icon: 'merge' });
  if (ok === false) store.toast('Tidak ada layer di bawah untuk digabung.', 'warn');
}

export function flattenDocument(store) {
  if (runStructural(store, 'Flatten gambar', (d) => d.flatten())) store.toast('Semua layer digabung.', 'success');
}

export function setLayerProps(store, layerId, props, label = 'Ubah layer') {
  const session = store.activeSession;
  const layer = session?.doc.getLayer(layerId);
  if (!layer) return;
  const before = {};
  for (const key of Object.keys(props)) before[key] = layer[key];
  Object.assign(layer, props);
  const after = {};
  for (const key of Object.keys(props)) after[key] = layer[key];
  const entry = {
    label, icon: 'layer', size: 256,
    undo: () => {
      const l = store.doc?.getLayer(layerId);
      if (l) Object.assign(l, before);
      store.emit('doc:change');
      store.emit('layer:change');
    },
    redo: () => {
      const l = store.doc?.getLayer(layerId);
      if (l) Object.assign(l, after);
      store.emit('doc:change');
      store.emit('layer:change');
    },
  };
  pushEntry(store, entry);
  store.emit('layer:change');
}

export function toggleLayerFlag(store, layerId, flag) {
  const layer = store.doc?.getLayer(layerId);
  if (!layer) return;
  const labels = { visible: 'Visibilitas layer', locked: 'Kunci layer', lockAlpha: 'Kunci alpha', reference: 'Layer referensi', clipping: 'Clipping layer' };
  setLayerProps(store, layerId, { [flag]: !layer[flag] }, labels[flag] || 'Ubah layer');
}

export function moveLayer(store, layerId, direction) {
  const doc = store.doc;
  if (!doc) return;
  const idx = doc.layers.findIndex((l) => l.id === layerId);
  if (idx < 0) return;
  const target = idx + direction;
  if (target < 0 || target >= doc.layers.length) return;
  runStructural(store, 'Urutkan layer', (d) => {
    const [layer] = d.layers.splice(idx, 1);
    d.layers.splice(target, 0, layer);
  }, { icon: 'reorder' });
}

export function moveLayerTo(store, layerId, targetIndex, parentId = null) {
  runStructural(store, 'Pindahkan layer', (d) => {
    const idx = d.layers.findIndex((l) => l.id === layerId);
    if (idx < 0) return;
    const [layer] = d.layers.splice(idx, 1);
    layer.parentId = parentId;
    const dest = Math.max(0, Math.min(targetIndex, d.layers.length));
    d.layers.splice(dest, 0, layer);
  }, { icon: 'reorder' });
}

export function ungroupLayer(store, layerId) {
  runStructural(store, 'Ungroup', (d) => {
    const group = d.getLayer(layerId);
    if (!group || group.type !== 'group') return;
    for (const l of d.layers) if (l.parentId === group.id) l.parentId = group.parentId;
    d.layers = d.layers.filter((l) => l.id !== layerId);
  });
}

// ---- Frames & tags -------------------------------------------------------

export function addFrame(store, { copy = false, link = false } = {}) {
  const session = store.activeSession;
  if (!session) return;
  const doc = session.doc;
  const activeId = session.activeFrameId;
  runStructural(store, copy ? (link ? 'Frame link' : 'Duplikat frame') : 'Tambah frame', (d) => {
    const index = d.frameIndex(activeId) + 1;
    const frame = d.addFrame({ duration: d.getFrame(activeId)?.duration || 100, copyFrom: copy ? activeId : null, index, link });
    session.activeFrameId = frame.id;
  }, { icon: 'frame-add' });
}

export function deleteFrame(store) {
  const session = store.activeSession;
  if (!session) return;
  if (session.doc.frames.length <= 1) { store.toast('Dokumen harus punya minimal satu frame.', 'warn'); return; }
  const id = session.activeFrameId;
  runStructural(store, 'Hapus frame', (d) => {
    const idx = d.frameIndex(id);
    d.removeFrame(id);
    session.activeFrameId = d.frames[Math.max(0, Math.min(idx, d.frames.length - 1))].id;
  }, { icon: 'frame-del' });
}

export function duplicateFrame(store, link = false) {
  addFrame(store, { copy: true, link });
}

export function setFrameDuration(store, frameId, duration) {
  const frame = store.doc?.getFrame(frameId);
  if (!frame) return;
  const before = frame.duration;
  frame.duration = Math.max(10, Math.min(10000, Math.round(duration)));
  const after = frame.duration;
  pushEntry(store, {
    label: 'Durasi frame', icon: 'clock', size: 64,
    undo: () => { const f = store.doc?.getFrame(frameId); if (f) f.duration = before; store.emit('doc:change'); },
    redo: () => { const f = store.doc?.getFrame(frameId); if (f) f.duration = after; store.emit('doc:change'); },
  });
}

export function setAllDurations(store, fps) {
  const session = store.activeSession;
  if (!session) return;
  const duration = Math.max(10, Math.round(1000 / Math.max(1, Math.min(60, fps))));
  runStructural(store, 'Ubah FPS', (d) => { for (const f of d.frames) f.duration = duration; });
}

export function moveFrame(store, fromIndex, toIndex) {
  const session = store.activeSession;
  if (!session) return;
  runStructural(store, 'Pindahkan frame', (d) => {
    const tagFrames = (d.tags || []).map((tag) => ({
      tag,
      ids: new Set(d.frames.slice(tag.from, tag.to + 1).map((f) => f.id)),
    }));
    d.moveFrame(fromIndex, toIndex);
    for (const { tag, ids } of tagFrames) {
      const indices = [];
      d.frames.forEach((f, index) => { if (ids.has(f.id)) indices.push(index); });
      if (indices.length) {
        tag.from = Math.min(...indices);
        tag.to = Math.max(...indices);
      }
    }
  }, { icon: 'reorder' });
}

/** Link one layer cel to the previous frame's cel (or clone to unlink). */
export function toggleCelLink(store, layerId = null, frameId = null) {
  const session = store.activeSession;
  if (!session) return;
  const d = session.doc;
  const lid = layerId || session.activeLayerId;
  const fid = frameId || session.activeFrameId;
  const layer = d.getLayer(lid);
  const cel = d.getCel(lid, fid);
  if (!layer || layer.type !== 'layer' || !cel) return;
  const index = d.frameIndex(fid);
  const previous = d.frames[index - 1];
  if (previous) {
    const previousCel = d.getCel(lid, previous.id);
    if (!previousCel) { store.toast('Frame sebelumnya tidak memiliki cel.', 'warn'); return; }
    if (cel === previousCel) return;
    runStructural(store, 'Hubungkan cel', (doc) => {
      doc.setCel(lid, fid, previousCel);
    }, { icon: 'link' });
  }
}

/** Detach a cel from its linked siblings by cloning its pixel buffer. */
export function unlinkCel(store, layerId = null, frameId = null) {
  const session = store.activeSession;
  if (!session) return;
  const lid = layerId || session.activeLayerId;
  const fid = frameId || session.activeFrameId;
  const cel = session.doc.getCel(lid, fid);
  if (!cel) return;
  if (session.doc.linkCount(cel) <= 1) {
    store.toast('Cel ini tidak terhubung.', 'info');
    return;
  }
  runStructural(store, 'Lepas cel', (doc) => {
    const copy = cel.clone(false);
    copy.layerId = lid;
    copy.frameId = fid;
    doc.setCel(lid, fid, copy);
  }, { icon: 'link' });
}

export function setFrameTag(store, tag) {
  const session = store.activeSession;
  if (!session) return;
  runStructural(store, 'Tag animasi', (d) => {
    const existing = d.tags.findIndex((t) => t.name === tag.name);
    if (existing >= 0) d.tags[existing] = { ...d.tags[existing], ...tag };
    else d.tags.push({ direction: 'forward', repeat: 0, color: '#7c6cf5', ...tag });
  });
}

export function removeTag(store, name) {
  runStructural(store, 'Hapus tag', (d) => { d.tags = d.tags.filter((t) => t.name !== name); });
}

// ---- Document / canvas ---------------------------------------------------

export function resizeCanvas(store, width, height, offsetX = 0, offsetY = 0) {
  return runStructural(store, 'Resize kanvas', (d) => d.resize(width, height, offsetX, offsetY), { icon: 'canvas' });
}

export function cropCanvas(store, rect) {
  return runStructural(store, 'Crop kanvas', (d) => d.crop(rect.x, rect.y, rect.w, rect.h), { icon: 'crop' });
}

export function setDocumentProps(store, props, label = 'Ubah dokumen') {
  const doc = store.doc;
  if (!doc) return;
  const before = {};
  for (const k of Object.keys(props)) before[k] = doc[k];
  Object.assign(doc, props);
  const after = {};
  for (const k of Object.keys(props)) after[k] = doc[k];
  pushEntry(store, {
    label, icon: 'doc', size: 128,
    undo: () => { Object.assign(store.doc, before); store.emit('doc:change'); },
    redo: () => { Object.assign(store.doc, after); store.emit('doc:change'); },
  });
  store.emit('doc:change');
}

export function setMeta(store, key, value, label = 'Metadata') {
  const doc = store.doc;
  if (!doc) return;
  const before = JSON.parse(JSON.stringify(doc[key] ?? null));
  doc[key] = JSON.parse(JSON.stringify(value));
  const after = JSON.parse(JSON.stringify(doc[key]));
  pushEntry(store, {
    label, icon: 'meta', size: JSON.stringify(after).length * 2,
    undo: () => { store.doc[key] = JSON.parse(JSON.stringify(before)); store.emit('doc:change'); },
    redo: () => { store.doc[key] = JSON.parse(JSON.stringify(after)); store.emit('doc:change'); },
  });
  store.emit('doc:change');
}

export function setGrid(store, grid) {
  setDocumentProps(store, { grid }, 'Ubah grid');
}

// ---- Palette -------------------------------------------------------------

export function setPalette(store, mutator, label = 'Ubah palette') {
  const doc = store.doc;
  if (!doc) return;
  const before = doc.palette.clone();
  mutator(doc.palette);
  const after = doc.palette.clone();
  pushEntry(store, {
    label, icon: 'palette', size: 2048,
    undo: () => { store.doc.palette = before.clone(); store.emit('doc:change'); store.emit('palette:change'); },
    redo: () => { store.doc.palette = after.clone(); store.emit('doc:change'); store.emit('palette:change'); },
  });
  store.emit('palette:change');
}

/**
 * Change one palette entry. In indexed mode every matching pixel is recoloured
 * and the whole document snapshot is used so the operation is undoable.
 */
export function setPaletteColor(store, index, color) {
  const doc = store.doc;
  if (!doc) return;
  const oldHex = doc.palette.current.colors[index];
  if (!oldHex) return;
  const newHex = `#${color.replace(/^#/, '').toLowerCase()}`;
  if (oldHex === newHex) return;
  if (doc.palette.indexed) {
    runStructural(store, 'Ganti warna palette', (d) => {
      d.palette.current.set(index, newHex);
      const oldRgba = parseHex(oldHex);
      const newRgba = parseHex(newHex);
      const seen = new Set();
      for (const cel of d.cels.values()) {
        if (!cel.pixels || seen.has(cel)) continue;
        seen.add(cel);
        for (let i = 0; i < cel.pixels.length; i += 4) {
          if (cel.pixels[i] === oldRgba[0] && cel.pixels[i + 1] === oldRgba[1] && cel.pixels[i + 2] === oldRgba[2] && cel.pixels[i + 3] === oldRgba[3]) {
            cel.pixels[i] = newRgba[0]; cel.pixels[i + 1] = newRgba[1]; cel.pixels[i + 2] = newRgba[2]; cel.pixels[i + 3] = newRgba[3];
          }
        }
      }
    });
    store.emit('palette:change');
    return;
  }
  setPalette(store, (set) => set.current.set(index, newHex), 'Ganti warna palette');
}

export function addPaletteColor(store, color) {
  const doc = store.doc;
  if (!doc) return;
  const palette = doc.palette.current;
  if (palette.colors.includes(color)) return;
  setPalette(store, (set) => set.current.add(color), 'Tambah warna');
}

export function removePaletteColor(store, index) {
  setPalette(store, (set) => set.current.remove(index), 'Hapus warna');
}

export function addPaletteSet(store, name, colors) {
  setPalette(store, (set) => {
    set.palettes.push(new Palette({ name, colors }));
    set.active = set.palettes.length - 1;
  }, 'Palette baru');
}

export function selectPaletteSet(store, index) {
  setPalette(store, (set) => { set.active = index; }, 'Pilih palette');
}

export function setIndexedMode(store, indexed) {
  setPalette(store, (set) => { set.indexed = !!indexed; }, indexed ? 'Mode indexed' : 'Mode warna bebas');
}
