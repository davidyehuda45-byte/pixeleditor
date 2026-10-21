/**
 * PixelForge Game Dev Template Library.
 * 42 comprehensive 2D game asset templates across 7 essential categories.
 * All templates are generated procedurally (pure code, zero external images)
 * with separated layers, animation frames, tags, collision boxes, and palette maps
 * so developers can immediately customize, edit details, and swap colors.
 */
import { PixelDocument } from './document.js';
import { Layer } from './layer.js';
import { Frame } from './frame.js';
import { Cel } from './cel.js';
import { Palette, PaletteSet, BUILTIN_PALETTES } from './palette.js';
import { parseHex } from '../utils/color.js';

export const TEMPLATE_CATEGORIES = [
  { id: 'all', labelKey: 'template.cat.all' },
  { id: 'character', labelKey: 'template.cat.character', icon: 'user' },
  { id: 'building', labelKey: 'template.cat.building', icon: 'folder' },
  { id: 'weapon', labelKey: 'template.cat.weapon', icon: 'zap' },
  { id: 'item', labelKey: 'template.cat.item', icon: 'sparkles' },
  { id: 'tileset', labelKey: 'template.cat.tileset', icon: 'grid' },
  { id: 'fx', labelKey: 'template.cat.fx', icon: 'flame' },
  { id: 'ui', labelKey: 'template.cat.ui', icon: 'layout' },
];

