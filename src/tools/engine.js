/**
 * ToolEngine — pointer gesture state machine for all editor tools.
 * It is intentionally framework-free: the viewport feeds document-space
 * coordinates and modifier keys, the engine mutates the document and pushes
 * undoable commands. Every pixel it writes is 0/255 alpha (layer opacity is
 * handled by the compositor).
 */
import { parseHex, toHex } from '../utils/color.js';
import {
  ellipseMask, polygonMask, linePoints, floodFillMask, ditherThreshold,
} from '../utils/raster.js';
import { renderComposite } from '../core/compositor.js';
import { applySelection, commitPixelEdit } from '../core/commands.js';
import { Selection } from '../core/selection.js';
import { selectionModeFor, resolveDabPixels, paintDab, eraseDab, buildShapeMask, maskToPreview, commitOverlay, curveMask, seededRandom, shadeColor } from './drawing.js';

function isLShape(a, b, c) {
  const abx = Math.abs(a[0] - b[0]), aby = Math.abs(a[1] - b[1]);
  const bcx = Math.abs(b[0] - c[0]), bcy = Math.abs(b[1] - c[1]);
  return abx === 1 && aby === 1 && bcx === 1 && bcy === 1;
}

function fullBuffer(doc) {
  return new Uint8ClampedArray(doc.width * doc.height * 4);
}

function selectionMaskOf(doc) {
  return doc.selection && !doc.selection.empty ? doc.selection.mask.slice() : null;
}

function shiftMask(mask, width, height, dx, dy) {
  const out = new Uint8Array(width * height);
  if (!mask) return out;
  for (let y = 0; y < height; y++) {
    const ty = y + dy;
    if (ty < 0 || ty >= height) continue;
    for (let x = 0; x < width; x++) {
      if (!mask[y * width + x]) continue;
      const tx = x + dx;
      if (tx < 0 || tx >= width) continue;
      out[ty * width + tx] = 1;
    }
  }
  return out;
}

function placeLocalMask(local, doc, offsetX = 0, offsetY = 0) {
  const out = new Uint8Array(doc.width * doc.height);
  if (!local) return out;
  for (let y = 0; y < local.height; y++) for (let x = 0; x < local.width; x++) {
    if (!local.mask[y * local.width + x]) continue;
    const px = offsetX + x, py = offsetY + y;
    if (px < 0 || py < 0 || px >= doc.width || py >= doc.height) continue;
    out[py * doc.width + px] = 1;
  }
  return out;
}

function rectSelection(doc, a, b) {
  const x0 = Math.max(0, Math.min(a[0], b[0]));
  const y0 = Math.max(0, Math.min(a[1], b[1]));
  const x1 = Math.min(doc.width - 1, Math.max(a[0], b[0]));
  const y1 = Math.min(doc.height - 1, Math.max(a[1], b[1]));
  const out = new Uint8Array(doc.width * doc.height);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out[y * doc.width + x] = 1;
  return out;
}

function lassoSelection(doc, points) {
  if (!points || points.length < 3) return new Uint8Array(doc.width * doc.height);
  const local = polygonMask(points, true, true);
  return placeLocalMask(local, doc, local.x, local.y);
}

function ellipseSelection(doc, a, b) {
  const x0 = Math.min(a[0], b[0]), y0 = Math.min(a[1], b[1]);
  const x1 = Math.max(a[0], b[0]), y1 = Math.max(a[1], b[1]);
  const local = ellipseMask({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }, true, 1);
  return placeLocalMask(local, doc, x0, y0);
}

function nearestPaletteColor(color, palette) {
  let best = color, bestD = Infinity;
  for (const hex of palette) {
    const c = parseHex(hex);
    const d = (c[0] - color[0]) ** 2 + (c[1] - color[1]) ** 2 + (c[2] - color[2]) ** 2;
    if (d < bestD) { bestD = d; best = [c[0], c[1], c[2], 255]; }
  }
  return best;
}

function gradientLut(primary, secondary, palette, snapPalette) {
  const lut = new Array(256);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let c = [
      Math.round(primary[0] + (secondary[0] - primary[0]) * t),
      Math.round(primary[1] + (secondary[1] - primary[1]) * t),
      Math.round(primary[2] + (secondary[2] - primary[2]) * t),
      255,
    ];
    if (snapPalette && palette.length) c = nearestPaletteColor(c, palette);
    lut[i] = c;
  }
  return lut;
}

export class ToolEngine {
  constructor(store, callbacks = {}) {
    this.store = store;
    this.cb = callbacks;
    this.state = null;
    this.overlay = null;
    this.selectionPreview = null;
    this.hint = '';
    this._lastPoint = null;
  }

  // ---- helpers -----------------------------------------------------------

  get doc() { return this.store.doc; }

  get ui() { return this.store.ui; }

  setHint(text) {
    if (this.hint === text) return;
    this.hint = text || '';
    this.store.emit('tool:hint', { text: this.hint });
  }

  clearPreview() {
    this.overlay = null;
    this.selectionPreview = null;
    this.hint = '';
    this.store.emit('tool:hint', { text: '' });
    this.cb.onChange?.();
  }

  request(rect = null) {
    this.cb.onChange?.(rect);
  }

  requireLayer() {
    const session = this.store.activeSession;
    if (!session) return null;
    const layer = session.doc.getLayer(session.activeLayerId);
    if (!layer) {
      this.store.toast('Tidak ada layer aktif.', 'warn');
      return null;
    }
    if (layer.type !== 'layer') {
      this.store.toast('Grup tidak bisa digambar. Pilih layer di dalamnya.', 'warn');
      return null;
    }
    if (layer.locked) {
      this.store.toast('Layer terkunci. Buka kunci untuk menggambar.', 'warn');
      return null;
    }
    if (!layer.visible || session.doc.isAncestorHidden(layer)) {
      this.store.toast('Layer tersembunyi. Tampilkan dulu untuk melihat hasil.', 'warn');
      return null;
    }
    return layer;
  }

  activeCel() {
    const session = this.store.activeSession;
    if (!session) return null;
    const doc = session.doc;
    const layer = this.requireLayer();
    if (!layer) return null;
    const cel = doc.getOrCreateCel(layer.id, session.activeFrameId);
    return { cel, layer, doc, session };
  }

  colorFromButton(button) {
    return parseHex(button === 2 ? this.ui.secondary : this.ui.primary);
  }

