/**
 * Built-in bitmap fonts. Glyphs are 5×7 pixel matrices stored as seven rows of
 * five characters. Styles only change metrics/weight, so text always renders
 * as hard pixels with alpha 0 or 255.
 */

const RAW = {
  ' ': '00000/00000/00000/00000/00000/00000/00000',
  'A': '01110/10001/10001/11111/10001/10001/10001',
  'B': '11110/10001/10001/11110/10001/10001/11110',
  'C': '01110/10001/10000/10000/10000/10001/01110',
  'D': '11110/10001/10001/10001/10001/10001/11110',
  'E': '11111/10000/10000/11110/10000/10000/11111',
  'F': '11111/10000/10000/11110/10000/10000/10000',
  'G': '01110/10001/10000/10111/10001/10001/01111',
  'H': '10001/10001/10001/11111/10001/10001/10001',
  'I': '01110/00100/00100/00100/00100/00100/01110',
  'J': '00111/00010/00010/00010/00010/10010/01100',
  'K': '10001/10010/10100/11000/10100/10010/10001',
  'L': '10000/10000/10000/10000/10000/10000/11111',
  'M': '10001/11011/10101/10101/10001/10001/10001',
  'N': '10001/11001/10101/10011/10001/10001/10001',
  'O': '01110/10001/10001/10001/10001/10001/01110',
  'P': '11110/10001/10001/11110/10000/10000/10000',
  'Q': '01110/10001/10001/10001/10101/10010/01101',
  'R': '11110/10001/10001/11110/10100/10010/10001',
  'S': '01111/10000/10000/01110/00001/00001/11110',
  'T': '11111/00100/00100/00100/00100/00100/00100',
  'U': '10001/10001/10001/10001/10001/10001/01110',
  'V': '10001/10001/10001/10001/10001/01010/00100',
  'W': '10001/10001/10001/10101/10101/10101/01010',
  'X': '10001/10001/01010/00100/01010/10001/10001',
  'Y': '10001/10001/01010/00100/00100/00100/00100',
  'Z': '11111/00001/00010/00100/01000/10000/11111',
  'a': '00000/00000/01110/00001/01111/10001/01111',
  'b': '10000/10000/11110/10001/10001/10001/11110',
  'c': '00000/00000/01111/10000/10000/10000/01111',
  'd': '00001/00001/01111/10001/10001/10001/01111',
  'e': '00000/00000/01110/10001/11111/10000/01110',
  'f': '00110/01001/01000/11100/01000/01000/01000',
  'g': '00000/01111/10001/10001/01111/00001/01110',
  'h': '10000/10000/11110/10001/10001/10001/10001',
  'i': '00100/00000/01100/00100/00100/00100/01110',
  'j': '00010/00000/00110/00010/00010/10010/01100',
  'k': '10000/10000/10010/10100/11000/10100/10010',
  'l': '01100/00100/00100/00100/00100/00100/01110',
  'm': '00000/00000/11010/10101/10101/10101/10101',
  'n': '00000/00000/11110/10001/10001/10001/10001',
  'o': '00000/00000/01110/10001/10001/10001/01110',
  'p': '00000/11110/10001/10001/11110/10000/10000',
  'q': '00000/01111/10001/10001/01111/00001/00001',
  'r': '00000/00000/10110/11001/10000/10000/10000',
  's': '00000/00000/01111/10000/01110/00001/11110',
  't': '01000/01000/11100/01000/01000/01001/00110',
  'u': '00000/00000/10001/10001/10001/10011/01101',
  'v': '00000/00000/10001/10001/10001/01010/00100',
  'w': '00000/00000/10001/10101/10101/10101/01010',
  'x': '00000/00000/10001/01010/00100/01010/10001',
  'y': '00000/10001/10001/10001/01111/00001/01110',
  'z': '00000/00000/11111/00010/00100/01000/11111',
  '0': '01110/10001/10011/10101/11001/10001/01110',
  '1': '00100/01100/00100/00100/00100/00100/01110',
  '2': '01110/10001/00001/00010/00100/01000/11111',
  '3': '11111/00010/00100/00010/00001/10001/01110',
  '4': '00010/00110/01010/10010/11111/00010/00010',
  '5': '11111/10000/11110/00001/00001/10001/01110',
  '6': '00110/01000/10000/11110/10001/10001/01110',
  '7': '11111/00001/00010/00100/01000/01000/01000',
  '8': '01110/10001/10001/01110/10001/10001/01110',
  '9': '01110/10001/10001/01111/00001/00010/01100',
  '.': '00000/00000/00000/00000/00000/00110/00110',
  ',': '00000/00000/00000/00000/00110/00100/01000',
  '!': '00100/00100/00100/00100/00100/00000/00100',
  '?': '01110/10001/00001/00010/00100/00000/00100',
  ':': '00000/00110/00110/00000/00110/00110/00000',
  ';': '00000/00110/00110/00000/00110/00100/01000',
  "'": '00100/00100/00000/00000/00000/00000/00000',
  '"': '01010/01010/00000/00000/00000/00000/00000',
  '-': '00000/00000/00000/11111/00000/00000/00000',
  '+': '00000/00100/00100/11111/00100/00100/00000',
  '/': '00001/00010/00010/00100/01000/01000/10000',
  '\\': '10000/01000/01000/00100/00010/00010/00001',
  '(': '00010/00100/01000/01000/01000/00100/00010',
  ')': '01000/00100/00010/00010/00010/00100/01000',
  '[': '01110/01000/01000/01000/01000/01000/01110',
  ']': '01110/00010/00010/00010/00010/00010/01110',
  '{': '00010/00100/00100/01000/00100/00100/00010',
  '}': '01000/00100/00100/00010/00100/00100/01000',
  '<': '00010/00100/01000/10000/01000/00100/00010',
  '>': '01000/00100/00010/00001/00010/00100/01000',
  '=': '00000/00000/11111/00000/11111/00000/00000',
  '*': '10101/01110/11111/01110/10101/00000/00000',
  '_': '00000/00000/00000/00000/00000/00000/11111',
  '#': '01010/11111/01010/01010/11111/01010/00000',
  '%': '11001/11010/00010/00100/01000/01011/10011',
  '&': '01100/10010/10100/01000/10101/10010/01101',
  '@': '01110/10001/10111/10101/10111/10000/01110',
  '^': '00100/01010/10001/00000/00000/00000/00000',
  '`': '01000/00100/00000/00000/00000/00000/00000',
  '|': '00100/00100/00100/00000/00100/00100/00100',
};

