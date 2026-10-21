/**
 * Pure drawing helpers shared by the tool engine and tests.
 * All coordinates are document pixels; all buffers are straight-alpha RGBA.
 */
import { brushOffsets, linePoints, ellipseMask, polygonMask, symmetryPoints, wrapPoint, ditherThreshold, erode } from '../utils/raster.js';

/**
 * Resolve brush dabs with symmetry and tiling.
 * @returns {[number,number][]} unique pixels to affect
 */
export function resolveDabPixels(doc, x, y, opts = {}) {
  const { brushSize = 1, brushShape = 'round', symmetry = null, tiled = false } = opts;
  const { offsets } = brushOffsets(brushShape, brushSize);
  const seen = new Set();
  const out = [];
  const points = symmetryPoints(x, y, {
    mode: symmetry?.mode || 'none',
    slices: symmetry?.slices || 2,
    axisX: symmetry?.axisX ?? null,
    axisY: symmetry?.axisY ?? null,
    width: doc.width,
    height: doc.height,
  });
  for (const [px, py] of points) {
    for (const [dx, dy] of offsets) {
      let tx = px + dx, ty = py + dy;
      if (tiled) [tx, ty] = wrapPoint(tx, ty, doc.width, doc.height);
      if (tx < 0 || ty < 0 || tx >= doc.width || ty >= doc.height) continue;
      const key = ty * doc.width + tx;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push([tx, ty]);
    }
  }
  return out;
}

/**
 * Paint one brush dab into a cel.
 * @param {import('../core/cel.js').Cel} cel
 * @param {import('../core/document.js').PixelDocument} doc
 * @param {number} x
 * @param {number} y
 * @param {number[]} color RGBA 0..255
 * @param {object} opts
 * @returns {{x:number,y:number,w:number,h:number}|null} dirty rect
 */
export function paintDab(cel, doc, x, y, color, opts = {}) {
  if (!cel?.pixels) return null;
  const {
    selectionMask = null, lockAlpha = false, dither = 'none', density = 0.5,
    replaceColor = null, replaceTolerance = 0, opacity = 255,
  } = opts;
  const pixels = resolveDabPixels(doc, x, y, opts);
  let minX = doc.width, minY = doc.height, maxX = -1, maxY = -1;
  const useDither = dither && dither !== 'none';
  for (const [px, py] of pixels) {
    const i = (py * doc.width + px) * 4;
    if (selectionMask && !selectionMask[py * doc.width + px]) continue;
    if (lockAlpha && cel.pixels[i + 3] === 0) continue;
    if (replaceColor) {
      const dist = Math.max(
        Math.abs(cel.pixels[i] - replaceColor[0]),
        Math.abs(cel.pixels[i + 1] - replaceColor[1]),
        Math.abs(cel.pixels[i + 2] - replaceColor[2]),
      );
      if (dist > replaceTolerance) continue;
    }
    if (useDither && ditherThreshold(dither, px, py) >= density) continue;
    const a = opacity;
    if (cel.pixels[i] === color[0] && cel.pixels[i + 1] === color[1] && cel.pixels[i + 2] === color[2] && cel.pixels[i + 3] === a) continue;
    cel.pixels[i] = color[0];
    cel.pixels[i + 1] = color[1];
    cel.pixels[i + 2] = color[2];
    cel.pixels[i + 3] = a;
    if (px < minX) minX = px;
    if (py < minY) minY = py;
    if (px > maxX) maxX = px;
    if (py > maxY) maxY = py;
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/** Draw a soft eraser dab (alpha 0). */
export function eraseDab(cel, doc, x, y, opts = {}) {
  return paintDab(cel, doc, x, y, [0, 0, 0, 0], { ...opts, opacity: 0 });
}

/** Build points along a Bresenham segment, excluding the first point. */
export function segmentPoints(from, to) {
  return linePoints(from[0], from[1], to[0], to[1]).slice(1);
}

/**
 * Remove redundant L-corner pixels from a freehand path.
 * Three consecutive points where the middle is diagonal from both neighbours
 * produce a visible "staircase nub"; the middle point is redundant.
 */
export function pixelPerfectFilter(points) {
  if (points.length < 3) return points.slice();
  const out = [points[0]];
  for (let i = 1; i < points.length; i++) {
    out.push(points[i]);
    while (out.length >= 3) {
      const a = out[out.length - 3], b = out[out.length - 2], c = out[out.length - 1];
      const ab = [Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])];
      const bc = [Math.abs(b[0] - c[0]), Math.abs(b[1] - c[1])];
      const diag = ab[0] === 1 && ab[1] === 1 && bc[0] === 1 && bc[1] === 1;
      if (diag) out.splice(out.length - 2, 1);
      else break;
    }
  }
  return out;
}

