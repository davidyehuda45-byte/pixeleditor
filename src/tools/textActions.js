import { parseHex, toHex } from '../utils/color.js';
import { commitPixelEdit } from '../core/commands.js';
import { renderText, measureText } from './fonts.js';

/**
 * Stamp built-in bitmap text into a cel. Writes only alpha-255 glyph pixels.
 * @returns {{ok:boolean, rect?:object}}
 */
export function insertBitmapText(store, opts = {}) {
  const session = store.activeSession;
  const doc = session?.doc;
  if (!doc) return { ok: false };
  const layerId = opts.layerId || session.activeLayerId;
  const frameId = opts.frameId || session.activeFrameId;
  const layer = doc.getLayer(layerId);
  if (!layer || layer.locked || layer.type !== 'layer') {
    store.toast('Layer teks tidak bisa diedit.', 'warn');
    return { ok: false };
  }
  const text = String(opts.text ?? '');
  if (!text.trim()) return { ok: false };
  const color = parseHex(opts.color || store.ui.primary);
  if (color[3] === 0) {
    store.toast('Warna teks transparan.', 'warn');
    return { ok: false };
  }
  const font = opts.font || store.ui.textFont;
  const scale = Math.max(1, Math.min(8, opts.scale || store.ui.textSize || 1));
  const align = opts.align || store.ui.textAlign || 'left';
  const rendered = renderText(text, { font, scale, align, color });
  const cel = doc.getCel(layerId, frameId);
  const before = cel?.pixels ? cel.pixels.slice() : new Uint8ClampedArray(doc.width * doc.height * 4);
  const target = doc.ensureCel(layerId, frameId);
  const ox = Math.round(opts.x ?? 0);
  const oy = Math.round(opts.y ?? 0);
  const selectionMask = doc.selection && !doc.selection.empty ? doc.selection.mask : null;
  let minX = doc.width, minY = doc.height, maxX = -1, maxY = -1;
  for (let y = 0; y < rendered.height; y++) for (let x = 0; x < rendered.width; x++) {
    const si = (y * rendered.width + x) * 4;
    if (!rendered.data[si + 3]) continue;
    const px = ox + x, py = oy + y;
    if (px < 0 || py < 0 || px >= doc.width || py >= doc.height) continue;
    if (selectionMask && !selectionMask[py * doc.width + px]) continue;
    if (layer.lockAlpha && target.pixels[(py * doc.width + px) * 4 + 3] === 0) continue;
    const di = (py * doc.width + px) * 4;
    target.pixels[di] = rendered.data[si];
    target.pixels[di + 1] = rendered.data[si + 1];
    target.pixels[di + 2] = rendered.data[si + 2];
    target.pixels[di + 3] = rendered.data[si + 3];
    if (px < minX) minX = px; if (py < minY) minY = py;
    if (px > maxX) maxX = px; if (py > maxY) maxY = py;
  }
  if (maxX < 0) {
    store.toast('Teks berada di luar kanvas atau seleksi.', 'warn');
    return { ok: false };
  }
  const after = target.pixels.slice();
  const ok = commitPixelEdit(store, 'Teks', layerId, frameId, before, after, { icon: 'text' });
  store.addRecentColor(toHex(color));
  return {
    ok,
    rect: { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 },
  };
}

export function textPreview(text, opts = {}) {
  return measureText(text, opts);
}
