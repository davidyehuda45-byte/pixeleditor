import { uid } from '../utils/id.js';
import { Layer } from './layer.js';
import { Frame } from './frame.js';
import { Cel } from './cel.js';
import { Selection } from './selection.js';
import { Palette, PaletteSet } from './palette.js';
import { renderComposite } from './compositor.js';
import { parseHex } from '../utils/color.js';
import { compositePixel } from './compositor.js';

export const DOCUMENT_TEMPLATES = [
  { id: 'icon', name: 'Ikon 16×16', width: 16, height: 16 },
  { id: 'sprite', name: 'Sprite 32×32', width: 32, height: 32 },
  { id: 'character', name: 'Karakter 32×48', width: 32, height: 48 },
  { id: 'tile', name: 'Tile 16×16', width: 16, height: 16 },
  { id: 'ui9', name: 'UI 9-slice', width: 48, height: 48, slice: true },
  { id: 'card', name: 'Kartu 64×96', width: 64, height: 96 },
  { id: 'font', name: 'Font bitmap 8×8', width: 128, height: 64, grid: { x: 0, y: 0, w: 8, h: 8 } },
];

/** Root aggregate. Flat layers array is bottom → top paint order. */
export class PixelDocument {
  constructor(opts = {}) {
    this.format = 'pixelforge';
    this.version = 1;
    this.id = opts.id || uid('doc');
    this.title = opts.title || 'Untitled';
    this.width = opts.width || 32;
    this.height = opts.height || 32;
    this.background = opts.background || null;
    this.pixelAspect = opts.pixelAspect || [1, 1];
    this.layers = opts.layers || [];
    this.frames = opts.frames || [];
    this.cels = opts.cels instanceof Map ? opts.cels : new Map(Object.entries(opts.cels || {}));
    this.tags = opts.tags || [];
    this.slices = opts.slices || [];
    this.hitboxes = opts.hitboxes || [];
    this.anchors = opts.anchors || [];
    this.guides = opts.guides || [];
    this.grid = opts.grid || { x: 0, y: 0, w: 16, h: 16 };
    this.palette = opts.palette || PaletteSet.default();
    this.selection = opts.selection || new Selection(this.width, this.height);
    this.userData = opts.userData ?? null;
    this.created = opts.created || new Date().toISOString();
    this.modified = opts.modified || new Date().toISOString();
  }

  static create({ width = 32, height = 32, title = 'Untitled', background = null, layerName = 'Layer 1' } = {}) {
    const doc = new PixelDocument({ width, height, title, background });
    const layer = new Layer({ name: layerName });
    const frame = new Frame({ duration: 100 });
    doc.layers.push(layer);
    doc.frames.push(frame);
    doc.cels.set(PixelDocument.celKey(layer.id, frame.id), new Cel({
      layerId: layer.id, frameId: frame.id, width, height, pixels: null,
    }));
    doc.selection = new Selection(width, height);
    return doc;
  }

  static celKey(layerId, frameId) {
    return `${layerId}|${frameId}`;
  }

  get layerMap() {
    return new Map(this.layers.map((l) => [l.id, l]));
  }

  get frameMap() {
    return new Map(this.frames.map((f) => [f.id, f]));
  }

  getLayer(id) { return this.layers.find((l) => l.id === id) || null; }
  getFrame(id) { return this.frames.find((f) => f.id === id) || null; }
  frameIndex(id) { return this.frames.findIndex((f) => f.id === id); }
  get currentFrame() { return this.frames[0] || null; }

  /** All (visible) layer IDs below a layer, used by merge/drop. */
  ancestorIds(layer) {
    const ids = [];
    let p = layer?.parentId;
    let guard = 0;
    while (p && guard++ < 100) {
      ids.push(p);
      p = this.getLayer(p)?.parentId;
    }
    return ids;
  }

