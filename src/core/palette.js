/**
 * Palette model, built-in palettes and palette file parsers.
 * Colours are stored as lowercase hex without alpha (palette entries are opaque).
 */
import { parseHex, toHex, mixHex, shiftHsv, rgbToHsv, hsvToRgb } from '../utils/color.js';

export const BUILTIN_PALETTES = {
  'Sweetie 16': ['1a1c2c', '5d275d', 'b13e53', 'ef7d57', 'ffcd75', 'a7f070', '38b764', '257179', '29366f', '3b5dc9', '41a6f6', '73eff7', 'f4f4f4', '94b0c2', '566c86', '333c57'],
  'Pico-8': ['000000', '1d2b53', '7e2553', '008751', 'ab5236', '5f574f', 'c2c3c7', 'fff1e8', 'ff004d', 'ffa300', 'ffec27', '00e436', '29adff', '83769c', 'ff77a8', 'ffccaa'],
  'Game Boy': ['0f380f', '306230', '8bac0f', '9bbc0f'],
  'NES': ['000000', 'fcfcfc', 'f8f8f8', 'bcbcbc', '7c7c7c', 'a4e4fc', '3cbcfc', '0078f8', '0000fc', 'b8b8f8', '6888fc', '0058f8', '0000bc', 'd8b8f8', '9878f8', '6844fc', '4428bc', 'f8b8f8', 'f878f8', 'd800cc', '940084', 'f8a4c0', 'f85898', 'e40058', 'a80020', 'f0d0b0', 'f87858', 'f83800', 'a81000', 'fce0a8', 'fca044', 'e45c10', '881400', 'f8d878', 'f8b800', 'ac7c00', '503000', 'd8f878', 'b8f818', '00b800', '007800', 'b8f8b8', '58d854', '00a800', '006800', 'b8f8d8', '58f898', '00a844', '005800', '00fcfc', '00e8d8', '008888', '004058', 'f8d8f8', '787878'],
  'Apollo': ['172038', '253a5e', '3c5e8b', '4f8fba', '73bed3', 'a4dddb', '19332d', '25562e', '468232', '75a743', 'a8ca58', 'd0da91', '4d2b32', '7a4841', 'ad7757', 'c09473', 'd7b594', 'e7d5b3', '341c27', '602c2c', '884b2b', 'be772b', 'de9e41', 'e8c170', '241527', '411d31', '752438', 'a53030', 'cf573c', 'da863e', '1e1d39', '402751', '7a367b', 'a23e8c', 'c65197', 'df84a5', '090a14', '10141f', '151d28', '202e37', '394a50', '577277', '819796', 'a8b5b2', 'c7cfcc', 'ebede9'],
  'Endesga 32': ['be4a2f', 'd77643', 'ead4aa', 'e4a672', 'b86f50', '733e39', '3e2731', 'a22633', 'e43b44', 'f77622', 'feae34', 'fee761', '63c74d', '3e8948', '265c42', '193c3e', '124e89', '0099db', '2ce8f5', 'ffffff', 'c0cbdc', '8b9bb4', '5a6988', '3a4466', '262b44', '181425', 'ff0044', '68386c', 'b55088', 'f6757a', 'e8b796', 'c28569'],
  'Endesga 64': ['ff0040', '131313', '1b1b1b', '272727', '3d3d3d', '5d5d5d', '858585', 'b4b4b4', 'ffffff', 'c7cfdd', '92a1b9', '657392', '424c6e', '2a2f4e', '1a1932', '0e071b', '1c121c', '391f21', '5d2c28', '8a4836', 'bf6f4a', 'e69c69', 'f6ca9f', 'f9e6cf', 'edab50', 'e07438', 'c64524', '8e251d', 'ff5000', 'ed7614', 'ffa214', 'ffc825', 'ffeb57', 'd3fc7e', '99e65f', '5ac54f', '33984b', '1e6f50', '134c4c', '0c2e44', '00396d', '0069aa', '0098dc', '00cdf9', '0cf1ff', '94fdff', 'fdd2ed', 'f389f5', 'db3ffd', '7a09fa', '3003d9', '0c0293', '03193f', '3b1443', '622461', '93388f', 'ca52c9', 'c85086', 'f68187', 'f5555d', 'ea323c', 'c42430', '891e2b', '571c27'],
  'Resurrect 64': ['2e222f', '3e3546', '625565', '966c6c', 'ab947a', '694f62', '7f708a', '9babb2', 'c7dcd0', 'ffffff', '6e2727', 'b33831', 'ea4f36', 'f57d4a', 'ae2334', 'e83b3b', 'fb6b1d', 'f79617', 'f9c22b', '7a3045', '9e4539', 'cd683d', 'e6904e', 'fbb954', '4c3e24', '676633', 'a2a947', 'd5e04b', 'fbff86', '165a4c', '239063', '1ebc73', '91db69', 'cddf6c', '313638', '374e4a', '547e64', '92a984', 'b2ba90', '0b5e65', '0b8a8f', '0eaf9b', '30e1b9', '8ff8e2', '323353', '484a77', '4d65b4', '4d9be6', '8fd3ff', '45293f', '6b3e75', '905ea9', 'a884f3', 'eaaded', '753c54', 'a24b6f', 'cf657f', 'ed8099', '831c5d', 'c32454', 'f04f78', 'f68181', 'fca790', 'fdcbb0'],
  'AAP-64': ['060608', '141013', '3b1725', '73172d', 'b4202a', 'df3e23', 'fa6a0a', 'f9a31b', 'ffd541', 'fffc40', 'd6f264', '9cdb43', '59c135', '14a02e', '1a7a3e', '24523b', '122020', '143464', '285cc4', '249fde', '20d6c7', 'a6fcdb', 'ffffff', 'fef3c0', 'fad6b8', 'f5a097', 'e86a73', 'bc4a9b', '793a80', '403353', '242234', '221c1a', '322b28', '71413b', 'bb7547', 'dba463', 'f4d29c', 'dae0ea', 'b3b9d1', '8b93af', '6d758d', '4a5462', '333941', '422433', '5b3138', '8e5252', 'ba756a', 'e9b5a3', 'e3e6ff', 'b9bffb', '849be4', '588dbe', '477d85', '23674e', '328464', '5daf8d', '92dcba', 'cdf7e2', 'e4d2aa', 'c7b08b', 'a08662', '796755', '5a4e44', '423934'],
};

