import fs from 'node:fs';
import path from 'node:path';
import { buildExample } from '../src/examples.js';
import { PixelDocument } from '../src/core/document.js';
import { Layer } from '../src/core/layer.js';
import { Frame } from '../src/core/frame.js';
import { Cel } from '../src/core/cel.js';
import { Palette, PaletteSet, BUILTIN_PALETTES } from '../src/core/palette.js';
import { stringifyProject } from '../src/io/project.js';
import { parseHex } from '../src/utils/color.js';

const outDir = path.resolve('examples');
fs.mkdirSync(outDir, { recursive: true });

// 1. Knight project (.pfx)
const knight = buildExample('knight');
knight.title = 'hero_knight';
knight.slices = [
  {
    name: 'hitbox',
    frames: [
      { frame: 0, rect: [11, 14, 10, 16], pivot: [16, 30], center: null },
      { frame: 1, rect: [11, 13, 10, 17], pivot: [16, 30], center: null },
      { frame: 2, rect: [11, 14, 10, 16], pivot: [16, 30], center: null },
      { frame: 3, rect: [11, 13, 10, 17], pivot: [16, 30], center: null },
    ],
  },
];
knight.anchors = [
  { name: 'weapon_hand', frame: 0, x: 22, y: 22 },
  { name: 'weapon_hand', frame: 1, x: 23, y: 21 },
  { name: 'weapon_hand', frame: 2, x: 22, y: 22 },
  { name: 'weapon_hand', frame: 3, x: 21, y: 23 },
];
fs.writeFileSync(path.join(outDir, 'knight.pfx'), stringifyProject(knight));
console.log('✓ Generated examples/knight.pfx');

// 2. Dungeon tileset (.pfx)
const tileset = new PixelDocument({ width: 64, height: 64, title: 'dungeon_tileset' });
tileset.palette = new PaletteSet({
  palettes: [new Palette({ name: 'Sweetie 16', colors: BUILTIN_PALETTES['Sweetie 16'] })],
  active: 0,
});
tileset.grid = { x: 0, y: 0, w: 16, h: 16 };
const tileLayer = new Layer({ id: 'l_tiles', name: 'Tiles' });
const tileFrame = new Frame({ id: 'f_tiles', duration: 100 });
tileset.layers = [tileLayer];
tileset.frames = [tileFrame];
const tileCel = new Cel({ layerId: 'l_tiles', frameId: 'f_tiles', x: 0, y: 0, width: 64, height: 64 });
tileCel.ensurePixels();

function fillRect(cel, x, y, w, h, hex) {
  const [r, g, b, a = 255] = parseHex(hex);
  for (let py = y; py < y + h; py++) for (let px = x; px < x + w; px++) {
    const idx = (py * 64 + px) * 4;
    cel.pixels[idx] = r; cel.pixels[idx + 1] = g; cel.pixels[idx + 2] = b; cel.pixels[idx + 3] = a;
  }
}

// Tile 0,0: Stone Wall
fillRect(tileCel, 0, 0, 16, 16, '#566c86');
fillRect(tileCel, 1, 1, 14, 14, '#333f58');
fillRect(tileCel, 2, 2, 12, 12, '#262b44');

// Tile 1,0: Stone Floor
fillRect(tileCel, 16, 0, 16, 16, '#94b0c2');
fillRect(tileCel, 17, 1, 14, 14, '#566c86');
for (let i = 0; i < 4; i++) {
  tileCel.pixels[((2 + i * 3) * 64 + (18 + i * 3)) * 4 + 3] = 255;
}

// Tile 2,0: Wooden Chest
fillRect(tileCel, 32, 0, 16, 16, '#00000000');
fillRect(tileCel, 34, 4, 12, 10, '#b13e53');
fillRect(tileCel, 35, 5, 10, 8, '#ef7d57');
fillRect(tileCel, 39, 8, 2, 2, '#ffec27');

tileset.cels.set('l_tiles:f_tiles', tileCel);
fs.writeFileSync(path.join(outDir, 'dungeon_tileset.pfx'), stringifyProject(tileset));
console.log('✓ Generated examples/dungeon_tileset.pfx');

// 3. UI 9-Slice (.pfx)
const ui9 = new PixelDocument({ width: 32, height: 32, title: 'ui_panel_9slice' });
ui9.palette = new PaletteSet({
  palettes: [new Palette({ name: 'Pico-8', colors: BUILTIN_PALETTES['Pico-8'] })],
  active: 0,
});
const uiLayer = new Layer({ id: 'l_ui', name: 'UI' });
const uiFrame = new Frame({ id: 'f_ui', duration: 100 });
ui9.layers = [uiLayer];
ui9.frames = [uiFrame];
const uiCel = new Cel({ layerId: 'l_ui', frameId: 'f_ui', x: 0, y: 0, width: 32, height: 32 });
uiCel.ensurePixels();

// Draw rounded frame
const border = parseHex('#5f574f');
const fill = parseHex('#000000');
const inner = parseHex('#1d2b53');
for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
  const isEdge = x < 4 || x >= 28 || y < 4 || y >= 28;
  const col = isEdge ? border : inner;
  const i = (y * 32 + x) * 4;
  uiCel.pixels[i] = col[0]; uiCel.pixels[i + 1] = col[1]; uiCel.pixels[i + 2] = col[2]; uiCel.pixels[i + 3] = 255;
}
ui9.slices = [
  {
    name: 'button_slice',
    frames: [
      { frame: 0, rect: [0, 0, 32, 32], pivot: [16, 16], center: [6, 6, 20, 20] },
    ],
  },
];
ui9.cels.set('l_ui:f_ui', uiCel);
fs.writeFileSync(path.join(outDir, 'ui_9slice.pfx'), stringifyProject(ui9));
console.log('✓ Generated examples/ui_9slice.pfx');

// 4. GPL palette (Sweetie 16)
const gpl = ['GIMP Palette', 'Name: Sweetie 16', 'Columns: 4', '#'];
for (const c of BUILTIN_PALETTES['Sweetie 16']) {
  const [r, g, b] = parseHex(c);
  gpl.push(`${String(r).padStart(3)} ${String(g).padStart(3)} ${String(b).padStart(3)}\t${c}`);
}
fs.writeFileSync(path.join(outDir, 'sweetie16.gpl'), gpl.join('\n'));
console.log('✓ Generated examples/sweetie16.gpl');

// 5. HEX palette (Pico-8)
const hex = BUILTIN_PALETTES['Pico-8'].map((c) => c.replace('#', '')).join('\n');
fs.writeFileSync(path.join(outDir, 'pico8.hex'), hex);
console.log('✓ Generated examples/pico8.hex');

// 6. PAL palette (JASC-PAL)
const jasc = ['JASC-PAL', '0100', String(BUILTIN_PALETTES['Endesga 32'].length)];
for (const c of BUILTIN_PALETTES['Endesga 32']) {
  const [r, g, b] = parseHex(c);
  jasc.push(`${r} ${g} ${b}`);
}
fs.writeFileSync(path.join(outDir, 'endesga32.pal'), jasc.join('\n'));
console.log('✓ Generated examples/endesga32.pal');