  symmetry() {
    return {
      mode: this.ui.symmetry,
      slices: this.ui.symmetrySlices,
      axisX: this.ui.symmetryAxisX ?? Math.floor(this.doc.width / 2),
      axisY: this.ui.symmetryAxisY ?? Math.floor(this.doc.height / 2),
    };
  }

  drawOptions(selectionMask, pressure = 1, pointerType = 'mouse') {
    let brushSize = Math.max(1, this.ui.brushSize | 0);
    if (this.ui.pressureSize && pointerType === 'pen' && pressure > 0) {
      brushSize = Math.max(1, Math.round(brushSize * (0.35 + pressure * 0.65)));
    }
    return {
      brushSize,
      brushShape: this.ui.brushShape,
      symmetry: this.symmetry(),
      tiled: !!this.ui.tiled,
      selectionMask,
      lockAlpha: !!(this.ui.lockAlpha || this.store.activeLayer?.lockAlpha),
      dither: this.ui.dither,
      density: this.ui.ditherDensity,
    };
  }

  sampleSource(source) {
    const session = this.store.activeSession;
    if (!session) return null;
    if (source === 'layer') {
      const cel = session.doc.getCel(session.activeLayerId, session.activeFrameId);
      return cel?.pixels || new Uint8ClampedArray(session.doc.width * session.doc.height * 4);
    }
    const composite = this.cb.getCompositePixels?.();
    if (composite && composite.length === session.doc.width * session.doc.height * 4) return composite;
    return renderComposite(session.doc, session.activeFrameId).data;
  }

  // ---- pointer API -------------------------------------------------------

  pointerDown(point, evt = {}) {
    if (!this.doc) return false;
    const tool = this.ui.tool;
    const button = evt.button ?? 0;
    if (button !== 0 && button !== 2) return false;
    const p = [Math.floor(point.x), Math.floor(point.y)];

    if (this.state && button === 2 && ['polygon', 'curve', 'polygon-select'].includes(this.state.kind)) {
      this.cancel();
      return true;
    }

    switch (tool) {
      case 'pencil':
      case 'brush':
      case 'eraser':
      case 'spray':
      case 'shade':
        return this.startFreehand(p, evt);
      case 'fill':
        return this.performFill(p, evt);
      case 'picker':
        return this.pickColor(p, evt);
      case 'line':
      case 'rect':
      case 'rounded-rect':
      case 'ellipse':
        return this.startShape(tool, p, evt);
      case 'polygon':
        return this.polygonClick(p, evt);
      case 'curve':
        return this.curveClick(p, evt);
      case 'gradient':
        return this.startGradient(p, evt);
      case 'select-rect':
      case 'select-ellipse':
      case 'lasso':
        return this.startSelection(tool, p, evt);
      case 'polygon-lasso':
        return this.polygonSelectionClick(p, evt);
      case 'wand':
        return this.magicWand(p, evt);
      case 'move':
        return this.startMove(p, evt);
      case 'text': {
        const layer = this.requireLayer();
        if (!layer) return true;
        const session = this.store.activeSession;
        this.store.setDialog({
          type: 'text',
          x: p[0], y: p[1],
          layerId: layer.id,
          frameId: session.activeFrameId,
          color: button === 2 ? this.ui.secondary : this.ui.primary,
        });
        return true;
      }
      default:
        return false;
    }
  }

  pointerMove(point, evt = {}) {
    if (!this.state) return false;
    const p = [Math.floor(point.x), Math.floor(point.y)];
    const s = this.state;
    if (s.kind === 'draw') {
      this.continueFreehand(p, evt);
      return true;
    }
    if (s.kind === 'shape') {
      s.end = p;
      s.modifiers = { shiftKey: !!evt.shiftKey, altKey: !!evt.altKey };
      this.updateShapePreview();
      return true;
    }
    if (s.kind === 'gradient') {
      s.end = p;
      s.modifiers = { shiftKey: !!evt.shiftKey };
      this.updateGradientPreview();
      return true;
    }
    if (s.kind === 'select') {
      s.end = p;
      if (s.tool === 'lasso') {
        const last = s.points[s.points.length - 1];
        for (const q of linePoints(last[0], last[1], p[0], p[1]).slice(1)) s.points.push(q);
      }
      this.updateSelectionPreview();
      return true;
    }
    if (s.kind === 'polygon') {
      s.hover = p;
      this.updatePolygonPreview();
      return true;
    }
    if (s.kind === 'curve') {
      if (s.dragIndex != null) {
        s.points[s.dragIndex] = p;
      } else {
        s.hover = p;
      }
      this.updateCurvePreview();
      return true;
    }
    if (s.kind === 'polygon-select') {
      s.hover = p;
      this.updatePolygonSelectionPreview();
      return true;
    }
    if (s.kind === 'move') {
      s.point = p;
      s.modifiers = { shiftKey: !!evt.shiftKey };
      this.updateMovePreview();
      return true;
    }
    return false;
  }

  pointerUp(point, evt = {}) {
    if (!this.state) return false;
    const tool = this.ui.tool;
    const p = [Math.floor(point.x), Math.floor(point.y)];
    if (this.state.kind === 'draw') {
      this.endFreehand();
      return true;
    }
    if (this.state.kind === 'shape') {
      this.state.end = p;
      this.updateShapePreview();
      this.commitShape();
      return true;
    }
    if (this.state.kind === 'gradient') {
      this.state.end = p;
      this.updateGradientPreview();
      this.commitGradient();
      return true;
    }
    if (this.state.kind === 'select') {
      this.state.end = p;
      this.finishSelectionDrag();
      return true;
    }
    if (this.state.kind === 'move') {
      this.state.point = p;
      this.updateMovePreview();
      this.finishMove();
      return true;
    }
    if (this.state.kind === 'curve' && this.state.dragIndex != null) {
      this.state.dragIndex = null;
      return true;
    }
    // Polygon tools finish on click / Enter / double-click.
    return true;
  }

  pointerCancel() {
    this.cancel();
  }

  handleDoubleClick() {
    if (!this.state) return false;
    if (this.state.kind === 'polygon') { this.commitPolygon(); return true; }
    if (this.state.kind === 'curve') { this.commitCurve(); return true; }
    if (this.state.kind === 'polygon-select') { this.finishPolygonSelection(); return true; }
    return false;
  }

