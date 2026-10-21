/**
 * Built-in example projects. They are generated procedurally so no binary
 * assets are shipped and every pixel stays crisp.
 */
import { PixelDocument } from './core/document.js';
import { Palette, PaletteSet, BUILTIN_PALETTES } from './core/palette.js';
import { parseHex } from './utils/color.js';

export const EXAMPLES = [
  { id: 'knight', titleKey: 'examples.knight', descKey: 'examples.knightDesc', width: 32, height: 32, frames: 4 },
  { id: 'slime', titleKey: 'examples.slime', descKey: 'examples.slimeDesc', width: 16, height: 16, frames: 4 },
  { id: 'coin', titleKey: 'examples.coin', descKey: 'examples.coinDesc', width: 16, height: 16, frames: 6 },
];

function paletteSet() {
  return new PaletteSet({
    palettes: [new Palette({ name: 'Sweetie 16', colors: BUILTIN_PALETTES['Sweetie 16'] })],
    active: 0,
  });
}

function fillRect(cel, doc, x, y, w, h, color) {
  const [r, g, b, a = 255] = typeof color === 'string' ? parseHex(color) : color;
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    if (xx < 0 || yy < 0 || xx >= doc.width || yy >= doc.height) continue;
    const i = (yy * doc.width + xx) * 4;
    cel.pixels[i] = r; cel.pixels[i + 1] = g; cel.pixels[i + 2] = b; cel.pixels[i + 3] = a;
  }
}

function pixel(cel, doc, x, y, color) {
  fillRect(cel, doc, x, y, 1, 1, color);
}

function drawKnight(doc, cel, frame) {
  const skin = '#ffcd75';
  const skinShade = '#ef7d57';
  const metal = '#94b0c2';
  const metalDark = '#566c86';
  const tunic = '#41a6f6';
  const tunicDark = '#3b5dc9';
  const plume = '#b13e53';
  const outline = '#1a1c2c';
  const boot = '#5d275d';
  const sword = '#f4f4f4';
  const bob = frame % 2 === 0 ? 0 : 1;
  // Legs and body bob slightly to sell the walk cycle.
  const step = [0, 1, 0, -1][frame];
  fillRect(cel, doc, 12, 21 + bob, 8, 7, tunic);
  fillRect(cel, doc, 12, 27 + bob, 8, 2, tunicDark);
  fillRect(cel, doc, 13 + Math.max(0, step), 29, 3, 2, boot);
  fillRect(cel, doc, 17 + Math.min(0, step), 29, 3, 2, boot);
  fillRect(cel, doc, 15, 30, 3, 1, outline);
  // Belt and buckle.
  fillRect(cel, doc, 12, 25 + bob, 8, 1, '#ffcd75');
  pixel(cel, doc, 15, 25 + bob, '#ef7d57');
  // Arms.
  fillRect(cel, doc, 10, 21 + bob, 2, 5, skinShade);
  fillRect(cel, doc, 20, 20 + bob + step, 2, 5, skinShade);
  fillRect(cel, doc, 9, 19 + bob - step, 2, 2, skin);
  fillRect(cel, doc, 21, 18 + bob + step, 2, 2, skin);
  // Head and helmet.
  fillRect(cel, doc, 12, 10 + bob, 8, 9, skin);
  fillRect(cel, doc, 13, 11 + bob, 6, 1, skinShade);
  fillRect(cel, doc, 11, 8 + bob, 10, 4, metal);
  fillRect(cel, doc, 11, 11 + bob, 10, 1, metalDark);
  fillRect(cel, doc, 14, 13 + bob, 1, 2, outline);
  fillRect(cel, doc, 17, 13 + bob, 1, 2, '#29366f');
  fillRect(cel, doc, 15, 16 + bob, 3, 1, skinShade);
  // Helmet plume waves with the step.
  fillRect(cel, doc, 15 + step, 5 + bob, 2, 3, plume);
  fillRect(cel, doc, 17 + step, 4 + bob, 2, 2, '#ef7d57');
  fillRect(cel, doc, 19 + step, 3 + bob, 1, 2, '#ffcd75');
  // Shield on the left arm.
  fillRect(cel, doc, 7, 20 + bob, 4, 6, metalDark);
  fillRect(cel, doc, 8, 21 + bob, 2, 4, '#257179');
  pixel(cel, doc, 8, 22 + bob, '#73eff7');
  // Sword raised on the right.
  fillRect(cel, doc, 23, 11 + bob, 1, 11, sword);
  fillRect(cel, doc, 23, 22 + bob, 3, 1, '#ef7d57');
  fillRect(cel, doc, 22, 23 + bob, 5, 1, '#5d275d');
  fillRect(cel, doc, 23, 9 + bob, 1, 2, '#f4f4f4');
}