const GLYPHS = {};
for (const [char, rows] of Object.entries(RAW)) {
  GLYPHS[char] = rows.split('/').map((row) => row.split('').map((bit) => bit === '1'));
}

export const FONT_STYLES = {
  '5x7': { id: '5x7', label: '5×7', cellW: 6, cellH: 8, glyphW: 5, glyphH: 7, offsetX: 0, offsetY: 0, bold: false, serif: false },
  '8x8': { id: '8x8', label: '8×8', cellW: 8, cellH: 8, glyphW: 5, glyphH: 7, offsetX: 1, offsetY: 1, bold: true, serif: false },
  'serif': { id: 'serif', label: 'Serif kecil', cellW: 7, cellH: 10, glyphW: 5, glyphH: 7, offsetX: 1, offsetY: 1, bold: false, serif: true },
};

function glyphFor(char, style) {
  const glyph = GLYPHS[char] || GLYPHS[char.toUpperCase()] || GLYPHS['?'];
  if (!style.serif) return glyph;
  // Slab-serif variant: thicken the baseline and add 1px feet to stems.
  return glyph.map((row, y) => {
    const out = row.slice();
    if (y === 6) {
      for (let x = 0; x < 5; x++) if (row[x]) { if (x > 0) out[x - 1] = true; if (x < 4) out[x + 1] = true; }
    }
    return out;
  });
}

export function measureText(text, options = {}) {
  const style = FONT_STYLES[options.font] || FONT_STYLES['5x7'];
  const scale = Math.max(1, Math.min(8, options.scale || 1));
  const lines = String(text ?? '').split(/\r?\n/);
  const lineHeight = style.cellH * scale;
  let maxCells = 0;
  for (const line of lines) maxCells = Math.max(maxCells, [...line].length);
  return {
    width: Math.max(0, maxCells * style.cellW * scale - (style.cellW - style.glyphW) * scale),
    height: Math.max(0, lines.length * lineHeight),
    lineHeight,
    cellWidth: style.cellW * scale,
    lines,
  };
}

/**
 * Render text to a standalone RGBA buffer.
 * @param {string} text
 * @param {{font?:string,scale?:number,align?:'left'|'center'|'right',color?:number[]}} options
 */
export function renderText(text, options = {}) {
  const style = FONT_STYLES[options.font] || FONT_STYLES['5x7'];
  const scale = Math.max(1, Math.min(8, options.scale || 1));
  const color = options.color || [255, 255, 255, 255];
  const align = options.align || 'left';
  const metrics = measureText(text, { ...options, scale, font: style.id });
  const width = Math.max(1, metrics.width);
  const height = Math.max(1, metrics.height);
  const data = new Uint8ClampedArray(width * height * 4);
  const put = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = (y * width + x) * 4;
    data[i] = color[0]; data[i + 1] = color[1]; data[i + 2] = color[2]; data[i + 3] = color[3] ?? 255;
  };
  const longest = Math.max(...metrics.lines.map((line) => [...line].length), 0);
  metrics.lines.forEach((line, lineIndex) => {
    const cells = [...line].length;
    const lineWidth = cells * style.cellW * scale;
    const alignOffset = align === 'center' ? Math.round((longest * style.cellW * scale - lineWidth) / 2)
      : align === 'right' ? longest * style.cellW * scale - lineWidth : 0;
    [...line].forEach((char, cellIndex) => {
      const glyph = glyphFor(char, style);
      const gx = alignOffset + cellIndex * style.cellW * scale + style.offsetX * scale;
      const gy = lineIndex * style.cellH * scale + style.offsetY * scale;
      glyph.forEach((row, y) => row.forEach((on, x) => {
        if (!on) return;
        for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) put(gx + x * scale + dx, gy + y * scale + dy);
        if (style.bold) put(gx + x * scale + scale, gy + y * scale);
      }));
      if (style.serif) {
        for (let dx = 0; dx < style.glyphW * scale; dx++) put(gx + dx, gy + style.glyphH * scale + 1);
      }
    });
  });
  return { data, width, height, metrics };
}