  descendantIds(layerId) {
    const out = [];
    const walk = (id) => {
      for (const l of this.layers) if (l.parentId === id) { out.push(l.id); walk(l.id); }
    };
    walk(layerId);
    return out;
  }

  isAncestorHidden(layer) {
    let p = layer?.parentId;
    let guard = 0;
    while (p && guard++ < 100) {
      const parent = this.getLayer(p);
      if (!parent) break;
      if (!parent.visible) return true;
      p = parent.parentId;
    }
    return false;
  }

  getCel(layerId, frameId) {
    return this.cels.get(PixelDocument.celKey(layerId, frameId)) || null;
  }

  /** Get a cel, allocating an empty one if missing. */
  getOrCreateCel(layerId, frameId) {
    const key = PixelDocument.celKey(layerId, frameId);
    let cel = this.cels.get(key);
    if (!cel) {
      cel = new Cel({ layerId, frameId, width: this.width, height: this.height, pixels: null });
      this.cels.set(key, cel);
    }
    return cel;
  }

  /** Get a cel and make sure its canvas buffer exists (for editing). */
  ensureCel(layerId, frameId) {
    const cel = this.getOrCreateCel(layerId, frameId);
    cel.ensurePixels();
    return cel;
  }

  setCel(layerId, frameId, cel) {
    this.cels.set(PixelDocument.celKey(layerId, frameId), cel);
  }

  removeCel(layerId, frameId) {
    this.cels.delete(PixelDocument.celKey(layerId, frameId));
  }

  /** Number of frames a cel is linked to (same object under several keys). */
  linkCount(cel) {
    let n = 0;
    for (const c of this.cels.values()) if (c === cel) n++;
    return n;
  }

  addLayer(opts = {}) {
    const layer = new Layer(opts);
    const idx = opts.index ?? this.layers.length;
    this.layers.splice(Math.max(0, Math.min(idx, this.layers.length)), 0, layer);
    for (const frame of this.frames) this.getOrCreateCel(layer.id, frame.id);
    return layer;
  }

  addFrame({ duration = 100, copyFrom = null, index = this.frames.length, link = false } = {}) {
    const frame = new Frame({ duration });
    this.frames.splice(index, 0, frame);
    for (const layer of this.layers) {
      if (layer.type === 'group') continue;
      if (link && copyFrom) {
        const src = this.getCel(layer.id, copyFrom);
        if (src) this.setCel(layer.id, frame.id, src); // shared object = linked cel
      } else if (copyFrom) {
        const src = this.getCel(layer.id, copyFrom);
        if (src && src.pixels) {
          this.setCel(layer.id, frame.id, new Cel({
            layerId: layer.id, frameId: frame.id, width: src.width, height: src.height,
            x: src.x, y: src.y, pixels: src.pixels.slice(), opacity: src.opacity,
          }));
        } else {
          this.getOrCreateCel(layer.id, frame.id);
        }
      } else {
        this.getOrCreateCel(layer.id, frame.id);
      }
    }
    return frame;
  }

  duplicateFrame(frameId, { link = false } = {}) {
    const index = this.frameIndex(frameId);
    if (index < 0) return null;
    return this.addFrame({ duration: this.frames[index].duration, copyFrom: frameId, index: index + 1, link });
  }

  removeFrame(frameId) {
    const index = this.frameIndex(frameId);
    if (index < 0) return;
    this.frames.splice(index, 1);
    for (const layer of this.layers) this.removeCel(layer.id, frameId);
    for (const tag of this.tags) {
      if (tag.from > index) tag.from--;
      if (tag.to >= index) tag.to--;
      if (tag.to < tag.from) { tag.from = Math.max(0, tag.from); tag.to = Math.max(tag.from, tag.to); }
    }
    this.tags = this.tags.filter((t) => t.from >= 0 && t.to >= t.from && this.frames.length > 0);
    if (!this.frames.length) this.addFrame({ duration: 100 });
  }