  handleKeyDown(event) {
    if (event.key === 'Escape') {
      if (!this.state) return false;
      this.cancel();
      return true;
    }
    if (event.key === 'Enter') {
      if (!this.state) return false;
      if (this.state.kind === 'polygon') { this.commitPolygon(); return true; }
      if (this.state.kind === 'curve') { this.commitCurve(); return true; }
      if (this.state.kind === 'polygon-select') { this.finishPolygonSelection(); return true; }
      if (this.state.kind === 'shape') { this.commitShape(); return true; }
      if (this.state.kind === 'gradient') { this.commitGradient(); return true; }
      if (this.state.kind === 'draw') { this.endFreehand(); return true; }
      if (this.state.kind === 'move') { this.finishMove(); return true; }
      if (this.state.kind === 'select') { this.finishSelectionDrag(); return true; }
    }
    return false;
  }

  cancel() {
    const s = this.state;
    if (!s) return;
    if (s.kind === 'draw' || s.kind === 'move') {
      const doc = this.doc;
      const cel = doc?.getCel(s.layerId, s.frameId);
      if (cel && s.before) {
        cel.ensurePixels();
        cel.pixels.set(s.before);
      }
      if (s.kind === 'move' && s.selectionBefore && doc?.selection) {
        doc.selection.mask.set(s.selectionBefore);
        this.store.emit('selection:change');
      }
      if (cel) this.store.emit('pixels:changed', { layerId: s.layerId, frameId: s.frameId, full: true });
      if (cel) this.store.emit('doc:change', { reason: 'Batal' });
    }
    this.state = null;
    this._lastPoint = null;
    this.clearPreview();
  }

  // ---- freehand ----------------------------------------------------------

  startFreehand(p, evt) {
    const active = this.activeCel();
    if (!active) return true;
    const { cel, doc, session } = active;
    const selectionMask = selectionMaskOf(doc);
    const before = cel.pixels ? cel.pixels.slice() : fullBuffer(doc);
    doc.ensureCel(session.activeLayerId, session.activeFrameId);
    this.state = {
      kind: 'draw',
      tool: this.ui.tool,
      doc, cel, before,
      layerId: session.activeLayerId,
      frameId: session.activeFrameId,
      selectionMask,
      lockAlpha: !!(this.ui.lockAlpha || active.layer.lockAlpha),
      color: this.colorFromButton(evt.button),
      button: evt.button ?? 0,
      path: [],
      originals: new Map(),
      dirty: null,
      seed: (Date.now() & 0xffffffff) >>> 0,
      last: p,
    };
    this._lastPoint = p;
    this.applyPoint(p, evt);
    return true;
  }

  paintPointAt(p, evt, optsOverride = null) {
    const s = this.state;
    const opts = optsOverride || this.drawOptions(s.selectionMask, evt.pressure, evt.pointerType);
    if (s.tool === 'eraser') {
      return eraseDab(s.cel, s.doc, p[0], p[1], { ...opts, lockAlpha: false });
    }
    if (s.tool === 'spray') {
      return this.sprayAt(p, evt, opts);
    }
    if (s.tool === 'shade') {
      return this.shadeAt(p, evt, opts);
    }
    return paintDab(s.cel, s.doc, p[0], p[1], s.color, opts);
  }

  recordOriginals(p, evt, opts) {
    const s = this.state;
    if (s.tool === 'spray' || s.tool === 'shade') return;
    const pixels = resolveDabPixels(s.doc, p[0], p[1], opts);
    for (const [x, y] of pixels) {
      const i = (y * s.doc.width + x) * 4;
      if (s.originals.has(i)) continue;
      s.originals.set(i, [
        s.before[i], s.before[i + 1], s.before[i + 2], s.before[i + 3],
      ]);
    }
  }

  restorePoint(p, opts) {
    const s = this.state;
    const pixels = resolveDabPixels(s.doc, p[0], p[1], opts);
    const px = s.cel.pixels;
    for (const [x, y] of pixels) {
      const i = (y * s.doc.width + x) * 4;
      const original = s.originals.get(i);
      if (!original) continue;
      px[i] = original[0]; px[i + 1] = original[1]; px[i + 2] = original[2]; px[i + 3] = original[3];
    }
  }

  applyPoint(p, evt) {
    const s = this.state;
    if (!s) return;
    const opts = this.drawOptions(s.selectionMask, evt.pressure, evt.pointerType);
    this.recordOriginals(p, evt, opts);
    const rect = this.paintPointAt(p, evt, opts);
    if (rect) s.dirty = s.dirty ? unionRect(s.dirty, rect) : rect;
    if (s.tool !== 'spray' && s.tool !== 'shade') {
      s.path.push({ p, size: opts.brushSize, shape: opts.brushShape, pressure: evt.pressure, pointerType: evt.pointerType });
      if (this.ui.pixelPerfect && opts.brushSize === 1) {
        let guard = 0;
        while (s.path.length >= 3 && guard++ < 8) {
          const a = s.path[s.path.length - 3].p;
          const b = s.path[s.path.length - 2].p;
          const c = s.path[s.path.length - 1].p;
          if (!isLShape(a, b, c)) break;
          const middle = s.path[s.path.length - 2];
          const middleOpts = this.drawOptions(s.selectionMask, middle.pressure, middle.pointerType);
          this.restorePoint(middle.p, middleOpts);
          s.path.splice(s.path.length - 2, 1);
          if (s.dirty) s.dirty = { x: s.dirty.x, y: s.dirty.y, w: s.dirty.w, h: s.dirty.h };
        }
      }
    }
    this._lastPoint = p;
    this.request(s.dirty);
  }

  continueFreehand(p, evt) {
    const s = this.state;
    if (!s) return;
    if (s.tool === 'spray' || s.tool === 'shade') {
      this.applyPoint(p, evt);
      return;
    }
    const last = this._lastPoint || s.last;
    if (last && (last[0] !== p[0] || last[1] !== p[1])) {
      for (const q of linePoints(last[0], last[1], p[0], p[1]).slice(1)) {
        this.applyPoint(q, evt);
      }
    } else {
      // Pressure may have changed while stationary on a pen.
      this.applyPoint(p, evt);
    }
    s.last = p;
  }