function drawSlime(doc, cel, frame) {
  const base = ['#38b764', '#41a6f6', '#a7f070', '#38b764'][frame];
  const shade = '#257179';
  const outline = '#1a1c2c';
  const squash = [0, 1, 2, 1][frame];
  const top = 5 + squash;
  const height = 8 - Math.floor(squash / 2);
  fillRect(cel, doc, 3, top, 10, height, base);
  fillRect(cel, doc, 4, top - 1, 8, 1, base);
  fillRect(cel, doc, 2, top + 2, 1, height - 2, base);
  fillRect(cel, doc, 13, top + 2, 1, height - 2, base);
  fillRect(cel, doc, 4, top + height - 1, 8, 1, shade);
  fillRect(cel, doc, 5, top + 1, 1, 2, outline);
  fillRect(cel, doc, 10, top + 1, 1, 2, outline);
  fillRect(cel, doc, 7, top + 3, 2, 1, outline);
  fillRect(cel, doc, 4, top + 4, 1, 1, '#f4f4f4');
  pixel(cel, doc, 11, top + 4, '#ffcd75');
}

function drawCoin(doc, cel, frame) {
  const gold = '#ffcd75';
  const light = '#fff1e8';
  const shade = '#ef7d57';
  const dark = '#b13e53';
  const widths = [8, 6, 3, 1, 3, 6];
  const w = widths[frame];
  const x = Math.round((doc.width - w) / 2);
  const y = 3;
  fillRect(cel, doc, x, y, w, 10, gold);
  fillRect(cel, doc, x + 1, y - 1, Math.max(1, w - 2), 12, gold);
  fillRect(cel, doc, x, y + 9, w, 1, shade);
  fillRect(cel, doc, x, y, w, 1, light);
  if (w >= 3) {
    fillRect(cel, doc, x + Math.floor(w / 2) - 1, y + 2, 1, 5, shade);
    pixel(cel, doc, x + Math.floor(w / 2) - 1, y + 4, dark);
    pixel(cel, doc, x + 1, y + 2, light);
  }
}

function layerFor(doc, name, index) {
  return doc.addLayer({ name, index, opacity: 255 });
}

/** Build one of the built-in example documents. */
export function buildExample(id) {
  const def = EXAMPLES.find((e) => e.id === id) || EXAMPLES[0];
  const doc = PixelDocument.create({ width: def.width, height: def.height, title: def.id, layerName: 'Background' });
  doc.palette = paletteSet();
  doc.grid = { x: 0, y: 0, w: 8, h: 8 };
  doc.frames[0].duration = def.id === 'coin' ? 80 : 120;
  if (def.id === 'knight') {
    const body = doc.layers[0];
    body.name = 'Body';
    const fx = layerFor(doc, 'FX', 1);
    for (let f = 1; f < def.frames; f++) {
      const frame = doc.addFrame({ duration: 120 });
      frame.duration = 120;
    }
    for (let f = 0; f < def.frames; f++) {
      for (const layer of [body, fx]) {
        const cel = doc.ensureCel(layer.id, doc.frames[f].id);
        if (layer === body) drawKnight(doc, cel, f);
        else {
          // A few sparks trailing from the sword.
          const px = [24, 25, 26, 25][f];
          const py = [7, 6, 8, 9][f];
          pixel(cel, doc, px, py, '#ffec27');
          pixel(cel, doc, px + 1, py + 1, '#ffcd75');
        }
      }
    }
    doc.tags = [{ name: 'walk', from: 0, to: 3, direction: 'forward', repeat: 0, color: '#41a6f6' }];
  } else if (def.id === 'slime') {
    doc.layers[0].name = 'Slime';
    for (let f = 1; f < def.frames; f++) doc.addFrame({ duration: 140 });
    for (let f = 0; f < def.frames; f++) drawSlime(doc, doc.ensureCel(doc.layers[0].id, doc.frames[f].id), f);
    doc.tags = [{ name: 'bounce', from: 0, to: 3, direction: 'pingpong', repeat: 0, color: '#a7f070' }];
  } else {
    doc.layers[0].name = 'Coin';
    for (let f = 1; f < def.frames; f++) doc.addFrame({ duration: 80 });
    for (let f = 0; f < def.frames; f++) {
      const cel = doc.ensureCel(doc.layers[0].id, doc.frames[f].id);
      drawCoin(doc, cel, f);
    }
    doc.tags = [{ name: 'spin', from: 0, to: 5, direction: 'forward', repeat: 0, color: '#ffcd75' }];
  }
  doc.modified = new Date().toISOString();
  return doc;
}

/** Load an example as a new tab. */
export function loadExample(store, id) {
  const doc = buildExample(id);
  const session = store.createSession(doc, { fileName: `${doc.title}.pfx`, dirty: true });
  store.setUI({ tool: 'pencil', showTimeline: true });
  store.toast(store.ui.language === 'en' ? 'Example loaded.' : 'Contoh dimuat.', 'success');
  return session;
}
