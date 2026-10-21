/**
 * Pure raster algorithms. Every function here works on typed arrays and can be
 * tested in Node without a DOM. Coordinates use document pixel space.
 */
import { channelDistance } from './color.js';

/** Bresenham line, inclusive of both endpoints. @returns {[number,number][]} */
export function linePoints(x0, y0, x1, y1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const points = [];
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    points.push([x0, y0]);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
  return points;
}

/**
 * Build brush offsets relative to the stamped pixel.
 * @param {'round'|'square'} shape
 * @param {number} size 1..32
 * @returns {{offsets:[number,number][], radius:number}}
 */
export function brushOffsets(shape, size) {
  size = Math.max(1, Math.min(64, Math.round(size)));
  const lo = -Math.floor((size - 1) / 2);
  const hi = lo + size - 1;
  const offsets = [];
  const c = (size - 1) / 2;
  const r = size / 2;
  for (let dy = lo; dy <= hi; dy++) {
    for (let dx = lo; dx <= hi; dx++) {
      if (shape === 'round') {
        const ddx = dx - c, ddy = dy - c;
        if (ddx * ddx + ddy * ddy > (r + 0.15) * (r + 0.15)) continue;
      }
      offsets.push([dx, dy]);
    }
  }
  if (!offsets.length) offsets.push([0, 0]);
  return { offsets, radius: size / 2 };
}

/** Filled/outlined ellipse inscribed in an inclusive integer rect. */
export function ellipseMask(rect, filled = true, thickness = 1) {
  const { x: rx, y: ry, w, h } = rect;
  const out = new Uint8Array(Math.max(1, w) * Math.max(1, h));
  if (w <= 0 || h <= 0) return { mask: out, width: Math.max(1, w), height: Math.max(1, h) };
  const cx = rx + w / 2, cy = ry + h / 2;
  const ax = Math.max(0.5, w / 2), ay = Math.max(0.5, h / 2);
  const inside = (x, y) => {
    const nx = (x + 0.5 - cx) / ax, ny = (y + 0.5 - cy) / ay;
    return nx * nx + ny * ny <= 1.02;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (inside(rx + x, ry + y)) out[y * w + x] = 1;
    }
  }
  if (!filled || thickness <= 1) {
    if (!filled) {
      const border = new Uint8Array(out.length);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!out[i]) continue;
        if (x === 0 || y === 0 || x === w - 1 || y === h - 1 ||
            !out[i - 1] || !out[i + 1] || !out[i - w] || !out[i + w]) border[i] = 1;
      }
      return { mask: border, width: w, height: h };
    }
    return { mask: out, width: w, height: h };
  }
  // Thick outline = fill minus an eroded copy (thickness-1).
  let inner = out;
  for (let t = 1; t < thickness; t++) inner = erode(inner, w, h);
  const border = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) border[i] = out[i] && !inner[i] ? 1 : 0;
  return { mask: border, width: w, height: h };
}