// ---- Shape masks ---------------------------------------------------------

function fullMask(w, h) { return new Uint8Array(w * h); }

function stampBrushMask(mask, doc, pts, brushSize, brushShape) {
  const { offsets } = brushOffsets(brushShape, brushSize);
  for (const [x, y] of pts) {
    for (const [dx, dy] of offsets) {
      const px = x + dx, py = y + dy;
      if (px < 0 || py < 0 || px >= doc.width || py >= doc.height) continue;
      mask[py * doc.width + px] = 1;
    }
  }
}

function rectMask(doc, x, y, w, h) {
  const mask = fullMask(doc.width, doc.height);
  const x0 = Math.max(0, Math.min(x, x + w)), x1 = Math.min(doc.width, Math.max(x, x + w));
  const y0 = Math.max(0, Math.min(y, y + h)), y1 = Math.min(doc.height, Math.max(y, y + h));
  for (let py = y0; py < y1; py++) for (let px = x0; px < x1; px++) mask[py * doc.width + px] = 1;
  return mask;
}

function roundedRectMask(doc, x, y, w, h, radius) {
  const mask = fullMask(doc.width, doc.height);
  const r = Math.max(1, Math.min(radius, Math.floor(Math.min(w, h) / 2)));
  const x0 = Math.max(0, x), y0 = Math.max(0, y);
  const x1 = Math.min(doc.width, x + w), y1 = Math.min(doc.height, y + h);
  const cxL = x + r, cxR = x + w - r, cyT = y + r, cyB = y + h - r;
  for (let py = y0; py < y1; py++) for (let px = x0; px < x1; px++) {
    let inside = true;
    const test = (cx, cy) => (px + 0.5 - cx) ** 2 + (py + 0.5 - cy) ** 2 <= r * r;
    if (px < cxL && py < cyT) inside = test(cxL, cyT);
    else if (px >= cxR && py < cyT) inside = test(cxR, cyT);
    else if (px < cxL && py >= cyB) inside = test(cxL, cyB);
    else if (px >= cxR && py >= cyB) inside = test(cxR, cyB);
    if (inside) mask[py * doc.width + px] = 1;
  }
  return mask;
}

function borderMask(mask, doc, thickness = 1) {
  let inner = mask;
  for (let i = 0; i < Math.max(0, thickness - 1); i++) inner = erode(inner, doc.width, doc.height);
  const out = fullMask(doc.width, doc.height);
  for (let i = 0; i < mask.length; i++) out[i] = mask[i] && !inner[i] ? 1 : 0;
  return out;
}