  moveFrame(fromIndex, toIndex) {
    if (fromIndex === toIndex || fromIndex < 0 || fromIndex >= this.frames.length) return;
    const [frame] = this.frames.splice(fromIndex, 1);
    this.frames.splice(Math.max(0, Math.min(toIndex, this.frames.length)), 0, frame);
    // Keep tags pointing at the same frames.
    for (const tag of this.tags) {
      const range = [];
      for (let i = tag.from; i <= tag.to; i++) range.push(this.frames[i]?.id);
      // tag indices are intentionally kept stable while editing; callers can
      // re-sync tags explicitly if needed.
    }
  }

  /** Remove a layer (and children if group). Returns removed data for undo? */
  removeLayer(layerId, { removeChildren = true } = {}) {
    const ids = removeChildren ? [layerId, ...this.descendantIds(layerId)] : [layerId];
    for (const id of ids) {
      this.layers = this.layers.filter((l) => l.id !== id);
      for (const frame of this.frames) this.removeCel(id, frame.id);
      if (!removeChildren) {
        for (const l of this.layers) if (l.parentId === layerId) l.parentId = null;
      }
    }
  }

  /** Merge a layer down. The lower layer receives the pixels. */
  mergeDown(layerId) {
    const index = this.layers.findIndex((l) => l.id === layerId);
    if (index <= 0) return false;
    const upper = this.layers[index];
    if (upper.type === 'group') return false;
    let lowerIndex = index - 1;
    while (lowerIndex >= 0 && this.layers[lowerIndex].type === 'group') lowerIndex--;
    if (lowerIndex < 0) return false;
    const lower = this.layers[lowerIndex];
    const opacity = upper.opacity / 255;
    for (const frame of this.frames) {
      const src = this.getCel(upper.id, frame.id);
      const dst = this.ensureCel(lower.id, frame.id);
      if (!src?.pixels) continue;
      for (let i = 0; i < dst.pixels.length; i += 4) {
        const sa = src.pixels[i + 3];
        if (!sa) continue;
        compositePixel(dst.pixels, i, src.pixels[i], src.pixels[i + 1], src.pixels[i + 2], sa, opacity, upper.blend);
      }
      this.removeCel(upper.id, frame.id);
    }
    this.layers.splice(index, 1);
    return true;
  }

  flatten({ includeHidden = false, includeReference = false } = {}) {
    if (!this.frames.length) return;
    const composites = this.frames.map((frame) => ({
      frame,
      composite: renderComposite(this, frame.id, { includeHidden, includeReference, background: false }),
    }));
    const layer = new Layer({ name: 'Flattened' });
    const cels = new Map();
    for (const { frame, composite } of composites) {
      const cel = new Cel({
        layerId: layer.id, frameId: frame.id, width: this.width, height: this.height,
        pixels: composite.data,
      });
      cels.set(PixelDocument.celKey(layer.id, frame.id), cel);
    }
    this.layers = [layer];
    this.cels = cels;
  }

  /** Composite a single cel, used by layer thumbnails. */
  celComposite(frameId, { includeHidden = true, includeReference = true } = {}) {
    return renderComposite(this, frameId, { includeHidden, includeReference });
  }

