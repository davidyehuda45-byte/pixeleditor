/** Pixel effects: all operate on RGBA buffers and are pure. */
import { parseHex } from '../utils/color.js';

function clone(data) { return data.slice(); }

/** Add an outline around (or inside) opaque pixels. */
export function outline(data, width, height, opts = {}) {
  const {
    color = '#ffffff', outside = true, connectivity = 8, mask = null, opacity = 255,
  } = opts;
  const out = clone(data);
  const [r, g, b, a] = parseHex(color);
  const alpha = opacity;
  const dirs = connectivity === 8
    ? [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]
    : [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const opaque = (x, y) => x >= 0 && y >= 0 && x < width && y < height && data[(y * width + x) * 4 + 3] > 0;
  const inMask = (x, y) => !mask || mask[y * width + x];
  if (outside) {
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (data[i * 4 + 3] > 0 || !inMask(x, y)) continue;
      if (dirs.some(([dx, dy]) => opaque(x + dx, y + dy))) {
        out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b; out[i * 4 + 3] = alpha;
      }
    }
  } else {
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (data[i * 4 + 3] === 0 || !inMask(x, y)) continue;
      if (dirs.some(([dx, dy]) => !opaque(x + dx, y + dy))) {
        out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b; out[i * 4 + 3] = Math.max(a, alpha);
      }
    }
  }
  return out;
}

export function dropShadow(data, width, height, opts = {}) {
  const {
    color = '#000000', opacity = 128, dx = 1, dy = 1, mask = null,
  } = opts;
  const out = clone(data);
  const [r, g, b] = parseHex(color);
  const shadow = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x;
    const a = data[i * 4 + 3];
    if (!a || (mask && !mask[i])) continue;
    const tx = x + dx, ty = y + dy;
    if (tx < 0 || ty < 0 || tx >= width || ty >= height) continue;
    const ti = ty * width + tx;
    if (data[ti * 4 + 3] > 0) continue;
    shadow[ti * 4] = r; shadow[ti * 4 + 1] = g; shadow[ti * 4 + 2] = b;
    shadow[ti * 4 + 3] = Math.round(Math.min(255, opacity * (a / 255)));
  }
  // Shadow behind content.
  for (let i = 0; i < out.length; i += 4) {
    if (!shadow[i + 3]) continue;
    const sa = shadow[i + 3] / 255;
    const da = out[i + 3] / 255;
    const oa = sa + da * (1 - sa);
    if (oa <= 0) continue;
    out[i] = (shadow[i] * sa + out[i] * da * (1 - sa)) / oa;
    out[i + 1] = (shadow[i + 1] * sa + out[i + 1] * da * (1 - sa)) / oa;
    out[i + 2] = (shadow[i + 2] * sa + out[i + 2] * da * (1 - sa)) / oa;
    out[i + 3] = oa * 255;
  }
  return out;
}

export function removeIsolated(data, width, height, mask = null) {
  const out = clone(data);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    if (!data[i + 3] || (mask && !mask[y * width + x])) continue;
    let neighbors = 0;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < width && ny < height && data[(ny * width + nx) * 4 + 3] > 0) neighbors++;
    }
    if (!neighbors) out[i + 3] = 0;
  }
  return out;
}

export function replaceColor(data, width, height, fromHex, toHex, tolerance = 0, mask = null) {
  const out = clone(data);
  const from = parseHex(fromHex), to = parseHex(toHex);
  for (let i = 0; i < out.length; i += 4) {
    if (mask && !mask[i / 4]) continue;
    if (out[i + 3] === 0) continue;
    if (Math.max(Math.abs(out[i] - from[0]), Math.abs(out[i + 1] - from[1]), Math.abs(out[i + 2] - from[2])) <= tolerance) {
      out[i] = to[0]; out[i + 1] = to[1]; out[i + 2] = to[2]; out[i + 3] = to[3];
    }
  }
  return out;
}

export function invertColors(data, width, height, mask = null) {
  const out = clone(data);
  for (let i = 0; i < out.length; i += 4) {
    if (mask && !mask[i / 4]) continue;
    if (!out[i + 3]) continue;
    out[i] = 255 - out[i]; out[i + 1] = 255 - out[i + 1]; out[i + 2] = 255 - out[i + 2];
  }
  return out;
}

