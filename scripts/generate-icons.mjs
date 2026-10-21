// Generates the local PWA icons from a tiny hand-authored pixel grid.
// Run with `node scripts/generate-icons.mjs`; output is committed so builds
// never depend on an image library or network access.
import { writeFileSync, mkdirSync } from 'node:fs';
import { encodePNG } from '../src/io/png.js';

const P = {
  '.': null,
  k: '#12141b',
  d: '#1a1d27',
  p: '#7c6cf5',
  g: '#e5c36b',
};

// 16x16 grid. The frame is intentionally whole-pixel so it stays crisp when
// scaled by an integer factor.
const grid = [
  'kkkkkkkkkkkkkkkk',
  'k..............k',
  'k.dddddddddddd.k',
  'k.d..........d.k',
  'k.d.pppppppp.d.k',
  'k.d.pppppppp.d.k',
  'k.d.pp....pp.d.k',
  'k.d.pp....pp.d.k',
  'k.d.pp....pp.d.k',
  'k.d.pppppppp.d.k',
  'k.d.ppppppp..d.k',
  'k.d.pp.......d.k',
  'k.d.pp......gg.k',
  'k.dddddddddddd.k',
  'k..............k',
  'kkkkkkkkkkkkkkkk',
];

for (const [index, row] of grid.entries()) {
  if (row.length !== 16) throw new Error(`Icon row ${index} is ${row.length} cells, expected 16`);
}

function build(size) {
  const scale = size / 16;
  const out = new Uint8Array(size * size * 4);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const color = P[grid[y][x]] || null;
      if (!color) continue;
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
      for (let py = y * scale; py < (y + 1) * scale; py++) {
        for (let px = x * scale; px < (x + 1) * scale; px++) {
          const offset = (py * size + px) * 4;
          out[offset] = r;
          out[offset + 1] = g;
          out[offset + 2] = b;
          out[offset + 3] = 255;
        }
      }
    }
  }
  return out;
}

mkdirSync(new URL('../public/', import.meta.url), { recursive: true });
for (const size of [192, 512]) {
  const png = await encodePNG(build(size), size, size);
  writeFileSync(new URL(`../public/icon-${size}.png`, import.meta.url), png);
}
console.log('Wrote public/icon-192.png and public/icon-512.png');