/** Scanline polygon rasteriser (even-odd), coordinates in document space. */
export function polygonMask(points, filled = true, outline = true) {
  if (points.length < 2) return { mask: new Uint8Array(1), x: points[0]?.[0] ?? 0, y: points[0]?.[1] ?? 0, width: 1, height: 1 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  minX = Math.floor(minX); minY = Math.floor(minY);
  const w = Math.ceil(maxX) - minX + 1, h = Math.ceil(maxY) - minY + 1;
  const mask = new Uint8Array(w * h);
  if (filled) {
    for (let y = 0; y < h; y++) {
      const sy = minY + y + 0.5;
      const xs = [];
      for (let i = 0; i < points.length; i++) {
        const a = points[i], b = points[(i + 1) % points.length];
        if ((a[1] <= sy && b[1] > sy) || (b[1] <= sy && a[1] > sy)) {
          xs.push(a[0] + ((sy - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
        }
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const x0 = Math.ceil(xs[i] - 0.5), x1 = Math.floor(xs[i + 1] - 0.5);
        for (let x = x0; x <= x1; x++) {
          const px = x - minX;
          if (px >= 0 && px < w) mask[y * w + px] = 1;
        }
      }
    }
  }
  if (outline) {
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      for (const [x, y] of linePoints(a[0], a[1], b[0], b[1])) {
        const px = x - minX, py = y - minY;
        if (px >= 0 && px < w && py >= 0 && py < h) mask[py * w + px] = 1;
      }
    }
  }
  return { mask, x: minX, y: minY, width: w, height: h };
}

/**
 * Flood fill returning a 1-bit mask (without modifying pixels).
 * Iterative scanline algorithm; safe for 1024×1024.
 * @param {Uint8ClampedArray} data RGBA buffer
 * @param {object} [opts]
 */
export function floodFillMask(data, width, height, sx, sy, opts = {}) {
  const {
    tolerance = 0,
    contiguous = true,
    connectivity = 4,
    allowed = null,
    target = null,
  } = opts;
  const out = new Uint8Array(width * height);
  if (sx < 0 || sy < 0 || sx >= width || sy >= height) return out;
  if (allowed && !allowed[sy * width + sx]) return out;
  const start = (sy * width + sx) * 4;
  const targetColor = target || [data[start], data[start + 1], data[start + 2], data[start + 3]];
  const isTransparentTarget = targetColor[3] === 0;
  const matches = (i) => {
    if (allowed && !allowed[i]) return false;
    const p = i * 4;
    if (isTransparentTarget) return data[p + 3] <= tolerance;
    return channelDistance([data[p], data[p + 1], data[p + 2], data[p + 3]], targetColor) <= tolerance;
  };
  if (!contiguous) {
    for (let i = 0; i < out.length; i++) if (matches(i)) out[i] = 1;
    return out;
  }
  const stack = [];
  stack.push(sy * width + sx);
  const dirs = connectivity === 8
    ? [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]
    : [[-1, 0], [1, 0], [0, -1], [0, 1]];
  while (stack.length) {
    const seed = stack.pop();
    if (out[seed] || !matches(seed)) continue;
    const sy2 = (seed / width) | 0;
    let x0 = seed - sy2 * width;
    // Scanline flood: find horizontal span, mark it, then seeds above/below.
    let left = x0;
    while (left > 0 && !out[sy2 * width + left - 1] && matches(sy2 * width + left - 1)) left--;
    let right = x0;
    while (right < width - 1 && !out[sy2 * width + right + 1] && matches(sy2 * width + right + 1)) right++;
    for (let x = left; x <= right; x++) out[sy2 * width + x] = 1;
    for (const [dx, dy] of dirs) {
      const ny = sy2 + dy;
      if (ny < 0 || ny >= height) continue;
      for (let x = left; x <= right; x++) {
        const nx = x + dx;
        if (nx < 0 || nx >= width) continue;
        const ni = ny * width + nx;
        if (!out[ni] && matches(ni)) stack.push(ni);
      }
    }
  }
  return out;
}

/** Grow (positive) or shrink (negative) a 1-bit mask by N pixels. */
export function growMask(mask, width, height, amount) {
  let out = mask.slice();
  const steps = Math.abs(amount | 0);
  for (let s = 0; s < steps; s++) {
    const next = out.slice();
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (amount > 0) {
        if (out[i]) continue;
        if ((x > 0 && out[i - 1]) || (x < width - 1 && out[i + 1]) ||
            (y > 0 && out[i - width]) || (y < height - 1 && out[i + width]) ||
            (x > 0 && y > 0 && out[i - width - 1]) ||
            (x < width - 1 && y > 0 && out[i - width + 1]) ||
            (x > 0 && y < height - 1 && out[i + width - 1]) ||
            (x < width - 1 && y < height - 1 && out[i + width + 1])) next[i] = 1;
      } else {
        if (!out[i]) continue;
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1 ||
            !out[i - 1] || !out[i + 1] || !out[i - width] || !out[i + width]) next[i] = 0;
      }
    }
    out = next;
  }
  return out;
}

export function invertMask(mask) {
  const out = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i++) out[i] = mask[i] ? 0 : 1;
  return out;
}