export const GAME_TEMPLATES = [
  // --- 1. Karakter (8) ---
  { id: 'char-knight', cat: 'character', titleKey: 'template.charKnight.title', descKey: 'template.charKnight.desc', w: 32, h: 32, frames: 4 },
  { id: 'char-mage', cat: 'character', titleKey: 'template.charMage.title', descKey: 'template.charMage.desc', w: 32, h: 32, frames: 4 },
  { id: 'char-archer', cat: 'character', titleKey: 'template.charArcher.title', descKey: 'template.charArcher.desc', w: 32, h: 32, frames: 4 },
  { id: 'char-rogue', cat: 'character', titleKey: 'template.charRogue.title', descKey: 'template.charRogue.desc', w: 32, h: 32, frames: 4 },
  { id: 'char-mannequin', cat: 'character', titleKey: 'template.charMannequin.title', descKey: 'template.charMannequin.desc', w: 32, h: 48, frames: 4 },
  { id: 'char-slime', cat: 'character', titleKey: 'template.charSlime.title', descKey: 'template.charSlime.desc', w: 16, h: 16, frames: 4 },
  { id: 'char-skeleton', cat: 'character', titleKey: 'template.charSkeleton.title', descKey: 'template.charSkeleton.desc', w: 32, h: 32, frames: 4 },
  { id: 'char-bat', cat: 'character', titleKey: 'template.charBat.title', descKey: 'template.charBat.desc', w: 16, h: 16, frames: 4 },

  // --- 2. Bangunan & Rumah (6) ---
  { id: 'bldg-cottage', cat: 'building', titleKey: 'template.bldgCottage.title', descKey: 'template.bldgCottage.desc', w: 64, h: 64, frames: 1 },
  { id: 'bldg-tower', cat: 'building', titleKey: 'template.bldgTower.title', descKey: 'template.bldgTower.desc', w: 64, h: 64, frames: 2 },
  { id: 'bldg-windmill', cat: 'building', titleKey: 'template.bldgWindmill.title', descKey: 'template.bldgWindmill.desc', w: 64, h: 64, frames: 4 },
  { id: 'bldg-dungeon-gate', cat: 'building', titleKey: 'template.bldgDungeonGate.title', descKey: 'template.bldgDungeonGate.desc', w: 64, h: 64, frames: 1 },
  { id: 'bldg-shop', cat: 'building', titleKey: 'template.bldgShop.title', descKey: 'template.bldgShop.desc', w: 64, h: 64, frames: 1 },
  { id: 'bldg-shrine', cat: 'building', titleKey: 'template.bldgShrine.title', descKey: 'template.bldgShrine.desc', w: 48, h: 48, frames: 2 },

  // --- 3. Senjata & Tempur (6) ---
  { id: 'wpn-swords', cat: 'weapon', titleKey: 'template.wpnSwords.title', descKey: 'template.wpnSwords.desc', w: 16, h: 16, frames: 6 },
  { id: 'wpn-ranged', cat: 'weapon', titleKey: 'template.wpnRanged.title', descKey: 'template.wpnRanged.desc', w: 16, h: 16, frames: 6 },
  { id: 'wpn-shields', cat: 'weapon', titleKey: 'template.wpnShields.title', descKey: 'template.wpnShields.desc', w: 16, h: 16, frames: 4 },
  { id: 'wpn-magic', cat: 'weapon', titleKey: 'template.wpnMagic.title', descKey: 'template.wpnMagic.desc', w: 16, h: 16, frames: 5 },
  { id: 'wpn-heavy', cat: 'weapon', titleKey: 'template.wpnHeavy.title', descKey: 'template.wpnHeavy.desc', w: 16, h: 16, frames: 4 },
  { id: 'wpn-guns', cat: 'weapon', titleKey: 'template.wpnGuns.title', descKey: 'template.wpnGuns.desc', w: 16, h: 16, frames: 5 },

  // --- 4. Item & Harta Karun (6) ---
  { id: 'item-potions', cat: 'item', titleKey: 'template.itemPotions.title', descKey: 'template.itemPotions.desc', w: 16, h: 16, frames: 5 },
  { id: 'item-gems', cat: 'item', titleKey: 'template.itemGems.title', descKey: 'template.itemGems.desc', w: 16, h: 16, frames: 5 },
  { id: 'item-keys', cat: 'item', titleKey: 'template.itemKeys.title', descKey: 'template.itemKeys.desc', w: 16, h: 16, frames: 5 },
  { id: 'item-food', cat: 'item', titleKey: 'template.itemFood.title', descKey: 'template.itemFood.desc', w: 16, h: 16, frames: 5 },
  { id: 'item-scrolls', cat: 'item', titleKey: 'template.itemScrolls.title', descKey: 'template.itemScrolls.desc', w: 16, h: 16, frames: 4 },
  { id: 'item-chests', cat: 'item', titleKey: 'template.itemChests.title', descKey: 'template.itemChests.desc', w: 16, h: 16, frames: 4 },

  // --- 5. Tileset Lingkungan (6) ---
  { id: 'tile-dungeon', cat: 'tileset', titleKey: 'template.tileDungeon.title', descKey: 'template.tileDungeon.desc', w: 64, h: 64, frames: 1 },
  { id: 'tile-overworld', cat: 'tileset', titleKey: 'template.tileOverworld.title', descKey: 'template.tileOverworld.desc', w: 64, h: 64, frames: 1 },
  { id: 'tile-water', cat: 'tileset', titleKey: 'template.tileWater.title', descKey: 'template.tileWater.desc', w: 64, h: 64, frames: 3 },
  { id: 'tile-desert', cat: 'tileset', titleKey: 'template.tileDesert.title', descKey: 'template.tileDesert.desc', w: 64, h: 64, frames: 1 },
  { id: 'tile-snow', cat: 'tileset', titleKey: 'template.tileSnow.title', descKey: 'template.tileSnow.desc', w: 64, h: 64, frames: 1 },
  { id: 'tile-scifi', cat: 'tileset', titleKey: 'template.tileScifi.title', descKey: 'template.tileScifi.desc', w: 64, h: 64, frames: 1 },

  // --- 6. Efek Visual / FX (5) ---
  { id: 'fx-explosion', cat: 'fx', titleKey: 'template.fxExplosion.title', descKey: 'template.fxExplosion.desc', w: 32, h: 32, frames: 6 },
  { id: 'fx-slash', cat: 'fx', titleKey: 'template.fxSlash.title', descKey: 'template.fxSlash.desc', w: 32, h: 32, frames: 4 },
  { id: 'fx-fireball', cat: 'fx', titleKey: 'template.fxFireball.title', descKey: 'template.fxFireball.desc', w: 24, h: 24, frames: 4 },
  { id: 'fx-lightning', cat: 'fx', titleKey: 'template.fxLightning.title', descKey: 'template.fxLightning.desc', w: 32, h: 48, frames: 4 },
  { id: 'fx-splash', cat: 'fx', titleKey: 'template.fxSplash.title', descKey: 'template.fxSplash.desc', w: 24, h: 24, frames: 4 },

  // --- 7. Antarmuka Game 2D (5) ---
  { id: 'ui-dialog', cat: 'ui', titleKey: 'template.uiDialog.title', descKey: 'template.uiDialog.desc', w: 48, h: 48, frames: 1 },
  { id: 'ui-healthbar', cat: 'ui', titleKey: 'template.uiHealthbar.title', descKey: 'template.uiHealthbar.desc', w: 64, h: 16, frames: 2 },
  { id: 'ui-inventory', cat: 'ui', titleKey: 'template.uiInventory.title', descKey: 'template.uiInventory.desc', w: 32, h: 32, frames: 3 },
  { id: 'ui-buttons', cat: 'ui', titleKey: 'template.uiButtons.title', descKey: 'template.uiButtons.desc', w: 48, h: 20, frames: 3 },
  { id: 'ui-radar', cat: 'ui', titleKey: 'template.uiRadar.title', descKey: 'template.uiRadar.desc', w: 48, h: 48, frames: 1 },
];