  endFreehand() {
    const s = this.state;
    if (!s) return;
    this.state = null;
    this.overlay = null;
    this.hint = '';
    this.store.emit('tool:hint', { text: '' });
    const after = s.cel.pixels ? s.cel.pixels.slice() : fullBuffer(s.doc);
    const changed = commitPixelEdit(this.store, labelForTool(s.tool), s.layerId, s.frameId, s.before, after, { icon: s.tool });
    if (changed) this.store.addRecentColor(s.tool === 'eraser' ? this.ui.primary : toHex(s.color));
    this._lastPoint = null;
    this.request();
  }

  sprayAt(p, evt, opts) {
    const s = this.state;
    const doc = s.doc;
    const color = s.color;
    const count = Math.max(1, this.ui.sprayDensity | 0);
    const radius = Math.max(1, opts.brushSize);
    const rand = seededRandom(s.seed + (p[0] * 73856093) ^ (p[1] * 19349663));
    let union = null;
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * radius;
      const x = Math.round(p[0] + Math.cos(angle) * r);
      const y = Math.round(p[1] + Math.sin(angle) * r);
      if (x < 0 || y < 0 || x >= doc.width || y >= doc.height) continue;
      const rect = paintDab(s.cel, doc, x, y, color, {
        ...opts, brushSize: 1, symmetry: this.symmetry(), tiled: this.ui.tiled,
      });
      if (rect) union = union ? unionRect(union, rect) : rect;
    }
    return union;
  }

  shadeAt(p, evt, opts) {
    const s = this.state;
    const doc = s.doc;
    const palette = doc.palette?.current?.colors || [];
    const pixels = resolveDabPixels(doc, p[0], p[1], opts);
    let minX = doc.width, minY = doc.height, maxX = -1, maxY = -1;
    const direction = (evt.button === 2 || evt.altKey) ? -1 : 1;
    for (const [x, y] of pixels) {
      const i = (y * doc.width + x) * 4;
      if (s.selectionMask && !s.selectionMask[y * doc.width + x]) continue;
      if (opts.lockAlpha && s.cel.pixels[i + 3] === 0) continue;
      if (s.cel.pixels[i + 3] === 0) continue;
      const current = [s.cel.pixels[i], s.cel.pixels[i + 1], s.cel.pixels[i + 2], 255];
      const next = shadeColor(current, palette, direction);
      s.cel.pixels[i] = next[0]; s.cel.pixels[i + 1] = next[1]; s.cel.pixels[i + 2] = next[2];
      if (x < minX) minX = x; if (y < minY) minY = y;
      if (x > maxX) maxX = x; if (y > maxY) maxY = y;
    }
    if (maxX < 0) return null;
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  }

  // ---- picker ------------------------------------------------------------

  pickColor(p, evt) {
    const doc = this.doc;
    if (!doc || p[0] < 0 || p[1] < 0 || p[0] >= doc.width || p[1] >= doc.height) return true;
    const source = this.sampleSource(this.ui.pickerSource);
    if (!source) return true;
    const i = (p[1] * doc.width + p[0]) * 4;
    let hex;
    if (source[i + 3] === 0) hex = '#00000000';
    else hex = toHex([source[i], source[i + 1], source[i + 2], source[i + 3]]);
    const which = (evt.button === 2) ? 'secondary' : 'primary';
    this.store.setUI({ [which]: hex });
    this.store.addRecentColor(hex);
    this.store.toast(`Warna ${hex} diambil.`, 'info', 1400);
    return true;
  }

  // ---- flood fill --------------------------------------------------------

  performFill(p, evt) {
    const active = this.activeCel();
    if (!active) return true;
    const { cel, doc, session } = active;
    const selectionMask = selectionMaskOf(doc);
    if (p[0] < 0 || p[1] < 0 || p[0] >= doc.width || p[1] >= doc.height) return true;
    if (selectionMask && !selectionMask[p[1] * doc.width + p[0]]) {
      this.store.toast('Titik awal di luar seleksi.', 'warn');
      return true;
    }
    const source = this.ui.fillSource === 'composite' ? this.sampleSource('composite') : (cel.pixels || new Uint8ClampedArray(doc.width * doc.height * 4));
    const mask = floodFillMask(source, doc.width, doc.height, p[0], p[1], {
      tolerance: this.ui.tolerance | 0,
      contiguous: !!this.ui.contiguous,
      allowed: selectionMask,
      connectivity: 4,
    });
    const before = cel.pixels ? cel.pixels.slice() : fullBuffer(doc);
    doc.ensureCel(session.activeLayerId, session.activeFrameId);
    const primary = this.colorFromButton(evt.button);
    const secondary = this.colorFromButton(evt.button === 2 ? 0 : 2);
    const dither = this.ui.fillMode === 'dither' ? (this.ui.dither === 'none' ? 'checker' : this.ui.dither) : 'none';
    let count = 0;
    for (let y = 0; y < doc.height; y++) for (let x = 0; x < doc.width; x++) {
      const mi = y * doc.width + x;
      if (!mask[mi]) continue;
      const usePrimary = dither === 'none' || ditherThreshold(dither, x, y) < this.ui.ditherDensity;
      const color = usePrimary ? primary : secondary;
      const i = mi * 4;
      cel.pixels[i] = color[0]; cel.pixels[i + 1] = color[1]; cel.pixels[i + 2] = color[2]; cel.pixels[i + 3] = color[3];
      count++;
    }
    if (!count) {
      this.store.toast('Area yang dipilih kosong.', 'info', 1500);
      return true;
    }
    commitPixelEdit(this.store, 'Isi area', session.activeLayerId, session.activeFrameId, before, cel.pixels.slice(), { icon: 'fill' });
    this.store.addRecentColor(toHex(primary));
    this.request();
    return true;
  }

  // ---- shapes ------------------------------------------------------------

  startShape(tool, p, evt) {
    const active = this.activeCel();
    if (!active) return true;
    const { cel, doc, session } = active;
    const before = cel.pixels ? cel.pixels.slice() : fullBuffer(doc);
    doc.ensureCel(session.activeLayerId, session.activeFrameId);
    this.state = {
      kind: 'shape', tool, doc, cel, before,
      layerId: session.activeLayerId, frameId: session.activeFrameId,
      start: p, end: p, modifiers: { shiftKey: !!evt.shiftKey, altKey: !!evt.altKey },
      color: this.colorFromButton(evt.button), button: evt.button ?? 0,
      selectionMask: selectionMaskOf(doc),
      lockAlpha: !!(this.ui.lockAlpha || active.layer.lockAlpha),
    };
    this.setHint('Tarik untuk menggambar · Shift rasio/sudut · Alt dari tengah · Esc batal');
    this.updateShapePreview();
    return true;
  }

  shapeGeometry(s) {
    let start = s.start.slice();
    let end = s.end.slice();
    if (s.tool !== 'line' && s.modifiers.shiftKey) {
      const dx = end[0] - start[0], dy = end[1] - start[1];
      const side = Math.max(Math.abs(dx), Math.abs(dy));
      end = [start[0] + Math.sign(dx || 1) * side, start[1] + Math.sign(dy || 1) * side];
    }
    if (s.modifiers.altKey) {
      const dx = end[0] - s.start[0], dy = end[1] - s.start[1];
      start = [s.start[0] - dx, s.start[1] - dy];
      end = [s.start[0] + dx, s.start[1] + dy];
    }
    return { start, end };
  }

  buildShapeMaskFor(s, geom = null) {
    const g = geom || this.shapeGeometry(s);
    return buildShapeMask(s.tool, s.doc, g.start, g.end, {
      filled: !!this.ui.shapeFill,
      thickness: Math.max(1, this.ui.shapeThickness | 0),
      brushSize: Math.max(1, this.ui.brushSize | 0),
      brushShape: this.ui.brushShape,
      radius: 4,
      points: s.points || null,
      snapAngle: s.tool === 'line' && s.modifiers?.shiftKey,
    });
  }

  updateShapePreview() {
    const s = this.state;
    if (!s || s.kind !== 'shape') return;
    const mask = this.buildShapeMaskFor(s);
    const color = s.color[3] === 0 ? [0, 0, 0, 0] : [s.color[0], s.color[1], s.color[2], 255];
    this.overlay = this.ui.brushOpacity >= 255 && color[3] === 255
      ? maskToPreview(s.doc, mask, color, {
        symmetry: this.symmetry(), tiled: !!this.ui.tiled, selectionMask: s.selectionMask,
        dither: this.ui.dither, density: this.ui.ditherDensity,
      })
      : maskToPreview(s.doc, mask, [color[0], color[1], color[2], Math.round((this.ui.brushOpacity / 255) * 255)], {
        symmetry: this.symmetry(), tiled: !!this.ui.tiled, selectionMask: s.selectionMask,
        dither: this.ui.dither, density: this.ui.ditherDensity,
      });
    this.request();
  }

  commitShape() {
    const s = this.state;
    if (!s) return;
    const { start, end } = s.points ? { start: s.start, end: s.end } : this.shapeGeometry(s);
    if (s.points && s.points.length < 3) { this.cancel(); return; }
    const mask = this.buildShapeMaskFor(s, { start, end });
    const color = s.color[3] === 0 ? [0, 0, 0, 0] : [s.color[0], s.color[1], s.color[2], 255];
    this.overlay = maskToPreview(s.doc, mask, color, {
      symmetry: this.symmetry(), tiled: !!this.ui.tiled, selectionMask: s.selectionMask,
      dither: this.ui.dither, density: this.ui.ditherDensity,
    });
    const changed = commitOverlay(s.cel, s.doc, this.overlay, { selectionMask: s.selectionMask, lockAlpha: s.lockAlpha });
    const after = s.cel.pixels.slice();
    this.state = null;
    this.overlay = null;
    this.setHint('');
    if (changed) {
      commitPixelEdit(this.store, labelForTool(s.tool), s.layerId, s.frameId, s.before, after, { icon: s.tool });
      this.store.addRecentColor(toHex(color));
    }
    this.request();
  }

  // ---- multi-click polygon ----------------------------------------------

  polygonClick(p, evt) {
    if (this.state) {
      const s = this.state;
      if (s.kind === 'polygon') {
        if (s.points.length >= 3 && Math.hypot(p[0] - s.points[0][0], p[1] - s.points[0][1]) <= 2) {
          s.hover = p;
          this.commitPolygon();
          return true;
        }
        const last = s.points[s.points.length - 1];
        if (!last || last[0] !== p[0] || last[1] !== p[1]) s.points.push(p);
        s.hover = p;
        this.setHint('Klik untuk menambah titik · klik titik awal atau Enter untuk selesai · Esc batal');
        this.updatePolygonPreview();
        return true;
      }
    }
    const active = this.activeCel();
    if (!active) return true;
    const { cel, doc, session } = active;
    const before = cel.pixels ? cel.pixels.slice() : fullBuffer(doc);
    doc.ensureCel(session.activeLayerId, session.activeFrameId);
    this.state = {
      kind: 'polygon', doc, cel, before,
      layerId: session.activeLayerId, frameId: session.activeFrameId,
      points: [p], hover: p, start: p,
      color: this.colorFromButton(evt.button), button: evt.button ?? 0,
      selectionMask: selectionMaskOf(doc), lockAlpha: !!(this.ui.lockAlpha || active.layer.lockAlpha),
    };
    this.setHint('Klik titik berikutnya · klik titik awal/Enter untuk selesai · Esc batal');
    this.updatePolygonPreview();
    return true;
  }

  updatePolygonPreview() {
    const s = this.state;
    if (!s || s.kind !== 'polygon') return;
    const points = s.hover ? [...s.points, s.hover] : s.points.slice();
    let mask;
    if (points.length >= 3) {
      mask = buildShapeMask('polygon', s.doc, s.start, s.hover || s.start, {
        points, filled: !!this.ui.shapeFill, brushSize: Math.max(1, this.ui.brushSize | 0), brushShape: this.ui.brushShape,
      });
    } else {
      mask = new Uint8Array(s.doc.width * s.doc.height);
      const stamp = buildShapeMask('line', s.doc, points[points.length - 1], points[0], {
        brushSize: 1, brushShape: 'round',
      });
      mask.set(stamp);
    }
    this.overlay = maskToPreview(s.doc, mask, [s.color[0], s.color[1], s.color[2], 255], {
      symmetry: this.symmetry(), tiled: !!this.ui.tiled, selectionMask: s.selectionMask,
      dither: this.ui.dither, density: this.ui.ditherDensity,
    });
    this.request();
  }

  commitPolygon() {
    const s = this.state;
    if (!s || s.kind !== 'polygon') return;
    if (s.points.length < 3) { this.cancel(); return; }
    const mask = buildShapeMask('polygon', s.doc, s.start, s.start, {
      points: s.points, filled: !!this.ui.shapeFill,
      brushSize: Math.max(1, this.ui.brushSize | 0), brushShape: this.ui.brushShape,
    });
    const preview = maskToPreview(s.doc, mask, [s.color[0], s.color[1], s.color[2], 255], {
      symmetry: this.symmetry(), tiled: !!this.ui.tiled, selectionMask: s.selectionMask,
      dither: this.ui.dither, density: this.ui.ditherDensity,
    });
    const changed = commitOverlay(s.cel, s.doc, preview, { selectionMask: s.selectionMask, lockAlpha: s.lockAlpha });
    const after = s.cel.pixels.slice();
    this.state = null;
    this.overlay = null;
    this.setHint('');
    if (changed) {
      commitPixelEdit(this.store, 'Poligon', s.layerId, s.frameId, s.before, after, { icon: 'shape' });
      this.store.addRecentColor(toHex(s.color));
    }
    this.request();
  }

  // ---- curve -------------------------------------------------------------

  curveRequired() {
    return this.ui.curveType === 'quadratic' ? 3 : 4;
  }

  curveClick(p, evt) {
    const required = this.curveRequired();
    if (this.state?.kind === 'curve') {
      const s = this.state;
      if (s.pending) {
        const threshold = Math.max(2, Math.round(4 / Math.max(0.5, evt.zoom || 1)));
        const idx = s.points.findIndex((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) <= threshold);
        if (idx >= 0) {
          s.dragIndex = idx;
          this.setHint('Tarik titik kontrol · Enter/double-click terapkan · Esc batal');
          return true;
        }
        return true;
      }
      if (s.points.length < required) {
        const last = s.points[s.points.length - 1];
        if (!last || last[0] !== p[0] || last[1] !== p[1]) s.points.push(p);
        s.hover = p;
        if (s.points.length >= required) {
          s.pending = true;
          this.setHint('Titik kontrol dapat digeser · Enter/double-click terapkan · Esc batal');
        } else {
          this.setHint(required === 4
            ? 'Klik: awal → kontrol 1 → kontrol 2 → akhir · Esc batal'
            : 'Klik: awal → kontrol → akhir · Esc batal');
        }
        this.updateCurvePreview();
        return true;
      }
      return true;
    }
    const active = this.activeCel();
    if (!active) return true;
    const { cel, doc, session } = active;
    const before = cel.pixels ? cel.pixels.slice() : fullBuffer(doc);
    doc.ensureCel(session.activeLayerId, session.activeFrameId);
    this.state = {
      kind: 'curve', doc, cel, before,
      layerId: session.activeLayerId, frameId: session.activeFrameId,
      points: [p], hover: p, pending: false, dragIndex: null,
      color: this.colorFromButton(evt.button), button: evt.button ?? 0,
      selectionMask: selectionMaskOf(doc), lockAlpha: !!(this.ui.lockAlpha || active.layer.lockAlpha),
    };
    this.setHint(required === 4
      ? 'Klik: awal → kontrol 1 → kontrol 2 → akhir · Esc batal'
      : 'Klik: awal → kontrol → akhir · Esc batal');
    this.updateCurvePreview();
    return true;
  }

  updateCurvePreview() {
    const s = this.state;
    if (!s || s.kind !== 'curve') return;
    const required = this.curveRequired();
    let pts = s.points.slice();
    if (!s.pending && s.hover && pts.length < required) pts = [...pts, s.hover];
    if (pts.length < 2) { this.overlay = null; this.request(); return; }
    const mask = curveMask(s.doc, pts, Math.max(1, this.ui.brushSize | 0), this.ui.brushShape);
    this.overlay = maskToPreview(s.doc, mask, [s.color[0], s.color[1], s.color[2], 255], {
      symmetry: this.symmetry(), tiled: !!this.ui.tiled, selectionMask: s.selectionMask,
      dither: this.ui.dither, density: this.ui.ditherDensity,
    });
    this.request();
  }

  commitCurve() {
    const s = this.state;
    if (!s || s.kind !== 'curve') return;
    if (s.points.length < this.curveRequired()) { this.cancel(); return; }
    const mask = curveMask(s.doc, s.points, Math.max(1, this.ui.brushSize | 0), this.ui.brushShape);
    const preview = maskToPreview(s.doc, mask, [s.color[0], s.color[1], s.color[2], 255], {
      symmetry: this.symmetry(), tiled: !!this.ui.tiled, selectionMask: s.selectionMask,
      dither: this.ui.dither, density: this.ui.ditherDensity,
    });
    const changed = commitOverlay(s.cel, s.doc, preview, { selectionMask: s.selectionMask, lockAlpha: s.lockAlpha });
    const after = s.cel.pixels.slice();
    this.state = null;
    this.overlay = null;
    this.setHint('');
    if (changed) {
      commitPixelEdit(this.store, 'Kurva', s.layerId, s.frameId, s.before, after, { icon: 'curve' });
      this.store.addRecentColor(toHex(s.color));
    }
    this.request();
  }

  // ---- gradient ----------------------------------------------------------

  startGradient(p, evt) {
    const active = this.activeCel();
    if (!active) return true;
    const { cel, doc, session } = active;
    const before = cel.pixels ? cel.pixels.slice() : fullBuffer(doc);
    doc.ensureCel(session.activeLayerId, session.activeFrameId);
    this.state = {
      kind: 'gradient', doc, cel, before,
      layerId: session.activeLayerId, frameId: session.activeFrameId,
      start: p, end: p, modifiers: { shiftKey: !!evt.shiftKey },
      primary: this.colorFromButton(evt.button),
      secondary: this.colorFromButton(evt.button === 2 ? 0 : 2),
      selectionMask: selectionMaskOf(doc), lockAlpha: !!(this.ui.lockAlpha || active.layer.lockAlpha),
    };
    this.setHint('Tarik untuk gradien · Shift sudut 45° · Esc batal');
    this.updateGradientPreview();
    return true;
  }

  gradientGeometry() {
    const s = this.state;
    let end = s.end.slice();
    if (s.modifiers.shiftKey) {
      const dx = end[0] - s.start[0], dy = end[1] - s.start[1];
      const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
      const len = Math.hypot(dx, dy);
      end = [Math.round(s.start[0] + Math.cos(angle) * len), Math.round(s.start[1] + Math.sin(angle) * len)];
    }
    return { start: s.start, end };
  }

  updateGradientPreview() {
    const s = this.state;
    if (!s || s.kind !== 'gradient') return;
    const doc = s.doc;
    const { start, end } = this.gradientGeometry();
    const palette = this.ui.gradientSnapPalette ? (doc.palette?.current?.colors || []) : [];
    const lut = gradientLut(s.primary, s.secondary, palette, this.ui.gradientSnapPalette);
    const out = fullBuffer(doc);
    const dx = end[0] - start[0], dy = end[1] - start[1];
    const len2 = dx * dx + dy * dy || 1;
    const maxR = Math.hypot(dx, dy) || 1;
    const dither = this.ui.dither;
    const density = this.ui.ditherDensity;
    for (let y = 0; y < doc.height; y++) for (let x = 0; x < doc.width; x++) {
      const mi = y * doc.width + x;
      if (s.selectionMask && !s.selectionMask[mi]) continue;
      let t;
      if (this.ui.gradientType === 'radial') t = Math.min(1, Math.hypot(x - start[0], y - start[1]) / maxR);
      else t = Math.max(0, Math.min(1, ((x - start[0]) * dx + (y - start[1]) * dy) / len2));
      let color;
      if (dither !== 'none') {
        const threshold = ditherThreshold(dither, x, y);
        color = t >= threshold ? lut[255] : lut[0];
      } else {
        color = lut[Math.round(t * 255)];
      }
      if (!color) continue;
      const i = mi * 4;
      out[i] = color[0]; out[i + 1] = color[1]; out[i + 2] = color[2]; out[i + 3] = 255;
    }
    this.overlay = out;
    this.request();
  }

  commitGradient() {
    const s = this.state;
    if (!s) return;
    this.updateGradientPreview();
    const changed = commitOverlay(s.cel, s.doc, this.overlay, { selectionMask: s.selectionMask, lockAlpha: s.lockAlpha });
    const after = s.cel.pixels.slice();
    this.state = null;
    this.overlay = null;
    this.setHint('');
    if (changed) {
      commitPixelEdit(this.store, 'Gradien', s.layerId, s.frameId, s.before, after, { icon: 'gradient' });
      this.store.addRecentColor(toHex(s.primary));
    }
    this.request();
  }

  // ---- selection tools ---------------------------------------------------

  startSelection(tool, p, evt) {
    const doc = this.doc;
    if (!doc) return true;
    this.state = {
      kind: 'select', tool, doc, start: p, end: p, points: [p],
      mode: selectionModeFor(evt),
      base: doc.selection ? doc.selection.mask.slice() : new Uint8Array(doc.width * doc.height),
    };
    this.setHint('Tarik untuk membuat seleksi · Shift tambah · Alt kurangi · Shift+Alt irisan');
    this.updateSelectionPreview();
    return true;
  }

  updateSelectionPreview() {
    const s = this.state;
    if (!s) return;
    if (s.tool === 'lasso') {
      this.selectionPreview = { type: 'lasso', points: s.points.slice(), mode: s.mode };
    } else if (s.tool === 'select-ellipse') {
      this.selectionPreview = { type: 'ellipse', start: s.start, end: s.end, mode: s.mode };
    } else {
      this.selectionPreview = { type: 'rect', start: s.start, end: s.end, mode: s.mode };
    }
    this.request();
  }

  finishSelectionDrag() {
    const s = this.state;
    if (!s) return;
    const doc = s.doc;
    let mask;
    if (s.tool === 'lasso') mask = lassoSelection(doc, s.points);
    else if (s.tool === 'select-ellipse') mask = ellipseSelection(doc, s.start, s.end);
    else mask = rectSelection(doc, s.start, s.end);
    this.state = null;
    this.selectionPreview = null;
    this.setHint('');
    applySelection(this.store, mask, { mode: s.mode, label: 'Seleksi' });
    this.request();
  }

  polygonSelectionClick(p, evt) {
    if (this.state?.kind === 'polygon-select') {
      const s = this.state;
      if (s.points.length >= 3 && Math.hypot(p[0] - s.points[0][0], p[1] - s.points[0][1]) <= 2) {
        s.hover = p;
        this.finishPolygonSelection();
        return true;
      }
      const last = s.points[s.points.length - 1];
      if (!last || last[0] !== p[0] || last[1] !== p[1]) s.points.push(p);
      s.hover = p;
      this.setHint('Klik titik berikutnya · klik titik awal/Enter selesai · Esc batal');
      this.updatePolygonSelectionPreview();
      return true;
    }
    const doc = this.doc;
    if (!doc) return true;
    this.state = {
      kind: 'polygon-select', doc, points: [p], hover: p,
      mode: selectionModeFor(evt),
      base: doc.selection ? doc.selection.mask.slice() : new Uint8Array(doc.width * doc.height),
    };
    this.setHint('Klik titik berikutnya · klik titik awal/Enter selesai · Esc batal');
    this.updatePolygonSelectionPreview();
    return true;
  }

  updatePolygonSelectionPreview() {
    const s = this.state;
    if (!s || s.kind !== 'polygon-select') return;
    this.selectionPreview = {
      type: 'polygon', points: [...s.points, s.hover].filter(Boolean), mode: s.mode,
    };
    this.request();
  }

  finishPolygonSelection() {
    const s = this.state;
    if (!s || s.kind !== 'polygon-select') return;
    const mask = s.points.length >= 3 ? lassoSelection(s.doc, s.points) : new Uint8Array(s.doc.width * s.doc.height);
    this.state = null;
    this.selectionPreview = null;
    this.setHint('');
    applySelection(this.store, mask, { mode: s.mode, label: 'Seleksi poligon' });
    this.request();
  }

  magicWand(p, evt) {
    const doc = this.doc;
    if (!doc) return true;
    const source = this.sampleSource('composite');
    if (!source) return true;
    const mask = floodFillMask(source, doc.width, doc.height, p[0], p[1], {
      tolerance: this.ui.tolerance | 0,
      contiguous: this.ui.selectWandContiguous !== false,
      connectivity: this.ui.selectWandConnectivity === 8 ? 8 : 4,
    });
    const mode = selectionModeFor(evt);
    applySelection(this.store, mask, { mode, label: 'Magic wand' });
    this.request();
    return true;
  }

  // ---- move tool ---------------------------------------------------------

  startMove(p, evt) {
    const active = this.activeCel();
    if (!active) return true;
    const { cel, doc, session } = active;
    if (!cel.pixels) return true;
    const selectionActive = doc.selection && !doc.selection.empty;
    if (selectionActive && !doc.selection.contains(p[0], p[1])) {
      this.store.toast('Klik di dalam seleksi untuk memindahkannya.', 'info', 1600);
      return true;
    }
    if (!doc.selection || doc.selection.mask.length !== doc.width * doc.height) {
      doc.selection = new Selection(doc.width, doc.height);
    }
    const before = cel.pixels.slice();
    const movingMask = selectionActive ? doc.selection.mask.slice() : null;
    const movingBuffer = new Uint8ClampedArray(before.length);
    for (let i = 0; i < before.length; i += 4) {
      const pi = i / 4;
      if (movingMask && !movingMask[pi]) continue;
      movingBuffer[i] = before[i]; movingBuffer[i + 1] = before[i + 1];
      movingBuffer[i + 2] = before[i + 2]; movingBuffer[i + 3] = before[i + 3];
    }
    if (movingMask) {
      for (let i = 0; i < cel.pixels.length; i += 4) {
        if (!movingMask[i / 4]) continue;
        cel.pixels[i] = 0; cel.pixels[i + 1] = 0; cel.pixels[i + 2] = 0; cel.pixels[i + 3] = 0;
      }
    } else {
      cel.pixels.fill(0);
    }
    this.state = {
      kind: 'move', doc, cel, before,
      layerId: session.activeLayerId, frameId: session.activeFrameId,
      origin: p, point: p, offset: [0, 0], modifiers: { shiftKey: !!evt.shiftKey },
      movingMask, movingBuffer,
      selectionBefore: movingMask ? movingMask.slice() : null,
      selectionAfter: movingMask ? movingMask.slice() : null,
    };
    this.setHint('Tarik untuk memindahkan · Shift kunci sumbu · Esc batal');
    this.updateMovePreview();
    return true;
  }

  updateMovePreview() {
    const s = this.state;
    if (!s || s.kind !== 'move') return;
    const doc = s.doc;
    let dx = s.point[0] - s.origin[0];
    let dy = s.point[1] - s.origin[1];
    if (s.modifiers.shiftKey) {
      if (Math.abs(dx) >= Math.abs(dy)) dy = 0; else dx = 0;
    }
    s.offset = [dx, dy];
    const out = fullBuffer(doc);
    for (let y = 0; y < doc.height; y++) for (let x = 0; x < doc.width; x++) {
      const pi = y * doc.width + x;
      if (s.movingMask && !s.movingMask[pi]) continue;
      const sx = x - dx, sy = y - dy;
      if (sx < 0 || sy < 0 || sx >= doc.width || sy >= doc.height) continue;
      const si = (sy * doc.width + sx) * 4;
      if (!s.movingBuffer[si + 3]) continue;
      const di = pi * 4;
      out[di] = s.movingBuffer[si]; out[di + 1] = s.movingBuffer[si + 1];
      out[di + 2] = s.movingBuffer[si + 2]; out[di + 3] = s.movingBuffer[si + 3];
    }
    this.overlay = out;
    if (s.selectionBefore) {
      s.selectionAfter = shiftMask(s.selectionBefore, doc.width, doc.height, dx, dy);
      doc.selection.mask.set(s.selectionAfter);
    }
    this.request();
  }

  finishMove() {
    const s = this.state;
    if (!s) return;
    this.updateMovePreview();
    const doc = s.doc;
    if (!s.cel.pixels) s.cel.ensurePixels();
    // The source was cleared in startMove(); stamp the moved content once.
    for (let i = 0; i < this.overlay.length; i += 4) {
      if (!this.overlay[i + 3]) continue;
      s.cel.pixels[i] = this.overlay[i];
      s.cel.pixels[i + 1] = this.overlay[i + 1];
      s.cel.pixels[i + 2] = this.overlay[i + 2];
      s.cel.pixels[i + 3] = this.overlay[i + 3];
    }
    const after = s.cel.pixels.slice();
    if (s.selectionBefore) {
      doc.selection.mask.set(s.selectionAfter);
    }
    this.state = null;
    this.overlay = null;
    this.setHint('');
    const changed = commitPixelEdit(this.store, 'Pindahkan', s.layerId, s.frameId, s.before, after, {
      icon: 'move',
      selectionBefore: s.selectionBefore,
      selectionAfter: s.selectionAfter,
    });
    if (changed === false && s.selectionBefore) {
      // A pure selection move with no pixel change still deserves one undo step.
      commitSilentSelectionMove(this.store, s.selectionBefore, s.selectionAfter);
    }
    if (s.selectionBefore) this.store.emit('selection:change');
    this.request();
  }
}