export class Palette {
  constructor({ name = 'main', colors = [], locked = false } = {}) {
    this.name = name;
    this.colors = colors.map((c) => `#${String(c).replace(/^#/, '').toLowerCase()}`).slice(0, 256);
    this.locked = locked;
  }

  add(color) {
    const hex = `#${String(color).replace(/^#/, '').toLowerCase()}`;
    if (this.colors.includes(hex) || this.colors.length >= 256) return false;
    this.colors.push(hex);
    return true;
  }

  remove(index) {
    if (index >= 0 && index < this.colors.length) this.colors.splice(index, 1);
  }

  set(index, color) {
    if (index >= 0 && index < this.colors.length) this.colors[index] = `#${String(color).replace(/^#/, '').toLowerCase()}`;
  }

  indexOf(color) {
    return this.colors.indexOf(`#${String(color).replace(/^#/, '').toLowerCase()}`);
  }

  clone() {
    return new Palette({ name: this.name, colors: [...this.colors], locked: this.locked });
  }
}

export class PaletteSet {
  constructor({ palettes = [], active = 0, indexed = false } = {}) {
    this.palettes = palettes;
    this.active = active;
    this.indexed = indexed;
  }

  get current() {
    return this.palettes[this.active] || this.palettes[0] || new Palette({ colors: ['#000000'] });
  }

  get name() {
    return this.current.name;
  }

  clone() {
    return new PaletteSet({
      palettes: this.palettes.map((p) => p.clone()),
      active: this.active,
      indexed: this.indexed,
    });
  }

