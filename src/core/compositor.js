/**
 * Pure RGBA compositor. Handles nested groups with isolated opacity/blend,
 * clipping, visibility and reference layers. No DOM dependencies.
 */
import { parseHex } from '../utils/color.js';

/** Separable blend functions (channel values 0..255). */
export function blendChannel(mode, d, s) {
  switch (mode) {
    case 'multiply': return (d * s) / 255;
    case 'screen': return 255 - ((255 - d) * (255 - s)) / 255;
    case 'overlay': return d < 128 ? (2 * d * s) / 255 : 255 - (2 * (255 - d) * (255 - s)) / 255;
    case 'darken': return Math.min(d, s);
    case 'lighten': return Math.max(d, s);
    case 'add': return Math.min(255, d + s);
    case 'subtract': return Math.max(0, d - s);
    case 'difference': return Math.abs(d - s);
    default: return s;
  }
}

/**
 * Composite a straight-alpha source pixel over a destination pixel.
 * @param {Uint8ClampedArray} dst
 * @param {number} di destination byte index
 */
export function compositePixel(dst, di, sr, sg, sb, sa, opacity = 1, mode = 'normal') {
  const saN = (sa / 255) * opacity;
  if (saN <= 0) return;
  const da = dst[di + 3] / 255;
  const oa = saN + da * (1 - saN);
  if (oa <= 0) return;
  if (mode === 'normal') {
    dst[di] = (sr * saN + dst[di] * da * (1 - saN)) / oa;
    dst[di + 1] = (sg * saN + dst[di + 1] * da * (1 - saN)) / oa;
    dst[di + 2] = (sb * saN + dst[di + 2] * da * (1 - saN)) / oa;
  } else {
    const br = blendChannel(mode, dst[di], sr);
    const bg = blendChannel(mode, dst[di + 1], sg);
    const bb = blendChannel(mode, dst[di + 2], sb);
    dst[di] = ((1 - saN) * dst[di] + saN * ((1 - da) * sr + da * br)) / oa;
    dst[di + 1] = ((1 - saN) * dst[di + 1] + saN * ((1 - da) * sg + da * bg)) / oa;
    dst[di + 2] = ((1 - saN) * dst[di + 2] + saN * ((1 - da) * sb + da * bb)) / oa;
  }
  dst[di + 3] = oa * 255;
}

/** Build a bottom-to-top layer tree from the flat layer array. */
export function buildLayerTree(layers) {
  const nodes = new Map();
  for (const layer of layers) nodes.set(layer.id, { layer, children: [] });
  const roots = [];
  for (const layer of layers) {
    const node = nodes.get(layer.id);
    if (layer.parentId && nodes.has(layer.parentId)) nodes.get(layer.parentId).children.push(node);
    else roots.push(node);
  }
  return roots;
}

function drawCel(target, tw, th, cel, rect, opacity, mode, clipMask = null) {
  if (!cel || !cel.pixels) return;
  const y0 = Math.max(0, cel.y - rect.y);
  const y1 = Math.min(th, cel.y - rect.y + cel.height);
  const x0 = Math.max(0, cel.x - rect.x);
  const x1 = Math.min(tw, cel.x - rect.x + cel.width);
  for (let y = y0; y < y1; y++) {
    const cy = rect.y + y - cel.y;
    for (let x = x0; x < x1; x++) {
      const di = (y * tw + x) * 4;
      if (clipMask && clipMask[di + 3] === 0) continue;
      const cx = rect.x + x - cel.x;
      const si = (cy * cel.width + cx) * 4;
      const sa = cel.pixels[si + 3];
      if (!sa) continue;
      compositePixel(target, di, cel.pixels[si], cel.pixels[si + 1], cel.pixels[si + 2], sa, opacity, mode);
    }
  }
}

/** Alpha mask of a target buffer. */
function alphaMask(buffer) {
  const out = new Uint8ClampedArray(buffer.length);
  for (let i = 3; i < out.length; i += 4) out[i] = buffer[i];
  return out;
}

function compositeBuffer(dst, src, tw, th, opacity, mode) {
  if (opacity <= 0) return;
  for (let i = 0; i < tw * th * 4; i += 4) {
    const sa = src[i + 3];
    if (!sa) continue;
    compositePixel(dst, i, src[i], src[i + 1], src[i + 2], sa, opacity, mode);
  }
}

function drawSequence(nodes, target, tw, th, ctx, inheritedClip = null) {
  let clipMask = inheritedClip;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const { layer } = node;
    if (!layer.visible && !ctx.includeHidden) continue;
    if (layer.reference && !ctx.includeReference) continue;
    const opacity = layer.opacity / 255;
    if (layer.type === 'group') {
      const temp = new Uint8ClampedArray(target.length);
      drawSequence(node.children, temp, tw, th, ctx, null);
      if (layer.clipping && clipMask) {
        for (let p = 0; p < temp.length; p += 4) if (!clipMask[p + 3]) temp[p + 3] = 0;
      }
      compositeBuffer(target, temp, tw, th, opacity, layer.blend);
      if (!layer.clipping) {
        clipMask = nodes.slice(i + 1).some((n) => n.layer.clipping) ? alphaMask(target) : null;
      }
      continue;
    }
    const cel = ctx.doc.getCel(layer.id, ctx.frameId);
    drawCel(target, tw, th, cel, ctx.rect, opacity, layer.blend, layer.clipping ? clipMask : null);
    if (!layer.clipping) {
      // Build the clip base only when the next sibling is actually clipping.
      clipMask = nodes.slice(i + 1).some((n) => n.layer.clipping) ? alphaMask(target) : null;
    }
  }
}

/**
 * Render a frame rect. Returns RGBA for `rect` only.
 * @param {import('./document.js').PixelDocument} doc
 * @param {string} frameId
 * @param {{x:number,y:number,w:number,h:number}} rect
 * @param {{includeHidden?:boolean,includeReference?:boolean,background?:boolean}} [opts]
 */
export function renderRect(doc, frameId, rect, opts = {}) {
  const { includeHidden = false, includeReference = true, background = false } = opts;
  const out = new Uint8ClampedArray(rect.w * rect.h * 4);
  if (background && doc.background) {
    const [r, g, b, a] = parseHex(doc.background);
    for (let i = 0; i < out.length; i += 4) {
      out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = a;
    }
  }
  const ctx = { doc, frameId, rect, includeHidden, includeReference, background };
  drawSequence(buildLayerTree(doc.layers), out, rect.w, rect.h, ctx, null);
  return out;
}

/** Render a complete frame. */
export function renderComposite(doc, frameId, opts = {}) {
  const data = renderRect(doc, frameId, { x: 0, y: 0, w: doc.width, h: doc.height }, opts);
  return { data, width: doc.width, height: doc.height };
}

/** Manually composite a cel over a buffer (tests/tools). */
export function paintCel(target, targetWidth, cel, cellX, cellY, opacity = 1, mode = 'normal') {
  const targetHeight = Math.ceil(target.length / 4 / targetWidth);
  for (let y = 0; y < cel.height; y++) for (let x = 0; x < cel.width; x++) {
    const tx = cellX + x, ty = cellY + y;
    if (tx < 0 || ty < 0 || tx >= targetWidth || ty >= targetHeight) continue;
    const si = (y * cel.width + x) * 4;
    const di = (ty * targetWidth + tx) * 4;
    const a = cel.pixels[si + 3];
    if (!a) continue;
    compositePixel(target, di, cel.pixels[si], cel.pixels[si + 1], cel.pixels[si + 2], a, opacity, mode);
  }
}