export function maskBounds(mask, width, height) {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!mask[y * width + x]) continue;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

export function erode(mask, width, height) {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x;
    if (x === 0 || y === 0 || x === width - 1 || y === height - 1) continue;
    out[i] = mask[i - 1] && mask[i + 1] && mask[i - width] && mask[i + width] ? 1 : 0;
  }
  return out;
}

/** Bounding box of changed pixels between two RGBA buffers. */
export function changedBounds(a, b, width, height) {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const i = (row + x) * 4;
      if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

export function trimBounds(data, width, height, threshold = 1) {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] < threshold) continue;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

export function flipPixels(data, width, height, axis = 'h') {
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const sx = axis === 'h' ? width - 1 - x : x;
    const sy = axis === 'v' ? height - 1 - y : y;
    const si = (sy * width + sx) * 4, di = (y * width + x) * 4;
    out[di] = data[si]; out[di + 1] = data[si + 1]; out[di + 2] = data[si + 2]; out[di + 3] = data[si + 3];
  }
  return out;
}

/** Nearest-neighbour scale. Never interpolates. */
export function scaleNearest(data, width, height, newWidth, newHeight) {
  const out = new Uint8ClampedArray(newWidth * newHeight * 4);
  for (let y = 0; y < newHeight; y++) {
    const sy = Math.min(height - 1, Math.floor((y * height) / newHeight));
    for (let x = 0; x < newWidth; x++) {
      const sx = Math.min(width - 1, Math.floor((x * width) / newWidth));
      const si = (sy * width + sx) * 4, di = (y * newWidth + x) * 4;
      out[di] = data[si]; out[di + 1] = data[si + 1]; out[di + 2] = data[si + 2]; out[di + 3] = data[si + 3];
    }
  }
  return out;
}

/** Rotate by 90/180/270 degrees clockwise. */
export function rotatePixels(data, width, height, degrees) {
  const deg = ((degrees % 360) + 360) % 360;
  if (deg === 0) return { data: data.slice(), width, height };
  if (deg === 180) {
    const out = new Uint8ClampedArray(data.length);
    for (let i = 0; i < width * height; i++) {
      const di = (width * height - 1 - i) * 4, si = i * 4;
      out[di] = data[si]; out[di + 1] = data[si + 1]; out[di + 2] = data[si + 2]; out[di + 3] = data[si + 3];
    }
    return { data: out, width, height };
  }
  const nw = height, nh = width;
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const si = (y * width + x) * 4;
    let nx, ny;
    if (deg === 90) { nx = height - 1 - y; ny = x; }
    else { nx = y; ny = width - 1 - x; }
    const di = (ny * nw + nx) * 4;
    out[di] = data[si]; out[di + 1] = data[si + 1]; out[di + 2] = data[si + 2]; out[di + 3] = data[si + 3];
  }
  return { data: out, width: nw, height: nh };
}

// ---- Dithering -----------------------------------------------------------

const BAYER2 = [[0, 2], [3, 1]];
const BAYER4 = [
  [0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5],
];
const BAYER8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

/** Normalised threshold 0..~1; painting when threshold < coverage. */
export function ditherThreshold(pattern, x, y) {
  switch (pattern) {
    case 'checker': return (x + y) % 2 === 0 ? 0.25 : 0.75;
    case 'dots': return x % 2 === 0 && y % 2 === 0 ? 0.2 : 0.8;
    case 'lines': return y % 2 === 0 ? 0.25 : 0.75;
    case 'bayer2': return (BAYER2[((y % 2) + 2) % 2][((x % 2) + 2) % 2] + 0.5) / 4;
    case 'bayer4': return (BAYER4[((y % 4) + 4) % 4][((x % 4) + 4) % 4] + 0.5) / 16;
    case 'bayer8': return (BAYER8[((y % 8) + 8) % 8][((x % 8) + 8) % 8] + 0.5) / 64;
    default: return 0;
  }
}