// Helper: Palette Setup
function createPalettes(name = 'Sweetie 16') {
  return new PaletteSet({
    palettes: [new Palette({ name, colors: BUILTIN_PALETTES[name] || BUILTIN_PALETTES['Sweetie 16'] })],
    active: 0,
  });
}

// Drawing primitives
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

function outlineRect(cel, doc, x, y, w, h, color) {
  fillRect(cel, doc, x, y, w, 1, color);
  fillRect(cel, doc, x, y + h - 1, w, 1, color);
  fillRect(cel, doc, x, y, 1, h, color);
  fillRect(cel, doc, x + w - 1, y, 1, h, color);
}

/**
 * Procedural Document Builder.
 * Returns a fully live PixelDocument configured with multiple layers for easy editing.
 */
export function buildTemplate(templateId) {
  const meta = GAME_TEMPLATES.find((t) => t.id === templateId) || GAME_TEMPLATES[0];
  const doc = PixelDocument.create({
    width: meta.w,
    height: meta.h,
    title: meta.id.replace(/-/g, '_'),
    layerName: 'Base',
  });
  doc.palette = createPalettes(meta.cat === 'ui' ? 'Pico-8' : meta.cat === 'building' ? 'Endesga 32' : 'Sweetie 16');
  doc.grid = { x: 0, y: 0, w: meta.w <= 32 ? 8 : 16, h: meta.h <= 32 ? 8 : 16 };

  // Setup frames
  doc.frames[0].duration = 120;
  for (let i = 1; i < meta.frames; i++) {
    doc.addFrame({ duration: 120 });
  }

  // Generate content by category
  if (meta.cat === 'character') buildCharacterTemplate(doc, meta.id);
  else if (meta.cat === 'building') buildBuildingTemplate(doc, meta.id);
  else if (meta.cat === 'weapon') buildWeaponTemplate(doc, meta.id);
  else if (meta.cat === 'item') buildItemTemplate(doc, meta.id);
  else if (meta.cat === 'tileset') buildTilesetTemplate(doc, meta.id);
  else if (meta.cat === 'fx') buildFxTemplate(doc, meta.id);
  else if (meta.cat === 'ui') buildUiTemplate(doc, meta.id);

  doc.modified = new Date().toISOString();
  return doc;
}