  static default() {
    return new PaletteSet({
      palettes: [new Palette({ name: 'Sweetie 16', colors: BUILTIN_PALETTES['Sweetie 16'] })],
      active: 0,
      indexed: false,
    });
  }
}

// ---- Parsers -------------------------------------------------------------

export function parseHexPalette(text) {
  const colors = [];
  for (const line of String(text).split(/\r?\n/)) {
    const m = line.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})([0-9a-f]{2})?$/i);
    if (!m) continue;
    let hex = m[1];
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    colors.push(`#${hex.toLowerCase()}`);
  }
  return colors;
}

export function parseGplPalette(text) {
  const lines = String(text).split(/\r?\n/);
  if (!lines[0]?.startsWith('GIMP Palette')) throw new Error('Bukan berkas .gpl GIMP yang valid.');
  const colors = [];
  for (const line of lines.slice(1)) {
    if (!line.trim() || line.startsWith('#') || /^Name:|^Columns:/.test(line)) continue;
    const m = line.trim().match(/^(\d+)\s+(\d+)\s+(\d+)/);
    if (m) colors.push(toHex([+m[1], +m[2], +m[3], 255], false));
  }
  return colors;
}

export function parseJascPalette(text) {
  const lines = String(text).split(/\r?\n/);
  if (!lines[0]?.trim().startsWith('JASC-PAL')) throw new Error('Bukan berkas .pal JASC yang valid.');
  const count = parseInt(lines[2], 10);
  const colors = [];
  for (let i = 3; i < lines.length && colors.length < count; i++) {
    const m = lines[i].trim().match(/^(\d+)\s+(\d+)\s+(\d+)/);
    if (m) colors.push(toHex([+m[1], +m[2], +m[3], 255], false));
  }
  return colors;
}

export function parseActPalette(buffer) {
  const bytes = new Uint8Array(buffer);
  const colors = [];
  const count = bytes.length >= 772 ? bytes[768] * 256 + bytes[769] : 256;
  for (let i = 0; i < Math.min(256, count || 256); i++) {
    colors.push(toHex([bytes[i * 3], bytes[i * 3 + 1], bytes[i * 3 + 2], 255], false));
  }
  return colors;
}

/** Detect palette format from name and text. */
export function parsePaletteFile(name, text, buffer) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.gpl')) return parseGplPalette(text);
  if (lower.endsWith('.pal')) return parseJascPalette(text);
  if (lower.endsWith('.hex')) return parseHexPalette(text);
  if (lower.endsWith('.act')) return parseActPalette(buffer);
  return parseHexPalette(text);
}

export function serializeGpl(palette) {
  return `GIMP Palette\nName: ${palette.name}\nColumns: 8\n#\n${palette.colors.map((hex) => {
    const [r, g, b] = parseHex(hex);
    return `${String(r).padStart(3)} ${String(g).padStart(3)} ${String(b).padStart(3)}\t${hex}`;
  }).join('\n')}\n`;
}

export function serializeHex(palette) {
  return palette.colors.map((c) => c.replace('#', '')).join('\n') + '\n';
}

export function serializeJasc(palette) {
  return `JASC-PAL\n0100\n${palette.colors.length}\n${palette.colors.map((hex) => {
    const [r, g, b] = parseHex(hex);
    return `${r} ${g} ${b}`;
  }).join('\n')}\n`;
}

// ---- Extraction / quantisation ------------------------------------------

/** Unique (opaque) colours from an RGBA buffer, most frequent first. */
export function extractPalette(data, maxColors = 256) {
  const counts = new Map();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)
    .map(([key]) => `#${key.toString(16).padStart(6, '0')}`);
}