/** Symmetry mirrors and radial copies for a point. */
export function symmetryPoints(x, y, opts) {
  const {
    mode = 'none', slices = 2, axisX = 0, axisY = 0, width = 1, height = 1,
  } = opts || {};
  const points = [[x, y]];
  const vAxis = axisX || width / 2;
  const hAxis = axisY || height / 2;
  const vertical = mode === 'vertical' || mode === 'both';
  const horizontal = mode === 'horizontal' || mode === 'both';
  if (vertical) points.push([Math.round(2 * vAxis - 1 - x), y]);
  if (horizontal) points.push([x, Math.round(2 * hAxis - 1 - y)]);
  if (mode === 'both') points.push([Math.round(2 * vAxis - 1 - x), Math.round(2 * hAxis - 1 - y)]);
  if (mode === 'radial') {
    const cx = vAxis - 0.5, cy = hAxis - 0.5;
    const base = Math.atan2(y - cy, x - cx);
    const radius = Math.hypot(x - cx, y - cy);
    const n = Math.max(2, Math.min(12, slices));
    for (let i = 1; i < n; i++) {
      const a = base + (i * Math.PI * 2) / n;
      points.push([Math.round(cx + Math.cos(a) * radius), Math.round(cy + Math.sin(a) * radius)]);
    }
  }
  const seen = new Set();
  return points.filter(([px, py]) => {
    const key = `${px},${py}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Wrap a coordinate into the document, used by seamless/tiled drawing. */
export function wrapPoint(x, y, width, height) {
  return [((x % width) + width) % width, ((y % height) + height) % height];
}

/** Bilinear-free rotation (nearest neighbour) around a pivot. */
export function rotateNearest(data, width, height, degrees, pivotX = width / 2, pivotY = height / 2) {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const dx = x - pivotX, dy = y - pivotY;
    const sx = Math.round(pivotX + dx * cos + dy * sin);
    const sy = Math.round(pivotY - dx * sin + dy * cos);
    if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
    const si = (sy * width + sx) * 4, di = (y * width + x) * 4;
    out[di] = data[si]; out[di + 1] = data[si + 1]; out[di + 2] = data[si + 2]; out[di + 3] = data[si + 3];
  }
  return out;
}

/** Scale2x / EPX for a single RGBA pixel buffer. */
export function scale2x(data, width, height) {
  const nw = width * 2, nh = height * 2;
  const out = new Uint8ClampedArray(nw * nh * 4);
  const same = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  const get = (x, y) => {
    const xx = Math.max(0, Math.min(width - 1, x));
    const yy = Math.max(0, Math.min(height - 1, y));
    const i = (yy * width + xx) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };
  const put = (x, y, c) => {
    const i = (y * nw + x) * 4;
    out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = c[3];
  };
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const P = get(x, y), A = get(x, y - 1), B = get(x + 1, y), C = get(x - 1, y), D = get(x, y + 1);
    let p0 = P, p1 = P, p2 = P, p3 = P;
    if (!same(A, D) && !same(B, C)) {
      p0 = same(C, A) ? A : P;
      p1 = same(A, B) ? B : P;
      p2 = same(C, D) ? C : P;
      p3 = same(B, D) ? D : P;
    }
    put(x * 2, y * 2, p0); put(x * 2 + 1, y * 2, p1);
    put(x * 2, y * 2 + 1, p2); put(x * 2 + 1, y * 2 + 1, p3);
  }
  return { data: out, width: nw, height: nh };
}

/** Resize by RotSprite (rotates via Scale2x then downscales). */
export function rotsprite(data, width, height, degrees) {
  const scaled = scale2x(data, width, height);
  const rotated = rotateNearest(scaled.data, scaled.width, scaled.height, degrees);
  // Downscale back with nearest sampling.
  const out = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const sx = Math.floor((x / width) * rotated.width);
    const sy = Math.floor((y / height) * rotated.height);
    const si = (sy * rotated.width + sx) * 4, di = (y * width + x) * 4;
    out[di] = rotated.data[si]; out[di + 1] = rotated.data[si + 1];
    out[di + 2] = rotated.data[si + 2]; out[di + 3] = rotated.data[si + 3];
  }
  return out;
}