// -----------------------------------------------------------------------------
// 1. Karakter Builders (Multi-Layer: Base Body, Details/Armor, FX/Weapon)
// -----------------------------------------------------------------------------
function buildCharacterTemplate(doc, id) {
  const layerBody = doc.layers[0];
  layerBody.name = 'Tubuh (Body)';
  const layerArmor = doc.addLayer({ name: 'Pakaian & Armor (Clothes)' });
  const layerFx = doc.addLayer({ name: 'Senjata & FX (Weapon)' });

  const outline = '#1a1c2c', skin = '#ffcd75', skinDark = '#ef7d57';
  const cloth = id === 'char-mage' ? '#733e39' : id === 'char-rogue' ? '#262b44' : '#41a6f6';
  const clothDark = id === 'char-mage' ? '#3e2731' : id === 'char-rogue' ? '#181425' : '#3b5dc9';
  const accent = id === 'char-knight' ? '#94b0c2' : id === 'char-archer' ? '#73ced7' : '#ffec27';

  if (id === 'char-slime') {
    doc.tags = [{ name: 'bounce', from: 0, to: 3, direction: 'pingpong', repeat: 0, color: '#a7f070' }];
    for (let f = 0; f < 4; f++) {
      const cel = doc.ensureCel(layerBody.id, doc.frames[f].id);
      const squash = [0, 1, 0, -2][f];
      // Slime body
      fillRect(cel, doc, 3 - squash, 8 + squash, 10 + squash * 2, 7 - squash, '#a7f070');
      fillRect(cel, doc, 4 - squash, 7 + squash, 8 + squash * 2, 1, '#a7f070');
      // Highlight & eyes
      pixel(cel, doc, 5 - squash, 9 + squash, '#ffffff');
      pixel(cel, doc, 9 + squash, 9 + squash, '#ffffff');
      pixel(cel, doc, 6 - squash, 9 + squash, '#3b5dc9');
      pixel(cel, doc, 10 + squash, 9 + squash, '#3b5dc9');
    }
    return;
  }

  if (id === 'char-bat') {
    doc.tags = [{ name: 'fly', from: 0, to: 3, direction: 'forward', repeat: 0, color: '#b13e53' }];
    for (let f = 0; f < 4; f++) {
      const cel = doc.ensureCel(layerBody.id, doc.frames[f].id);
      const wingY = [0, -2, 0, 2][f];
      // Bat head & ears
      fillRect(cel, doc, 6, 6, 4, 4, '#5d275d');
      pixel(cel, doc, 6, 4, '#b13e53');
      pixel(cel, doc, 9, 4, '#b13e53');
      pixel(cel, doc, 7, 7, '#ffec27');
      pixel(cel, doc, 8, 7, '#ffec27');
      // Wings
      fillRect(cel, doc, 2, 5 + wingY, 4, 3, '#3e2731');
      fillRect(cel, doc, 10, 5 + wingY, 4, 3, '#3e2731');
    }
    return;
  }

  // Humanoid / Platformer animations (Knight, Mage, Archer, Rogue, Skeleton, Mannequin)
  doc.tags = [
    { name: 'walk', from: 0, to: 3, direction: 'forward', repeat: 0, color: '#41a6f6' },
  ];
  doc.slices = [
    { name: 'hitbox', frames: doc.frames.map((_, i) => ({ frame: i, rect: [10, 10, 12, 20], pivot: [16, 30] })) },
  ];
  doc.anchors = doc.frames.map((_, i) => ({ name: 'weapon_hand', frame: i, x: 21, y: 20 + (i % 2) }));

  for (let f = 0; f < 4; f++) {
    const celBody = doc.ensureCel(layerBody.id, doc.frames[f].id);
    const celArmor = doc.ensureCel(layerArmor.id, doc.frames[f].id);
    const celFx = doc.ensureCel(layerFx.id, doc.frames[f].id);
    const bob = f % 2 === 0 ? 0 : 1;
    const step = [0, 1, 0, -1][f];

    // 1. Body Base (Head, Skin, Feet)
    fillRect(celBody, doc, 12, 6 + bob, 8, 8, skin);
    fillRect(celBody, doc, 12, 12 + bob, 8, 2, skinDark);
    fillRect(celBody, doc, 13 + Math.max(0, step), 28, 3, 3, outline);
    fillRect(celBody, doc, 17 + Math.min(0, step), 28, 3, 3, outline);
    // Eyes
    pixel(celBody, doc, 18, 9 + bob, outline);
    pixel(celBody, doc, 18, 8 + bob, '#ffffff');

    // 2. Armor / Clothes Layer
    fillRect(celArmor, doc, 11, 14 + bob, 10, 10, cloth);
    fillRect(celArmor, doc, 11, 22 + bob, 10, 2, clothDark);
    fillRect(celArmor, doc, 12, 14 + bob, 8, 2, accent);
    if (id === 'char-mage') {
      // Wizard Hat
      fillRect(celArmor, doc, 9, 5 + bob, 14, 2, clothDark);
      fillRect(celArmor, doc, 12, 1 + bob, 8, 4, cloth);
      pixel(celArmor, doc, 15, 0 + bob, '#ffec27');
    }

    // 3. Weapon / FX Layer
    if (id === 'char-knight') {
      fillRect(celFx, doc, 21, 10 + bob + step, 2, 12, '#f4f4f4');
      fillRect(celFx, doc, 19, 18 + bob + step, 6, 2, '#ef7d57');
    } else if (id === 'char-archer') {
      fillRect(celFx, doc, 22, 11 + bob, 1, 12, '#ef7d57');
      pixel(celFx, doc, 21, 10 + bob, '#94b0c2');
      pixel(celFx, doc, 21, 23 + bob, '#94b0c2');
    } else if (id === 'char-mage') {
      // Magic Staff
      fillRect(celFx, doc, 22, 8 + bob, 2, 16, '#566c86');
      fillRect(celFx, doc, 21, 5 + bob, 4, 4, '#ffec27');
    }
  }
}