export function grayscale(data, width, height, mask = null) {
  const out = clone(data);
  for (let i = 0; i < out.length; i += 4) {
    if (mask && !mask[i / 4]) continue;
    if (!out[i + 3]) continue;
    const l = Math.round(0.2126 * out[i] + 0.7152 * out[i + 1] + 0.0722 * out[i + 2]);
    out[i] = l; out[i + 1] = l; out[i + 2] = l;
  }
  return out;
}

/** @param {{hue:number,saturation:number,brightness:number,contrast:number}} adj */
export function adjustColors(data, width, height, adj, mask = null) {
  const { hue = 0, saturation = 1, brightness = 0, contrast = 1 } = adj;
  const out = clone(data);
  const hShift = hue;
  for (let i = 0; i < out.length; i += 4) {
    if (mask && !mask[i / 4]) continue;
    if (!out[i + 3]) continue;
    let r = out[i] / 255, g = out[i + 1] / 255, b = out[i + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    const d = max - min;
    if (d) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    h = (h + hShift + 360) % 360;
    s = Math.max(0, Math.min(1, s * saturation));
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let rr = 0, gg = 0, bb = 0;
    if (h < 60) [rr, gg, bb] = [c, x, 0];
    else if (h < 120) [rr, gg, bb] = [x, c, 0];
    else if (h < 180) [rr, gg, bb] = [0, c, x];
    else if (h < 240) [rr, gg, bb] = [0, x, c];
    else if (h < 300) [rr, gg, bb] = [x, 0, c];
    else [rr, gg, bb] = [c, 0, x];
    rr = (rr + m + brightness) * contrast;
    gg = (gg + m + brightness) * contrast;
    bb = (bb + m + brightness) * contrast;
    out[i] = Math.max(0, Math.min(255, Math.round(rr * 255)));
    out[i + 1] = Math.max(0, Math.min(255, Math.round(gg * 255)));
    out[i + 2] = Math.max(0, Math.min(255, Math.round(bb * 255)));
  }
  return out;
}

/** Apply a nearest-neighbour scale/rotate to the content inside a selection. */
export function transformContent(data, width, height, rect, transform = {}) {
  const { scaleX = 1, scaleY = 1, angle = 0, flipX = false, flipY = false, algorithm = 'nearest' } = transform;
  const out = clone(data);
  const sw = Math.max(1, Math.round(rect.w * scaleX));
  const sh = Math.max(1, Math.round(rect.h * scaleY));
  const src = new Uint8ClampedArray(rect.w * rect.h * 4);
  for (let y = 0; y < rect.h; y++) for (let x = 0; x < rect.w; x++) {
    const sx = rect.x + x, sy = rect.y + y;
    if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
    const si = (sy * width + sx) * 4, di = (y * rect.w + x) * 4;
    src[di] = data[si]; src[di + 1] = data[si + 1]; src[di + 2] = data[si + 2]; src[di + 3] = data[si + 3];
  }
  // Clear old content.
  for (let y = 0; y < rect.h; y++) for (let x = 0; x < rect.w; x++) {
    const sx = rect.x + x, sy = rect.y + y;
    if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
    const i = (sy * width + sx) * 4;
    out[i] = 0; out[i + 1] = 0; out[i + 2] = 0; out[i + 3] = 0;
  }
  const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    let u = (x + 0.5) / sw - 0.5;
    let v = (y + 0.5) / sh - 0.5;
    if (flipX) u = -u;
    if (flipY) v = -v;
    const ru = u * cos + v * sin, rv = -u * sin + v * cos;
    const sx = Math.floor(cx + ru * rect.w);
    const sy = Math.floor(cy + rv * rect.h);
    if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
    const si = (sy * width + sx) * 4;
    const dx = Math.floor(rect.x + x + (rect.w - sw) / 2);
    const dy = Math.floor(rect.y + y + (rect.h - sh) / 2);
    if (dx < 0 || dy < 0 || dx >= width || dy >= height) continue;
    const di = (dy * width + dx) * 4;
    out[di] = data[si]; out[di + 1] = data[si + 1]; out[di + 2] = data[si + 2]; out[di + 3] = data[si + 3];
  }
  return out;
}