/** Median-cut quantisation. Returns an array of hex colours. */
export function medianCut(data, maxColors = 16) {
  const pixels = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (!pixels.length) return ['#000000'];
  const boxes = [pixels];
  while (boxes.length < maxColors) {
    boxes.sort((a, b) => spread(b) - spread(a));
    const box = boxes.shift();
    if (!box || box.length < 2) { if (box) boxes.push(box); break; }
    let channel = 0, bestRange = -1;
    for (let c = 0; c < 3; c++) {
      const min = Math.min(...box.map((p) => p[c])), max = Math.max(...box.map((p) => p[c]));
      if (max - min > bestRange) { bestRange = max - min; channel = c; }
    }
    box.sort((a, b) => a[channel] - b[channel]);
    const mid = Math.floor(box.length / 2);
    boxes.push(box.slice(0, mid), box.slice(mid));
  }
  return boxes.filter((b) => b.length).map((box) => {
    const n = box.length;
    const r = Math.round(box.reduce((s, p) => s + p[0], 0) / n);
    const g = Math.round(box.reduce((s, p) => s + p[1], 0) / n);
    const b = Math.round(box.reduce((s, p) => s + p[2], 0) / n);
    return toHex([r, g, b, 255], false);
  });
}

function spread(box) {
  let best = 0;
  for (let c = 0; c < 3; c++) {
    let lo = 255, hi = 0;
    for (const p of box) { if (p[c] < lo) lo = p[c]; if (p[c] > hi) hi = p[c]; }
    best = Math.max(best, hi - lo);
  }
  return best;
}

/** Build a hue-shifted ramp between two colours. */
export function buildRamp(fromHex, toHex, steps = 7, hueShift = 0) {
  const out = [];
  for (let i = 0; i < steps; i++) {
    const t = steps === 1 ? 0 : i / (steps - 1);
    const mixed = mixHex(fromHex, toHex, t);
    out.push(hueShift ? shiftHsv(mixed, (t - 0.5) * hueShift, 0, 0) : mixed);
  }
  return out;
}

/** Reduce an RGBA buffer to a palette (nearest colour, no dithering). */
export function mapToPalette(data, colors) {
  const rgb = colors.map((c) => parseHex(c));
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) { out[i + 3] = 0; continue; }
    let best = rgb[0], bestD = Infinity;
    for (const c of rgb) {
      const d = (data[i] - c[0]) ** 2 + (data[i + 1] - c[1]) ** 2 + (data[i + 2] - c[2]) ** 2;
      if (d < bestD) { bestD = d; best = c; }
    }
    out[i] = best[0]; out[i + 1] = best[1]; out[i + 2] = best[2]; out[i + 3] = data[i + 3];
  }
  return out;
}

/** Floyd–Steinberg dithering to a palette. */
export function ditherToPalette(data, width, height, colors, diffusion = 0.75) {
  const rgb = colors.map((c) => parseHex(c));
  const out = new Uint8ClampedArray(data.length);
  const buf = new Float32Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    buf[i * 3] = data[i * 4]; buf[i * 3 + 1] = data[i * 4 + 1]; buf[i * 3 + 2] = data[i * 4 + 2];
  }
  const nearest = (r, g, b) => {
    let best = rgb[0], bestD = Infinity;
    for (const c of rgb) {
      const d = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2;
      if (d < bestD) { bestD = d; best = c; }
    }
    return best;
  };
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x;
    const a = data[i * 4 + 3];
    if (a === 0) continue;
    const r = buf[i * 3], g = buf[i * 3 + 1], b = buf[i * 3 + 2];
    const c = nearest(r, g, b);
    out[i * 4] = c[0]; out[i * 4 + 1] = c[1]; out[i * 4 + 2] = c[2]; out[i * 4 + 3] = a;
    const er = (r - c[0]) * diffusion, eg = (g - c[1]) * diffusion, eb = (b - c[2]) * diffusion;
    const add = (xx, yy, f) => {
      if (xx < 0 || yy < 0 || xx >= width || yy >= height) return;
      const j = (yy * width + xx) * 3;
      buf[j] += er * f; buf[j + 1] += eg * f; buf[j + 2] += eb * f;
    };
    add(x + 1, y, 7 / 16); add(x - 1, y + 1, 3 / 16); add(x, y + 1, 5 / 16); add(x + 1, y + 1, 1 / 16);
  }
  return out;
}