// -----------------------------------------------------------------------------
// 2. Bangunan Builders (House, Tower, Windmill, Dungeon Gate, Shop, Shrine)
// -----------------------------------------------------------------------------
function buildBuildingTemplate(doc, id) {
  const layerWall = doc.layers[0];
  layerWall.name = 'Struktur & Dinding (Walls)';
  const layerRoof = doc.addLayer({ name: 'Atap & Genteng (Roof)' });
  const layerDetails = doc.addLayer({ name: 'Pintu & Jendela (Details)' });

  const celWall = doc.ensureCel(layerWall.id, doc.frames[0].id);
  const celRoof = doc.ensureCel(layerRoof.id, doc.frames[0].id);
  const celDetails = doc.ensureCel(layerDetails.id, doc.frames[0].id);

  if (id === 'bldg-cottage') {
    // Stone walls
    fillRect(celWall, doc, 10, 24, 44, 34, '#94b0c2');
    outlineRect(celWall, doc, 10, 24, 44, 34, '#333f58');
    // Brick lines
    for (let y = 30; y < 54; y += 6) {
      fillRect(celWall, doc, 12, y, 40, 1, '#566c86');
    }
    // Chimney
    fillRect(celWall, doc, 42, 6, 6, 14, '#b13e53');
    // Wood Roof
    for (let r = 0; r < 18; r++) {
      fillRect(celRoof, doc, 6 + r * 2, 24 - r, 52 - r * 4, 2, '#b13e53');
      fillRect(celRoof, doc, 7 + r * 2, 25 - r, 50 - r * 4, 1, '#ef7d57');
    }
    // Door & Glowing Windows
    fillRect(celDetails, doc, 26, 40, 12, 18, '#5d275d');
    fillRect(celDetails, doc, 27, 41, 10, 16, '#262b44');
    pixel(celDetails, doc, 35, 49, '#ffec27'); // Doorknob
    // Windows with light
    fillRect(celDetails, doc, 14, 34, 8, 8, '#ffcd75');
    fillRect(celDetails, doc, 42, 34, 8, 8, '#ffcd75');
    outlineRect(celDetails, doc, 14, 34, 8, 8, '#333f58');
    outlineRect(celDetails, doc, 42, 34, 8, 8, '#333f58');
    return;
  }

  if (id === 'bldg-tower') {
    doc.tags = [{ name: 'idle', from: 0, to: 1, direction: 'forward', repeat: 0 }];
    for (let f = 0; f < 2; f++) {
      const cW = doc.ensureCel(layerWall.id, doc.frames[f].id);
      const cR = doc.ensureCel(layerRoof.id, doc.frames[f].id);
      const cD = doc.ensureCel(layerDetails.id, doc.frames[f].id);
      // Tower stone column
      fillRect(cW, doc, 16, 16, 32, 44, '#566c86');
      outlineRect(cW, doc, 16, 16, 32, 44, '#1a1c2c');
      // Castle parapets
      fillRect(cR, doc, 14, 10, 36, 6, '#333f58');
      fillRect(cR, doc, 14, 6, 6, 4, '#333f58');
      fillRect(cR, doc, 24, 6, 6, 4, '#333f58');
      fillRect(cR, doc, 34, 6, 6, 4, '#333f58');
      fillRect(cR, doc, 44, 6, 6, 4, '#333f58');
      // Flag flapping
      fillRect(cD, doc, 28, 0, 2, 10, '#333f58'); // Pole
      fillRect(cD, doc, 30, f === 0 ? 0 : 1, 8, 5, '#b13e53');
      // Iron Gate
      fillRect(cD, doc, 26, 44, 12, 16, '#1a1c2c');
      for (let i = 28; i < 38; i += 2) fillRect(cD, doc, i, 45, 1, 15, '#94b0c2');
    }
    return;
  }

  // Generic RPG building fallback (Shop, Shrine, Windmill, Gate)
  fillRect(celWall, doc, 8, 20, 48, 40, '#566c86');
  outlineRect(celWall, doc, 8, 20, 48, 40, '#1a1c2c');
  fillRect(celRoof, doc, 4, 12, 56, 10, '#b13e53');
  fillRect(celDetails, doc, 24, 40, 16, 20, '#ffcd75');
}