export function buildShapeMask(tool, doc, start, end, opts = {}) {
  const {
    filled = false, thickness = 1, brushSize = 1, brushShape = 'round', radius = 4,
    points = null, snapAngle = false,
  } = opts;
  let x0 = Math.round(start[0]), y0 = Math.round(start[1]);
  let x1 = Math.round(end[0]), y1 = Math.round(end[1]);
  if (snapAngle) {
    const dx = x1 - x0, dy = y1 - y0;
    const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
    const len = Math.max(Math.abs(dx), Math.abs(dy));
    x1 = Math.round(x0 + Math.cos(angle) * len);
    y1 = Math.round(y0 + Math.sin(angle) * len);
  }
  const rx = Math.min(x0, x1), ry = Math.min(y0, y1);
  const rw = Math.abs(x1 - x0) + 1, rh = Math.abs(y1 - y0) + 1;
  if (tool === 'line') {
    const mask = fullMask(doc.width, doc.height);
    stampBrushMask(mask, doc, linePoints(x0, y0, x1, y1), brushSize, brushShape);
    return mask;
  }
  if (tool === 'rect' || tool === 'rounded-rect') {
    const fill = tool === 'rounded-rect' ? roundedRectMask(doc, rx, ry, rw, rh, radius) : rectMask(doc, rx, ry, rw, rh);
    let mask = fill;
    if (!filled) mask = borderMask(fill, doc, Math.max(1, thickness));
    if (brushSize > 1) {
      const extra = fullMask(doc.width, doc.height);
      stampBrushMask(extra, doc, maskPoints(mask, doc.width), brushSize, brushShape);
      mask = extra;
    }
    return mask;
  }
  if (tool === 'ellipse') {
    const local = ellipseMask({ x: rx, y: ry, w: rw, h: rh }, filled, Math.max(1, thickness));
    const mask = fullMask(doc.width, doc.height);
    for (let y = 0; y < local.height; y++) for (let x = 0; x < local.width; x++) {
      if (!local.mask[y * local.width + x]) continue;
      const px = rx + x, py = ry + y;
      if (px >= 0 && py >= 0 && px < doc.width && py < doc.height) mask[py * doc.width + px] = 1;
    }
    if (brushSize > 1) {
      const extra = fullMask(doc.width, doc.height);
      stampBrushMask(extra, doc, maskPoints(mask, doc.width), brushSize, brushShape);
      mask = extra;
    }
    return mask;
  }
  if (tool === 'polygon' && points?.length) {
    const local = polygonMask(points, filled, true);
    const mask = fullMask(doc.width, doc.height);
    for (let y = 0; y < local.height; y++) for (let x = 0; x < local.width; x++) {
      if (!local.mask[y * local.width + x]) continue;
      const px = local.x + x, py = local.y + y;
      if (px >= 0 && py >= 0 && px < doc.width && py < doc.height) mask[py * doc.width + px] = 1;
    }
    return mask;
  }
  return fullMask(doc.width, doc.height);
}

/**
 * Stroke a Bezier curve with the current brush.
 * @returns {Uint8Array} full-canvas mask
 */
export function curveMask(doc, points, brushSize = 1, brushShape = 'round') {
  const mask = new Uint8Array(doc.width * doc.height);
  const pts = bezierPoints(points, 160);
  stampBrushMask(mask, doc, pts, brushSize, brushShape);
  return mask;
}

function maskPoints(mask, width) {
  const points = [];
  for (let i = 0; i < mask.length; i++) if (mask[i]) points.push([i % width, Math.floor(i / width)]);
  return points;
}

