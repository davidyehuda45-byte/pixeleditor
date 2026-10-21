/**
 * Colour utilities. Colours are represented as `#rrggbb` / `#rrggbbaa` strings in
 * the store, and as four-channel arrays in hot raster loops.
 * No DOM APIs are used here so the module is Node-testable.
 */

export const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v | 0);

/** @param {string} hex @returns {[number, number, number, number]} */
export function parseHex(hex) {
  if (typeof hex !== 'string') return [0, 0, 0, 0];
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length === 4) h = h.split('').map((c) => c + c).join('');
  if (h.length === 6) h += 'ff';
  if (h.length !== 8 || !/^[0-9a-f]+$/i.test(h)) return [0, 0, 0, 0];
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
    parseInt(h.slice(6, 8), 16),
  ];
}

const h2 = (n) => clamp255(n).toString(16).padStart(2, '0');

/** @param {[number,number,number,number]|{r:number,g:number,b:number,a?:number}} c */
export function toHex(c, includeAlpha = true) {
  const [r, g, b, a] = Array.isArray(c) ? c : [c.r, c.g, c.b, c.a ?? 255];
  if (includeAlpha && a < 255) return `#${h2(r)}${h2(g)}${h2(b)}${h2(a)}`;
  return `#${h2(r)}${h2(g)}${h2(b)}`;
}

/** @param {string} hex */
export function normalizeHex(hex, includeAlpha = true) {
  return toHex(parseHex(hex), includeAlpha);
}

/** @param {number} r @param {number} g @param {number} b @returns {{h:number,s:number,v:number}} */
export function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

/** @returns {[number, number, number]} */
export function hsvToRgb(h, s, v) {
  h = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/** HSL, used by the colour panel. */
export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return { h, s, l };
}

/** @returns {[number, number, number]} */
export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/** WCAG relative luminance. @param {string|[number,number,number]} color */
export function luminance(color) {
  const [r, g, b] = Array.isArray(color) ? color : parseHex(color);
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** @param {string} a @param {string} b */
export function contrastRatio(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Linear RGB mix. @param {string} a @param {string} b @param {number} t */
export function mixHex(a, b, t) {
  const ca = parseHex(a), cb = parseHex(b);
  return toHex(ca.map((v, i) => Math.round(v + (cb[i] - v) * t)));
}

/** Shift a colour in HSV space; value in -1..1. */
export function shiftHsv(hex, dh = 0, ds = 0, dv = 0) {
  const [r, g, b, a] = parseHex(hex);
  const { h, s, v } = rgbToHsv(r, g, b);
  const [nr, ng, nb] = hsvToRgb(h + dh * 360, Math.max(0, Math.min(1, s + ds)), Math.max(0, Math.min(1, v + dv)));
  return toHex([nr, ng, nb, a]);
}

/** Perceptually simple RGBA distance used by tolerances (0..255). */
export function channelDistance(a, b) {
  return Math.max(
    Math.abs(a[0] - b[0]),
    Math.abs(a[1] - b[1]),
    Math.abs(a[2] - b[2]),
    Math.abs(a[3] - b[3]),
  );
}

/** Colour-over operator for straight-alpha RGBA. */
export function over(dst, src, alpha = 1) {
  const sa = (src[3] / 255) * alpha;
  if (sa <= 0) return dst;
  const da = dst[3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa <= 0) return [0, 0, 0, 0];
  return [
    Math.round((src[0] * sa + dst[0] * da * (1 - sa)) / oa),
    Math.round((src[1] * sa + dst[1] * da * (1 - sa)) / oa),
    Math.round((src[2] * sa + dst[2] * da * (1 - sa)) / oa),
    Math.round(oa * 255),
  ];
}