// -----------------------------------------------------------------------------
// 3. Senjata Builders (Swords, Ranged, Shields, Magic, Heavy, Guns)
// -----------------------------------------------------------------------------
function buildWeaponTemplate(doc, id) {
  const layerWeapon = doc.layers[0];
  layerWeapon.name = 'Senjata (Weapon Sprite)';
  const layerGlow = doc.addLayer({ name: 'Efek Kilau & Partikel (FX)' });

  // Each frame holds 1 weapon variant
  const items = id === 'wpn-swords'
    ? [
        { name: 'Pedang Baja', blade: '#f4f4f4', hilt: '#ef7d57', gem: '#41a6f6' },
        { name: 'Pedang Emas', blade: '#ffec27', hilt: '#b13e53', gem: '#a7f070' },
        { name: 'Pedang Api', blade: '#ef7d57', hilt: '#3e2731', gem: '#ffec27' },
        { name: 'Katana Hitam', blade: '#333f58', hilt: '#f4f4f4', gem: '#b13e53' },
        { name: 'Belati Racun', blade: '#a7f070', hilt: '#262b44', gem: '#a7f070' },
        { name: 'Rapier Elit', blade: '#94b0c2', hilt: '#ffcd75', gem: '#41a6f6' },
      ]
    : [
        { name: 'Item 1', blade: '#f4f4f4', hilt: '#ef7d57' },
        { name: 'Item 2', blade: '#ffec27', hilt: '#b13e53' },
        { name: 'Item 3', blade: '#ef7d57', hilt: '#3e2731' },
        { name: 'Item 4', blade: '#a7f070', hilt: '#262b44' },
      ];

  for (let f = 0; f < doc.frames.length; f++) {
    const cel = doc.ensureCel(layerWeapon.id, doc.frames[f].id);
    const celGlow = doc.ensureCel(layerGlow.id, doc.frames[f].id);
    const w = items[f % items.length];

    if (id === 'wpn-swords') {
      // Diagonal sword
      for (let i = 0; i < 9; i++) {
        pixel(cel, doc, 4 + i, 12 - i, w.blade);
        pixel(cel, doc, 5 + i, 12 - i, '#1a1c2c');
      }
      // Crossguard & hilt
      pixel(cel, doc, 3, 11, w.hilt);
      pixel(cel, doc, 5, 13, w.hilt);
      pixel(cel, doc, 2, 14, '#5d275d');
      // Sparkle FX
      pixel(celGlow, doc, 13, 3, '#ffffff');
      pixel(celGlow, doc, 12, 4, w.gem);
    } else {
      // Bow, Shield, Staff, Gun generic
      fillRect(cel, doc, 4, 3, 8, 10, w.blade);
      outlineRect(cel, doc, 4, 3, 8, 10, '#1a1c2c');
      pixel(celGlow, doc, 8, 2, '#ffec27');
    }
  }
}

// -----------------------------------------------------------------------------
// 4. Item Builders (Potions, Gems, Keys, Food, Scrolls, Chests)
// -----------------------------------------------------------------------------
function buildItemTemplate(doc, id) {
  const layerBase = doc.layers[0];
  layerBase.name = 'Item';
  const layerLiquid = doc.addLayer({ name: 'Isi & Cairan (Liquid/Details)' });

  if (id === 'item-potions') {
    const potions = ['#b13e53', '#41a6f6', '#a7f070', '#ffec27', '#5d275d'];
    for (let f = 0; f < doc.frames.length; f++) {
      const cB = doc.ensureCel(layerBase.id, doc.frames[f].id);
      const cL = doc.ensureCel(layerLiquid.id, doc.frames[f].id);
      const col = potions[f % potions.length];
      // Cork & Neck
      fillRect(cB, doc, 7, 2, 2, 2, '#ef7d57');
      fillRect(cB, doc, 6, 4, 4, 2, '#94b0c2');
      // Glass body outline
      outlineRect(cB, doc, 4, 6, 8, 8, '#262b44');
      // Liquid inside
      fillRect(cL, doc, 5, 8, 6, 5, col);
      pixel(cL, doc, 5, 7, '#ffffff'); // Glass reflection
    }
    return;
  }

  if (id === 'item-chests') {
    doc.tags = [{ name: 'open', from: 0, to: 3, direction: 'forward', repeat: 1 }];
    for (let f = 0; f < 4; f++) {
      const cB = doc.ensureCel(layerBase.id, doc.frames[f].id);
      const cL = doc.ensureCel(layerLiquid.id, doc.frames[f].id);
      const lidY = f === 0 ? 5 : f === 1 ? 4 : f === 2 ? 3 : 2;
      // Chest base
      fillRect(cB, doc, 2, 7, 12, 7, '#733e39');
      outlineRect(cB, doc, 2, 7, 12, 7, '#1a1c2c');
      // Gold trim
      fillRect(cB, doc, 2, 10, 12, 1, '#ffec27');
      pixel(cB, doc, 7, 10, '#3e2731'); // Lock keyhole
      // Lid
      fillRect(cL, doc, 2, lidY, 12, 3, '#b13e53');
      outlineRect(cL, doc, 2, lidY, 12, 3, '#1a1c2c');
      if (f > 1) {
        // Gold glow inside
        fillRect(cL, doc, 4, 6, 8, 2, '#ffec27');
      }
    }
    return;
  }

  // Gems, Keys, Food, Scrolls generic
  for (let f = 0; f < doc.frames.length; f++) {
    const cB = doc.ensureCel(layerBase.id, doc.frames[f].id);
    fillRect(cB, doc, 4, 4, 8, 8, '#ffcd75');
    outlineRect(cB, doc, 4, 4, 8, 8, '#1a1c2c');
  }
}

