import { Palette, PaletteSet, BUILTIN_PALETTES } from '../palette.js';
import { parseHex } from '../../utils/color.js';

export function createPalettes(name = 'Sweetie 16') {
  return new PaletteSet({
    palettes: [new Palette({ name, colors: BUILTIN_PALETTES[name] || BUILTIN_PALETTES['Sweetie 16'] })],
    active: 0,
  });
}

export function fillRect(cel, doc, x, y, w, h, color) {
  const [r, g, b, a = 255] = typeof color === 'string' ? parseHex(color) : color;
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (xx < 0 || yy < 0 || xx >= doc.width || yy >= doc.height) continue;
      const i = (yy * doc.width + xx) * 4;
      cel.pixels[i] = r;
      cel.pixels[i + 1] = g;
      cel.pixels[i + 2] = b;
      cel.pixels[i + 3] = a;
    }
  }
}

export function pixel(cel, doc, x, y, color) {
  fillRect(cel, doc, x, y, 1, 1, color);
}

export function outlineRect(cel, doc, x, y, w, h, color) {
  fillRect(cel, doc, x, y, w, 1, color);
  fillRect(cel, doc, x, y + h - 1, w, 1, color);
  fillRect(cel, doc, x, y, 1, h, color);
  fillRect(cel, doc, x + w - 1, y, 1, h, color);
}

export function drawMatrix(cel, doc, startX, startY, rows, paletteMap) {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === ' ' || ch === '.') continue;
      const color = paletteMap[ch];
      if (color) {
        pixel(cel, doc, startX + c, startY + r, color);
      }
    }
  }
}