function unionRect(a, b) {
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  const x2 = Math.max(a.x + a.w, b.x + b.w), y2 = Math.max(a.y + a.h, b.y + b.h);
  return { x, y, w: x2 - x, h: y2 - y };
}

function labelForTool(tool) {
  const labels = {
    pencil: 'Pensil', brush: 'Kuas', eraser: 'Penghapus', spray: 'Semprot',
    shade: 'Shading', line: 'Garis', rect: 'Kotak', 'rounded-rect': 'Kotak bulat',
    ellipse: 'Elips', polygon: 'Poligon', curve: 'Kurva', gradient: 'Gradien',
    fill: 'Isi area', move: 'Pindahkan', text: 'Teks',
  };
  return labels[tool] || 'Menggambar';
}

/** Selection-only moves have no pixel diff; still expose them to undo. */
function commitSilentSelectionMove(store, before, after) {
  const session = store.activeSession;
  if (!session) return;
  const entry = {
    label: 'Pindahkan seleksi', icon: 'move', size: before.length + after.length,
    undo: () => {
      if (store.doc?.selection) { store.doc.selection.mask.set(before); store.emit('selection:change'); }
    },
    redo: () => {
      if (store.doc?.selection) { store.doc.selection.mask.set(after); store.emit('selection:change'); }
    },
  };
  session.history.push(entry);
  session.dirty = true;
  store.emit('history:change', { label: entry.label });
  store.emit('doc:change', { reason: entry.label });
}