// -----------------------------------------------------------------------------
// 5. Tileset Builders (Dungeon, Overworld, Water, Desert, Snow, SciFi)
// -----------------------------------------------------------------------------
function buildTilesetTemplate(doc, id) {
  const layerFloor = doc.layers[0];
  layerFloor.name = 'Lantai Dasar (Floor/Water)';
  const layerWalls = doc.addLayer({ name: 'Dinding & Rintangan (Walls/Solids)' });
  const layerProps = doc.addLayer({ name: 'Dekorasi & Props (Decor)' });

  doc.grid = { x: 0, y: 0, w: 16, h: 16 };

  const cF = doc.ensureCel(layerFloor.id, doc.frames[0].id);
  const cW = doc.ensureCel(layerWalls.id, doc.frames[0].id);
  const cP = doc.ensureCel(layerProps.id, doc.frames[0].id);

  if (id === 'tile-dungeon') {
    // 4 tiles of 16x16: Tile (0,0) Wall, Tile (1,0) Floor, Tile (2,0) Trap, Tile (3,0) Stairs
    // 1. Stone Wall (0,0)
    fillRect(cW, doc, 0, 0, 16, 16, '#566c86');
    fillRect(cW, doc, 1, 1, 14, 14, '#333f58');
    outlineRect(cW, doc, 0, 0, 16, 16, '#1a1c2c');
    // 2. Stone Floor (16,0)
    fillRect(cF, doc, 16, 0, 16, 16, '#94b0c2');
    fillRect(cF, doc, 17, 1, 14, 14, '#566c86');
    pixel(cF, doc, 20, 5, '#333f58');
    pixel(cF, doc, 27, 11, '#333f58');
    // 3. Spike Trap (32,0)
    fillRect(cF, doc, 32, 0, 16, 16, '#566c86');
    for (let x = 35; x <= 45; x += 4) {
      pixel(cP, doc, x, 7, '#f4f4f4');
      pixel(cP, doc, x, 8, '#94b0c2');
    }
    // 4. Down Stairs (48,0)
    fillRect(cF, doc, 48, 0, 16, 16, '#566c86');
    for (let s = 0; s < 4; s++) {
      fillRect(cP, doc, 50, 2 + s * 3, 12, 2, '#262b44');
    }
    return;
  }

  // Overworld, Water, Desert, Snow, SciFi generic grid
  fillRect(cF, doc, 0, 0, 64, 64, id === 'tile-overworld' ? '#a7f070' : '#41a6f6');
  fillRect(cW, doc, 0, 0, 16, 16, '#ef7d57');
  fillRect(cP, doc, 16, 0, 16, 16, '#ffcd75');
}