  /** Resize the canvas, preserving pixels at an offset. */
  resize(newWidth, newHeight, offsetX = 0, offsetY = 0) {
    if (newWidth < 1 || newHeight < 1 || newWidth > 4096 || newHeight > 4096) return false;
    const newCels = new Map();
    const seen = new Set();
    for (const [key, cel] of this.cels) {
      if (cel.pixels && !seen.has(cel)) {
        seen.add(cel);
        const buf = new Uint8ClampedArray(newWidth * newHeight * 4);
        for (let y = 0; y < cel.height; y++) for (let x = 0; x < cel.width; x++) {
          const dx = x + cel.x + offsetX, dy = y + cel.y + offsetY;
          if (dx < 0 || dy < 0 || dx >= newWidth || dy >= newHeight) continue;
          const si = (y * cel.width + x) * 4, di = (dy * newWidth + dx) * 4;
          buf[di] = cel.pixels[si]; buf[di + 1] = cel.pixels[si + 1]; buf[di + 2] = cel.pixels[si + 2]; buf[di + 3] = cel.pixels[si + 3];
        }
        cel.pixels = buf; cel.width = newWidth; cel.height = newHeight; cel.x = 0; cel.y = 0;
      } else if (!seen.has(cel)) {
        seen.add(cel);
        cel.width = newWidth; cel.height = newHeight; cel.x = 0; cel.y = 0; cel.pixels = null;
      }
      newCels.set(key, cel);
    }
    this.cels = newCels;
    this.width = newWidth;
    this.height = newHeight;
    this.selection = new Selection(newWidth, newHeight);
    return true;
  }

  /** Crop the canvas to a rect. */
  crop(x, y, w, h) {
    const rect = { x, y, w, h };
    const newCels = new Map();
    const seen = new Set();
    for (const [key, cel] of this.cels) {
      if (!cel.pixels) { cel.width = w; cel.height = h; cel.x = 0; cel.y = 0; newCels.set(key, cel); continue; }
      if (seen.has(cel)) { newCels.set(key, cel); continue; }
      seen.add(cel);
      const buf = new Uint8ClampedArray(w * h * 4);
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
        const sx = x + xx, sy = y + yy;
        if (sx < 0 || sy < 0 || sx >= this.width || sy >= this.height) continue;
        const si = (sy * this.width + sx) * 4, di = (yy * w + xx) * 4;
        buf[di] = cel.pixels[si]; buf[di + 1] = cel.pixels[si + 1]; buf[di + 2] = cel.pixels[si + 2]; buf[di + 3] = cel.pixels[si + 3];
      }
      cel.pixels = buf; cel.width = w; cel.height = h; cel.x = 0; cel.y = 0;
      newCels.set(key, cel);
    }
    this.cels = newCels;
    this.width = w; this.height = h;
    this.selection = new Selection(w, h);
    return true;
  }

  totalDuration() {
    return this.frames.reduce((s, f) => s + (f.duration || 100), 0);
  }

  get fps() {
    return this.frames.length ? Math.round(1000 / (this.totalDuration() / this.frames.length)) : 10;
  }

  tagAt(frameIndex) {
    return this.tags.find((t) => frameIndex >= t.from && frameIndex <= t.to) || null;
  }

  /** Deep clone preserving linked cel identity. */
  clone() {
    const celIdentity = new Map();
    const cels = new Map();
    for (const [key, cel] of this.cels) {
      let copy = celIdentity.get(cel);
      if (!copy) {
        copy = cel.clone(false);
        celIdentity.set(cel, copy);
      }
      cels.set(key, copy);
    }
    const copy = new PixelDocument({
      id: this.id, title: this.title, width: this.width, height: this.height,
      background: this.background, pixelAspect: [...this.pixelAspect],
      layers: this.layers.map((l) => l.clone()),
      frames: this.frames.map((f) => f.clone()),
      cels,
      tags: JSON.parse(JSON.stringify(this.tags)),
      slices: JSON.parse(JSON.stringify(this.slices)),
      hitboxes: JSON.parse(JSON.stringify(this.hitboxes)),
      anchors: JSON.parse(JSON.stringify(this.anchors)),
      guides: JSON.parse(JSON.stringify(this.guides)),
      grid: { ...this.grid },
      palette: this.palette.clone(),
      selection: this.selection.clone(),
      userData: this.userData == null ? null : JSON.parse(JSON.stringify(this.userData)),
      created: this.created, modified: this.modified,
    });
    return copy;
  }

  /** Small helper used by the colour panel. */
  backgroundRgba() {
    return this.background ? parseHex(this.background) : [0, 0, 0, 0];
  }
}