/** Rasterised Bezier curve through arbitrary control points. */
export function bezierPoints(points, steps = 120) {
  if (points.length < 2) return points.slice();
  if (points.length === 2) {
    const [a, b] = points;
    return linePoints(a[0], a[1], b[0], b[1]).map(([x, y]) => [Math.round(x), Math.round(y)]);
  }
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let px, py;
    if (points.length === 3) {
      const [a, b, c] = points;
      px = (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * b[0] + t ** 2 * c[0];
      py = (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * b[1] + t ** 2 * c[1];
    } else {
      const [a, b, c, d] = points;
      px = (1 - t) ** 3 * a[0] + 3 * (1 - t) ** 2 * t * b[0] + 3 * (1 - t) * t ** 2 * c[0] + t ** 3 * d[0];
      py = (1 - t) ** 3 * a[1] + 3 * (1 - t) ** 2 * t * b[1] + 3 * (1 - t) * t ** 2 * c[1] + t ** 3 * d[1];
    }
    out.push([Math.round(px), Math.round(py)]);
  }
  return out;
}

/**
 * Build a layer-sized preview buffer from a shape mask, applying symmetry,
 * tiling, selection and dithering.
 */
export function maskToPreview(doc, mask, color, opts = {}) {
  const {
    symmetry = null, tiled = false, selectionMask = null, dither = 'none', density = 0.5,
  } = opts;
  const out = new Uint8ClampedArray(doc.width * doc.height * 4);
  const points = [];
  for (let i = 0; i < mask.length; i++) if (mask[i]) points.push([i % doc.width, Math.floor(i / doc.width)]);
  const seen = new Set();
  for (const [x, y] of points) {
    const sym = symmetryPoints(x, y, {
      mode: symmetry?.mode || 'none', slices: symmetry?.slices || 2,
      axisX: symmetry?.axisX ?? null, axisY: symmetry?.axisY ?? null,
      width: doc.width, height: doc.height,
    });
    for (let [px, py] of sym) {
      if (tiled) [px, py] = wrapPoint(px, py, doc.width, doc.height);
      if (px < 0 || py < 0 || px >= doc.width || py >= doc.height) continue;
      const idx = py * doc.width + px;
      if (seen.has(idx)) continue;
      if (selectionMask && !selectionMask[idx]) continue;
      if (dither !== 'none' && ditherThreshold(dither, px, py) >= density) continue;
      seen.add(idx);
      out[idx * 4] = color[0]; out[idx * 4 + 1] = color[1];
      out[idx * 4 + 2] = color[2]; out[idx * 4 + 3] = 255;
    }
  }
  return out;
}

/** Apply an overlay (RGBA) onto a cel, respecting selection/lock alpha. */
export function commitOverlay(cel, doc, overlay, opts = {}) {
  const { selectionMask = null, lockAlpha = false } = opts;
  if (!cel?.pixels) return null;
  let minX = doc.width, minY = doc.height, maxX = -1, maxY = -1;
  for (let i = 0; i < overlay.length; i += 4) {
    if (!overlay[i + 3]) continue;
    const pi = i / 4;
    if (selectionMask && !selectionMask[pi]) continue;
    if (lockAlpha && cel.pixels[i + 3] === 0) continue;
    cel.pixels[i] = overlay[i]; cel.pixels[i + 1] = overlay[i + 1];
    cel.pixels[i + 2] = overlay[i + 2]; cel.pixels[i + 3] = overlay[i + 3];
    const x = pi % doc.width, y = Math.floor(pi / doc.width);
    if (x < minX) minX = x; if (y < minY) minY = y;
    if (x > maxX) maxX = x; if (y > maxY) maxY = y;
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/** Linear/radial gradient over a mask (1 = affected). */
export function gradientMask(doc, mask, start, end, opts = {}) {
  const { type = 'linear', dither = 'none', density = 0.5, fromAlpha = 255 } = opts;
  const out = new Uint8ClampedArray(doc.width * doc.height * 4);
  const sx = start[0], sy = start[1], ex = end[0], ey = end[1];
  const dx = ex - sx, dy = ey - sy;
  const len2 = dx * dx + dy * dy || 1;
  const maxR = Math.hypot(dx, dy) || 1;
  for (let y = 0; y < doc.height; y++) for (let x = 0; x < doc.width; x++) {
    const i = y * doc.width + x;
    if (!mask[i]) continue;
    let t;
    if (type === 'radial') t = Math.min(1, Math.hypot(x - sx, y - sy) / maxR);
    else t = Math.max(0, Math.min(1, ((x - sx) * dx + (y - sy) * dy) / len2));
    if (dither !== 'none') {
      const threshold = ditherThreshold(dither, x, y);
      t = t > threshold ? 1 : 0;
    } else {
      t = t >= 1 ? 1 : 0;
    }
    if (!t) continue;
    out[i * 4] = fromAlpha[0]; out[i * 4 + 1] = fromAlpha[1];
    out[i * 4 + 2] = fromAlpha[2]; out[i * 4 + 3] = 255;
  }
  return out;
}

/** Simple deterministic PRNG for spray strokes. */
export function seededRandom(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Color ramp neighbour lookup used by the shading tool. */
export function shadeColor(color, paletteColors, direction) {
  if (!paletteColors.length) return color;
  let best = 0, bestD = Infinity;
  for (let i = 0; i < paletteColors.length; i++) {
    const c = paletteColors[i];
    const d = Math.abs(c[0] - color[0]) + Math.abs(c[1] - color[1]) + Math.abs(c[2] - color[2]);
    if (d < bestD) { bestD = d; best = i; }
  }
  const next = paletteColors[(best + (direction >= 0 ? 1 : -1) + paletteColors.length) % paletteColors.length];
  return next || color;
}

/** Normalise a selection-mode from modifier keys. */
export function selectionModeFor(event) {
  if (event.shiftKey && event.altKey) return 'intersect';
  if (event.shiftKey) return 'add';
  if (event.altKey) return 'subtract';
  return 'replace';
}