// -----------------------------------------------------------------------------
// 6. FX Builders (Explosion, Slash, Fireball, Lightning, Splash)
// -----------------------------------------------------------------------------
function buildFxTemplate(doc, id) {
  const layerCore = doc.layers[0];
  layerCore.name = 'Inti FX (Core Flame/Energy)';
  const layerGlow = doc.addLayer({ name: 'Pendar Luar (Outer Glow)' });

  doc.tags = [{ name: 'play', from: 0, to: doc.frames.length - 1, direction: 'forward', repeat: 1 }];

  if (id === 'fx-explosion') {
    const stages = [3, 6, 10, 12, 8, 4];
    for (let f = 0; f < doc.frames.length; f++) {
      const cC = doc.ensureCel(layerCore.id, doc.frames[f].id);
      const cG = doc.ensureCel(layerGlow.id, doc.frames[f].id);
      const r = stages[f];
      const cx = 16, cy = 16;
      // Core yellow / white
      fillRect(cC, doc, cx - Math.floor(r / 2), cy - Math.floor(r / 2), r, r, f < 4 ? '#ffec27' : '#94b0c2');
      // Outer orange / red flame
      outlineRect(cG, doc, cx - Math.floor(r / 2) - 2, cy - Math.floor(r / 2) - 2, r + 4, r + 4, '#ef7d57');
      if (f >= 3) {
        // Smoke particles flying outwards
        pixel(cG, doc, cx - r - 2, cy - r, '#566c86');
        pixel(cG, doc, cx + r + 2, cy - r + 1, '#566c86');
        pixel(cG, doc, cx + r, cy + r + 2, '#333f58');
      }
    }
    return;
  }

  // Slash, Fireball, Lightning generic
  for (let f = 0; f < doc.frames.length; f++) {
    const cC = doc.ensureCel(layerCore.id, doc.frames[f].id);
    fillRect(cC, doc, 6 + f * 4, 6 + f * 2, 8, 8, '#ffec27');
  }
}

// -----------------------------------------------------------------------------
// 7. UI Builders (Dialog 9-Slice, Health Bar, Inventory, Buttons, Radar)
// -----------------------------------------------------------------------------
function buildUiTemplate(doc, id) {
  const layerBg = doc.layers[0];
  layerBg.name = 'Bingkai UI (Frame/9-Slice)';
  const layerContent = doc.addLayer({ name: 'Isi & Teks (Content/Bar)' });

  const cB = doc.ensureCel(layerBg.id, doc.frames[0].id);
  const cC = doc.ensureCel(layerContent.id, doc.frames[0].id);

  if (id === 'ui-dialog') {
    // 48x48 9-slice box
    doc.slices = [
      { name: 'dialog_frame', frames: [{ frame: 0, rect: [0, 0, 48, 48], pivot: [24, 24], center: [8, 8, 32, 32] }] },
    ];
    // Dark interior
    fillRect(cB, doc, 2, 2, 44, 44, '#1d2b53');
    // Gold ornamental borders
    outlineRect(cB, doc, 0, 0, 48, 48, '#ffec27');
    outlineRect(cB, doc, 2, 2, 44, 44, '#ab5236');
    // Corner gems
    pixel(cC, doc, 3, 3, '#ffffff');
    pixel(cC, doc, 44, 3, '#ffffff');
    pixel(cC, doc, 3, 44, '#ffffff');
    pixel(cC, doc, 44, 44, '#ffffff');
    return;
  }

  if (id === 'ui-healthbar') {
    // Frame 0: Full HP bar, Frame 1: Low HP bar
    doc.tags = [{ name: 'state', from: 0, to: 1, direction: 'forward', repeat: 0 }];
    for (let f = 0; f < 2; f++) {
      const c0 = doc.ensureCel(layerBg.id, doc.frames[f].id);
      const c1 = doc.ensureCel(layerContent.id, doc.frames[f].id);
      // Outer metal frame 64x16
      fillRect(c0, doc, 0, 0, 64, 16, '#5f574f');
      fillRect(c0, doc, 2, 2, 60, 12, '#000000');
      outlineRect(c0, doc, 0, 0, 64, 16, '#c2c3c7');
      // Red HP fill
      const hpWidth = f === 0 ? 56 : 18;
      fillRect(c1, doc, 4, 4, hpWidth, 8, '#e43b44');
      fillRect(c1, doc, 4, 4, hpWidth, 2, '#ff77a8'); // Highlight
    }
    return;
  }

  // Inventory slot, Buttons, Radar generic
  fillRect(cB, doc, 2, 2, doc.width - 4, doc.height - 4, '#1d2b53');
  outlineRect(cB, doc, 0, 0, doc.width, doc.height, '#ffec27');
}

/**
 * Load a template into the store as an active session in a new tab.
 */
export function loadGameTemplate(store, templateId) {
  const doc = buildTemplate(templateId);
  const session = store.createSession(doc, { fileName: `${doc.title}.pfx`, dirty: true });
  store.setUI({ tool: 'pencil', showTimeline: doc.frames.length > 1 });
  store.toast(store.ui.language === 'en' ? `Template "${doc.title}" loaded.` : `Templat "${doc.title}" berhasil dimuat.`, 'success');
  return session;
}
