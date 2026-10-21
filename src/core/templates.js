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

function drawMatrix(cel, doc, startX, startY, rows, paletteMap) {
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

  if (id === 'char-slime') {
    buildSlimeCharacter(doc, layerBody);
    return;
  }
  if (id === 'char-bat') {
    buildBatCharacter(doc, layerBody);
    return;
  }

  // Humanoids (Knight, Mage, Archer, Rogue, Skeleton, Mannequin)
  doc.tags = [
    { name: 'walk', from: 0, to: 3, direction: 'forward', repeat: 0, color: '#41a6f6' },
  ];
  doc.slices = [
    { name: 'hitbox', frames: doc.frames.map((_, i) => ({ frame: i, rect: [10, 8, 12, 22], pivot: [16, 28] })) },
  ];
  doc.anchors = doc.frames.map((_, i) => ({ name: 'weapon_hand', frame: i, x: 23, y: 18 + (i % 2) }));

  if (id === 'char-knight') buildKnightCharacter(doc, layerBody, layerArmor, layerFx);
  else if (id === 'char-mage') buildMageCharacter(doc, layerBody, layerArmor, layerFx);
  else if (id === 'char-archer') buildArcherCharacter(doc, layerBody, layerArmor, layerFx);
  else if (id === 'char-rogue') buildRogueCharacter(doc, layerBody, layerArmor, layerFx);
  else if (id === 'char-skeleton') buildSkeletonCharacter(doc, layerBody, layerArmor, layerFx);
  else if (id === 'char-mannequin') buildMannequinCharacter(doc, layerBody, layerArmor, layerFx);
  else buildKnightCharacter(doc, layerBody, layerArmor, layerFx);
}

// 1.1 Ksatria (Knight)
function buildKnightCharacter(doc, layerBody, layerArmor, layerFx) {
  const K_PAL = {
    '#': '#1a1c2c',
    'S': '#8b9bb4',
    'L': '#c0cbdc',
    'W': '#ffffff',
    'D': '#566c86',
    'G': '#e4a672',
    'Y': '#fee761',
    'R': '#b13e53',
    'r': '#ef7d57',
    'B': '#3b5dc9',
    'b': '#41a6f6',
    'V': '#181425',
    'k': '#ffcd75',
  };

  for (let f = 0; f < 4; f++) {
    const cB = doc.ensureCel(layerBody.id, doc.frames[f].id);
    const cA = doc.ensureCel(layerArmor.id, doc.frames[f].id);
    const cF = doc.ensureCel(layerFx.id, doc.frames[f].id);
    const bob = f % 2 === 0 ? 0 : 1;
    const legStep = [0, 1, 0, -1][f];

    // ---- 1. Layer: Tubuh (Body) ----
    const headBody = [
      "   ######   ",
      "  #DDSSSS#  ",
      " #DDSSSSLL# ",
      " #DDVVVVLL# ",
      " #DDWWVVLL# ",
      " #DDDDSSLL# ",
      "  #kkkkkk#  ",
      "   ######   ",
    ];
    drawMatrix(cB, doc, 10, 6 + bob, headBody, K_PAL);

    // Gauntlets / Arms
    pixel(cB, doc, 9, 16 + bob, '#8b9bb4');
    pixel(cB, doc, 9, 17 + bob, '#566c86');
    pixel(cB, doc, 22, 16 + bob, '#8b9bb4');
    pixel(cB, doc, 22, 17 + bob, '#566c86');

    // Legs & Greaves in 4-step walk
    const legLeftX = 11 - legStep;
    const legRightX = 17 + legStep;
    const footLift = f === 1 ? -1 : 0;
    fillRect(cB, doc, legLeftX, 22 + bob, 3, 4, '#566c86');
    fillRect(cB, doc, legLeftX - 1, 26 + bob, 4, 2, '#8b9bb4');
    outlineRect(cB, doc, legLeftX - 1, 26 + bob, 4, 2, '#1a1c2c');
    fillRect(cB, doc, legRightX, 22 + bob + footLift, 3, 4, '#8b9bb4');
    fillRect(cB, doc, legRightX, 26 + bob + footLift, 4, 2, '#c0cbdc');
    outlineRect(cB, doc, legRightX, 26 + bob + footLift, 4, 2, '#1a1c2c');

    // ---- 2. Layer: Pakaian & Armor (Clothes) ----
    const plumeRows = [
      `  ${f === 1 ? '#rr' : '#RR'}#   `,
      ` #rr${f === 3 ? 'r' : 'R'}r#  `,
      `#RRRr#  `,
      ` #RR#   `,
    ];
    drawMatrix(cA, doc, 8, 2 + bob, plumeRows, K_PAL);

    // Visor cross plate
    pixel(cA, doc, 15, 9 + bob, '#fee761');
    pixel(cA, doc, 16, 9 + bob, '#fee761');
    pixel(cA, doc, 15, 8 + bob, '#e4a672');
    pixel(cA, doc, 15, 10 + bob, '#e4a672');

    // Pauldrons (Shoulders)
    drawMatrix(cA, doc, 7, 13 + bob, [" ### ", "#SLL#", "#DD #"], K_PAL);
    drawMatrix(cA, doc, 20, 13 + bob, [" ### ", "#SLL#", "#DD #"], K_PAL);

    // Breastplate with Royal Blue Tabard & Gold Belt
    const chestPlate = [
      " ####### ",
      "#SBGBGS#",
      "#SBGBGS#",
      "#DBbbBD#",
      "#DBGBGD#",
      " #GGGG# ",
      " #BBBB# ",
    ];
    drawMatrix(cA, doc, 12, 14 + bob, chestPlate, K_PAL);

    // Crimson Cape fluttering
    const capeW = f % 2 === 0 ? 0 : 1;
    fillRect(cA, doc, 8 - capeW, 15 + bob, 3, 8, '#b13e53');
    fillRect(cA, doc, 9 - capeW, 20 + bob, 2, 4, '#ef7d57');

    // ---- 3. Layer: Senjata & FX (Weapon) ----
    const swordBob = bob + (f === 1 ? -1 : 0);
    // Blade
    fillRect(cF, doc, 23, 7 + swordBob, 2, 10, '#c0cbdc');
    pixel(cF, doc, 23, 6 + swordBob, '#ffffff');
    pixel(cF, doc, 24, 7 + swordBob, '#ffffff');
    fillRect(cF, doc, 23, 17 + swordBob, 2, 1, '#566c86');
    // Crossguard
    fillRect(cF, doc, 21, 17 + swordBob, 6, 2, '#e4a672');
    pixel(cF, doc, 23, 17 + swordBob, '#fee761');
    // Hilt & Pommel
    fillRect(cF, doc, 23, 19 + swordBob, 2, 3, '#733e39');
    fillRect(cF, doc, 23, 22 + swordBob, 2, 2, '#b13e53');

    // Kite Shield on left arm
    const shieldBob = bob + (f === 3 ? -1 : 0);
    const shield = [
      " ###### ",
      "#LSSSSD#",
      "#LBBBSD#",
      "#LBYBSD#",
      "#LBYBSD#",
      " #BBYD# ",
      "  #BD#  ",
      "   ##   ",
    ];
    drawMatrix(cF, doc, 4, 13 + shieldBob, shield, K_PAL);
  }
}

// 1.2 Penyihir (Mage)
function buildMageCharacter(doc, layerBody, layerArmor, layerFx) {
  const M_PAL = {
    '#': '#1a1c2c',
    'P': '#5d275d',
    'p': '#793c79',
    'D': '#3e2731',
    'G': '#fee761',
    'g': '#e4a672',
    'K': '#ffcd75',
    'W': '#ffffff',
    'w': '#8b9bb4',
    'B': '#733e39',
    'b': '#a2583e',
    'C': '#73eff7',
    'c': '#ffffff',
  };

  for (let f = 0; f < 4; f++) {
    const cB = doc.ensureCel(layerBody.id, doc.frames[f].id);
    const cA = doc.ensureCel(layerArmor.id, doc.frames[f].id);
    const cF = doc.ensureCel(layerFx.id, doc.frames[f].id);
    const bob = f % 2 === 0 ? 0 : 1;
    const step = [0, 1, 0, -1][f];

    // Face & Eyes
    fillRect(cB, doc, 12, 8 + bob, 8, 5, '#ffcd75');
    pixel(cB, doc, 14, 9 + bob, '#1a1c2c');
    pixel(cB, doc, 17, 9 + bob, '#1a1c2c');
    pixel(cB, doc, 14, 8 + bob, '#ffffff');
    pixel(cB, doc, 17, 8 + bob, '#ffffff');

    // Long Majestic Beard
    const beard = [
      "  ######  ",
      " #WWWWWW# ",
      "#WWWWWWWW#",
      " #WWwwWW# ",
      "  #wwww#  ",
      "   #ww#   ",
      "    ##    ",
    ];
    drawMatrix(cB, doc, 11, 12 + bob, beard, M_PAL);

    // Shoes walking
    fillRect(cB, doc, 11 - step, 27 + bob, 4, 2, '#733e39');
    fillRect(cB, doc, 17 + step, 27 + bob, 4, 2, '#733e39');

    // Crooked Wizard Hat
    const hat = [
      "       ##   ",
      "      #PP#  ",
      "     #pPP#  ",
      "    #PPpP#  ",
      "   #pPPpP#  ",
      "  #GGGGGG#  ",
      "############",
      "#DDDDDDDDDD#",
    ];
    drawMatrix(cA, doc, 10, 1 + bob, hat, M_PAL);
    pixel(cA, doc, 16, 6 + bob, '#fee761');

    // Robe & Wide Sleeves
    const robe = [
      "  ########  ",
      " #pPPPPPPp# ",
      "#pPpPPPPpPp#",
      "#ppGGGGGGpp#",
      "#pPPPPPPPPp#",
      "#PPPPPPPPPP#",
      "#DDDDDDDDDD#",
      "#DDDDDDDDDD#",
      " #GGGGGGGG# ",
      "  ########  ",
    ];
    drawMatrix(cA, doc, 10, 16 + bob, robe, M_PAL);

    // Wooden Staff
    const staffBob = bob + (f === 1 ? -1 : 0);
    fillRect(cF, doc, 24, 8 + staffBob, 2, 19, '#733e39');
    fillRect(cF, doc, 25, 9 + staffBob, 1, 17, '#a2583e');
    pixel(cF, doc, 22, 6 + staffBob, '#e4a672');
    pixel(cF, doc, 23, 7 + staffBob, '#e4a672');
    pixel(cF, doc, 26, 7 + staffBob, '#e4a672');
    pixel(cF, doc, 27, 6 + staffBob, '#e4a672');

    // Floating Mana Orb & Rotating Sparkles
    const orbOffsets = [[0, 0], [1, -1], [0, -1], [-1, 0]][f % 4];
    const ox = 24 + orbOffsets[0], oy = 4 + staffBob + orbOffsets[1];
    fillRect(cF, doc, ox - 1, oy - 1, 4, 4, '#73eff7');
    pixel(cF, doc, ox, oy, '#ffffff');
    const sparkX = [21, 28, 22, 27][f % 4];
    const sparkY = [3, 5, 2, 3][f % 4];
    pixel(cF, doc, sparkX, sparkY + staffBob, '#fee761');
  }
}

// 1.3 Pemanah (Archer)
function buildArcherCharacter(doc, layerBody, layerArmor, layerFx) {
  const A_PAL = {
    '#': '#181425',
    'G': '#38b764',
    'g': '#a7f070',
    'D': '#257179',
    'B': '#733e39',
    'b': '#a2583e',
    'H': '#ef7d57',
    'h': '#fee761',
    'K': '#ffcd75',
    'W': '#ffffff',
    'S': '#8b9bb4',
    'R': '#b13e53',
  };

  for (let f = 0; f < 4; f++) {
    const cB = doc.ensureCel(layerBody.id, doc.frames[f].id);
    const cA = doc.ensureCel(layerArmor.id, doc.frames[f].id);
    const cF = doc.ensureCel(layerFx.id, doc.frames[f].id);
    const bob = f % 2 === 0 ? 0 : 1;
    const step = [0, 1, 0, -1][f];

    // Face & Eyes
    fillRect(cB, doc, 12, 8 + bob, 8, 6, '#ffcd75');
    pixel(cB, doc, 14, 10 + bob, '#181425');
    pixel(cB, doc, 17, 10 + bob, '#181425');
    pixel(cB, doc, 18, 10 + bob, '#ffffff');
    pixel(cB, doc, 11, 10 + bob, '#ffcd75');
    pixel(cB, doc, 10, 9 + bob, '#ffcd75');

    // Auburn Hair flowing
    const hair = [
      "  ####### ",
      " #hHHHHH# ",
      "#hHHHHHH# ",
      "#HHH######",
      "#HH#      ",
    ];
    drawMatrix(cB, doc, 10, 5 + bob, hair, A_PAL);

    // Boots
    fillRect(cB, doc, 11 - step, 24 + bob, 3, 4, '#733e39');
    fillRect(cB, doc, 10 - step, 27 + bob, 4, 2, '#a2583e');
    outlineRect(cB, doc, 10 - step, 27 + bob, 4, 2, '#181425');
    fillRect(cB, doc, 17 + step, 24 + bob, 3, 4, '#733e39');
    fillRect(cB, doc, 17 + step, 27 + bob, 4, 2, '#a2583e');
    outlineRect(cB, doc, 17 + step, 27 + bob, 4, 2, '#181425');

    // Cap with Crimson Feather
    const cap = [
      "    #RR#   ",
      "   #R##    ",
      "  #GGGGG#  ",
      " #GGGGGGG# ",
      "########## ",
    ];
    drawMatrix(cA, doc, 11, 2 + bob, cap, A_PAL);

    // Green Tunic & Leather Vest
    const tunic = [
      "  ######  ",
      " #GgGGgG# ",
      "#GgBBBBgG#",
      "#GBbbbbBG#",
      " #BBBBBB# ",
      " #GGDGDG# ",
      " #GGDGDG# ",
    ];
    drawMatrix(cA, doc, 11, 14 + bob, tunic, A_PAL);

    // Quiver on Back with Arrows
    fillRect(cA, doc, 8, 11 + bob, 3, 9, '#733e39');
    pixel(cA, doc, 8, 9 + bob, '#ffffff');
    pixel(cA, doc, 9, 8 + bob, '#ffffff');
    pixel(cA, doc, 10, 9 + bob, '#ffffff');

    // Recurve Hunting Bow & Arrow
    const bowX = 22, bowY = 10 + bob;
    pixel(cF, doc, bowX, bowY, '#a2583e');
    pixel(cF, doc, bowX + 1, bowY + 1, '#733e39');
    pixel(cF, doc, bowX + 2, bowY + 2, '#733e39');
    pixel(cF, doc, bowX + 2, bowY + 3, '#733e39');
    pixel(cF, doc, bowX + 2, bowY + 4, '#733e39');
    pixel(cF, doc, bowX + 2, bowY + 5, '#733e39');
    pixel(cF, doc, bowX + 1, bowY + 6, '#733e39');
    pixel(cF, doc, bowX, bowY + 7, '#a2583e');
    for (let sy = bowY + 1; sy <= bowY + 6; sy++) pixel(cF, doc, bowX - 1, sy, '#f4f4f4');
    fillRect(cF, doc, bowX - 3, bowY + 3, 7, 1, '#a2583e');
    pixel(cF, doc, bowX + 4, bowY + 3, '#8b9bb4');
  }
}

// 1.4 Pembunuh Bayangan (Rogue)
function buildRogueCharacter(doc, layerBody, layerArmor, layerFx) {
  const R_PAL = {
    '#': '#181425',
    'C': '#262b44',
    'c': '#3b5dc9',
    'D': '#181425',
    'G': '#566c86',
    'K': '#ffcd75',
    'E': '#73eff7',
    'P': '#38b764',
    'p': '#a7f070',
    'S': '#c0cbdc',
  };

  for (let f = 0; f < 4; f++) {
    const cB = doc.ensureCel(layerBody.id, doc.frames[f].id);
    const cA = doc.ensureCel(layerArmor.id, doc.frames[f].id);
    const cF = doc.ensureCel(layerFx.id, doc.frames[f].id);
    const bob = f % 2 === 0 ? 0 : 1;
    const step = [0, 1, 0, -1][f];

    // Masked Face & Piercing Cyan Eyes
    fillRect(cB, doc, 12, 9 + bob, 8, 5, '#181425');
    fillRect(cB, doc, 13, 8 + bob, 6, 2, '#ffcd75');
    pixel(cB, doc, 14, 9 + bob, '#73eff7');
    pixel(cB, doc, 17, 9 + bob, '#73eff7');

    // Tabi silent boots
    fillRect(cB, doc, 11 - step, 25 + bob, 3, 3, '#181425');
    fillRect(cB, doc, 10 - step, 27 + bob, 4, 1, '#262b44');
    fillRect(cB, doc, 17 + step, 25 + bob, 3, 3, '#181425');
    fillRect(cB, doc, 17 + step, 27 + bob, 4, 1, '#262b44');

    // Shadow Hood
    const hood = [
      "   #####   ",
      "  #CCCCC#  ",
      " #CcCCCC#  ",
      "#CcCCCCCC# ",
      "#CCCCCCCC# ",
    ];
    drawMatrix(cA, doc, 10, 4 + bob, hood, R_PAL);

    // Billowing Midnight Scarf
    const scarfWave = f === 1 ? -1 : f === 3 ? 1 : 0;
    fillRect(cA, doc, 6, 13 + bob + scarfWave, 5, 2, '#3b5dc9');
    fillRect(cA, doc, 4, 14 + bob + scarfWave, 4, 2, '#262b44');

    // Stealth Tunic & Harness
    const leathers = [
      "  ######  ",
      " #CCCCCC# ",
      "#CcGGGGcC#",
      "#CGGGGGGC#",
      " #GGGGGG# ",
      " #CCCCCC# ",
      " #DDDDDD# ",
    ];
    drawMatrix(cA, doc, 11, 14 + bob, leathers, R_PAL);

    // Dual Curved Poison Daggers
    const d1Bob = bob + (f === 1 ? -1 : 0);
    fillRect(cF, doc, 23, 13 + d1Bob, 2, 7, '#c0cbdc');
    pixel(cF, doc, 23, 12 + d1Bob, '#a7f070');
    pixel(cF, doc, 24, 13 + d1Bob, '#38b764');
    fillRect(cF, doc, 21, 17 + d1Bob, 5, 1, '#181425');
    fillRect(cF, doc, 23, 18 + d1Bob, 2, 3, '#566c86');

    const d2Bob = bob + (f === 3 ? -1 : 0);
    fillRect(cF, doc, 7, 16 + d2Bob, 2, 6, '#c0cbdc');
    pixel(cF, doc, 7, 22 + d2Bob, '#a7f070');
    fillRect(cF, doc, 6, 16 + d2Bob, 4, 1, '#181425');
  }
}

// 1.5 Tengkorak (Skeleton)
function buildSkeletonCharacter(doc, layerBody, layerArmor, layerFx) {
  const S_PAL = {
    '#': '#181425',
    'W': '#f4f4f4',
    'w': '#8b9bb4',
    'D': '#566c86',
    'R': '#733e39',
    'r': '#e4a672',
    'E': '#ef7d57',
  };

  for (let f = 0; f < 4; f++) {
    const cB = doc.ensureCel(layerBody.id, doc.frames[f].id);
    const cA = doc.ensureCel(layerArmor.id, doc.frames[f].id);
    const cF = doc.ensureCel(layerFx.id, doc.frames[f].id);
    const bob = f % 2 === 0 ? 0 : 1;
    const step = [0, 1, 0, -1][f];

    // Skull with Glowing Soul Embers & Teeth
    const skull = [
      "   #####   ",
      "  #WWWWW#  ",
      " #WWWWWWW# ",
      " #W#E#W#E# ",
      " #WW#WW#W# ",
      "  #WWWWw#  ",
      "  #W#W#W#  ",
      "   #####   ",
    ];
    drawMatrix(cB, doc, 11, 5 + bob, skull, S_PAL);

    // Spine & Ribcage
    fillRect(cB, doc, 15, 13 + bob, 2, 7, '#8b9bb4');
    for (let r = 0; r < 3; r++) {
      fillRect(cB, doc, 12, 14 + bob + r * 2, 8, 1, '#f4f4f4');
      pixel(cB, doc, 11, 14 + bob + r * 2, '#8b9bb4');
      pixel(cB, doc, 20, 14 + bob + r * 2, '#8b9bb4');
    }
    // Pelvis
    fillRect(cB, doc, 13, 20 + bob, 6, 2, '#f4f4f4');
    outlineRect(cB, doc, 13, 20 + bob, 6, 2, '#181425');

    // Clattering Leg Bones
    const lX = 12 - step, rX = 17 + step;
    fillRect(cB, doc, lX, 22 + bob, 2, 5, '#f4f4f4');
    fillRect(cB, doc, lX - 1, 27 + bob, 3, 1, '#8b9bb4');
    fillRect(cB, doc, rX, 22 + bob, 2, 5, '#f4f4f4');
    fillRect(cB, doc, rX, 27 + bob, 3, 1, '#8b9bb4');

    // Horned Helmet Fragment
    const helm = [
      "#R         ",
      " #Rr#####  ",
      "  #RrRRRR# ",
      "   ######  ",
    ];
    drawMatrix(cA, doc, 9, 3 + bob, helm, S_PAL);

    // Rusted Spiked Pauldron & Loincloth
    fillRect(cA, doc, 9, 13 + bob, 4, 3, '#733e39');
    pixel(cA, doc, 8, 12 + bob, '#e4a672');
    fillRect(cA, doc, 13, 21 + bob, 6, 3, '#3e2731');
    pixel(cA, doc, 14, 24 + bob, '#733e39');

    // Ancient Chipped Broadsword
    const wBob = bob + (f === 1 ? -1 : 0);
    fillRect(cF, doc, 23, 7 + wBob, 3, 11, '#733e39');
    pixel(cF, doc, 23, 6 + wBob, '#e4a672');
    pixel(cF, doc, 25, 11 + wBob, '#181425');
    pixel(cF, doc, 23, 14 + wBob, '#181425');
    fillRect(cF, doc, 21, 18 + wBob, 7, 2, '#181425');
    fillRect(cF, doc, 23, 20 + wBob, 2, 3, '#f4f4f4');
  }
}

// 1.6 Manekin Dasar (Artist Base Mannequin)
function buildMannequinCharacter(doc, layerBody, layerArmor, layerFx) {
  const D_PAL = {
    '#': '#493c2b',
    'W': '#d9a066',
    'w': '#eec39a',
    'D': '#8f563b',
    'J': '#262b44',
    'A': '#41a6f6',
  };

  for (let f = 0; f < 4; f++) {
    const cB = doc.ensureCel(layerBody.id, doc.frames[f].id);
    const cA = doc.ensureCel(layerArmor.id, doc.frames[f].id);
    const cF = doc.ensureCel(layerFx.id, doc.frames[f].id);
    const bob = f % 2 === 0 ? 0 : 1;
    const step = [0, 1, 0, -1][f];

    // Head Sphere with Anatomy Crosshair Guide
    const head = [
      "   #####   ",
      "  #wWWWW#  ",
      " #wWWAAWW# ",
      " #wWAAAAw# ",
      " #wWWAAWW# ",
      "  #WWDDD#  ",
      "   #####   ",
    ];
    drawMatrix(cB, doc, 11, 5 + bob, head, D_PAL);

    // Neck Ball-Joint
    fillRect(cB, doc, 14, 12 + bob, 3, 2, '#262b44');

    // Segmented Torso
    const chest = [
      "  #######  ",
      " #wWWWWWW# ",
      "#wWWWWWWWW#",
      "#wWWWWWWWW#",
      " #WDDDDDW# ",
      "  #JJJJ#  ",
      " #wWWWWWW# ",
      "  ######  ",
    ];
    drawMatrix(cB, doc, 11, 13 + bob, chest, D_PAL);

    // Ball-jointed Legs & Feet
    const lX = 12 - step, rX = 17 + step;
    fillRect(cB, doc, lX, 21 + bob, 2, 1, '#262b44');
    fillRect(cB, doc, lX, 22 + bob, 2, 2, '#d9a066');
    fillRect(cB, doc, lX, 24 + bob, 2, 1, '#262b44');
    fillRect(cB, doc, lX, 25 + bob, 2, 2, '#8f563b');
    fillRect(cB, doc, lX - 1, 27 + bob, 3, 2, '#d9a066');
    outlineRect(cB, doc, lX - 1, 27 + bob, 3, 2, '#493c2b');

    fillRect(cB, doc, rX, 21 + bob, 2, 1, '#262b44');
    fillRect(cB, doc, rX, 22 + bob, 2, 2, '#d9a066');
    fillRect(cB, doc, rX, 24 + bob, 2, 1, '#262b44');
    fillRect(cB, doc, rX, 25 + bob, 2, 2, '#8f563b');
    fillRect(cB, doc, rX, 27 + bob, 3, 2, '#d9a066');
    outlineRect(cB, doc, rX, 27 + bob, 3, 2, '#493c2b');

    // Guide Rings across chest and waist
    for (let x = 13; x <= 18; x += 2) pixel(cA, doc, x, 15 + bob, '#41a6f6');
    for (let x = 13; x <= 18; x += 2) pixel(cA, doc, x, 19 + bob, '#41a6f6');

    // Ground Ellipse Shadow
    fillRect(cF, doc, 10, 29, 12, 2, '#262b44');
    fillRect(cF, doc, 12, 28, 8, 3, '#1a1c2c');
  }
}

// 1.7 Slime (16x16, 4 frame bounce)
function buildSlimeCharacter(doc, layerBody) {
  doc.tags = [{ name: 'bounce', from: 0, to: 3, direction: 'pingpong', repeat: 0, color: '#a7f070' }];
  const S_PAL = {
    '#': '#181425',
    'G': '#38b764',
    'g': '#a7f070',
    'W': '#ffffff',
    'D': '#257179',
    'E': '#181425',
  };

  const f0 = [
    "      ####      ",
    "    ##gggg##    ",
    "   #ggWWgggg#   ",
    "  #gWWggggggg#  ",
    "  #gggggggggg#  ",
    " #gggggggggggg# ",
    " #gEgEggggEgEg# ",
    " #g#E#gggg#E#g# ",
    " #gggggggggggg# ",
    " #DDDDDDDDDDDD# ",
    "  #DDDDDDDDDD#  ",
    "   ##########   ",
  ];
  const f1 = [
    "                ",
    "                ",
    "   ##########   ",
    "  #gggggggggg#  ",
    " #ggWWgggggggg# ",
    " #gWWggggggggg# ",
    " #gEggggggggEg# ",
    " #GGGGGGGGGGGG# ",
    " #DDDDDDDDDDDD# ",
    " #DDDDDDDDDDDD# ",
    "  ############  ",
  ];
  const f2 = [
    "     ####     ",
    "    #gggg#    ",
    "   #ggWWgg#   ",
    "   #gWWggg#   ",
    "   #gggggg#   ",
    "   #gEggEg#   ",
    "   #g#gg#g#   ",
    "   #gggggg#   ",
    "    #DDDD#    ",
    "    #DDDD#    ",
    "     ####     ",
  ];
  const f3 = [
    "                ",
    "                ",
    "                ",
    "  #  ######  #  ",
    " #  #gggggg#  # ",
    "   #ggWWgggg#   ",
    "  #gEggggggggEg# ",
    "  #DDDDDDDDDD#  ",
    "   ##########   ",
  ];

  const frames = [f0, f1, f2, f3];
  const yOffsets = [2, 4, 1, 4];
  const xOffsets = [0, 0, 1, 0];

  for (let f = 0; f < 4; f++) {
    const cel = doc.ensureCel(layerBody.id, doc.frames[f].id);
    drawMatrix(cel, doc, xOffsets[f], yOffsets[f], frames[f], S_PAL);
  }
}

// 1.8 Kelelawar Gua (Bat, 16x16, 4 frame fly)
function buildBatCharacter(doc, layerBody) {
  doc.tags = [{ name: 'fly', from: 0, to: 3, direction: 'forward', repeat: 0, color: '#b13e53' }];
  const B_PAL = {
    '#': '#181425',
    'P': '#5d275d',
    'p': '#b13e53',
    'M': '#3e2731',
    'D': '#262b44',
    'Y': '#fee761',
    'W': '#ffffff',
  };

  const f0 = [
    " #            # ",
    " ##          ## ",
    " #D#  ####  #D# ",
    " #MD##PPpp##DM# ",
    "  #M#PppPP#M#   ",
    "   ##PYPYP##    ",
    "    #PWWP#      ",
    "    #PPPP#      ",
    "     #DD#       ",
    "      ##        ",
  ];
  const f1 = [
    " #####    ##### ",
    " #DDD######DDD# ",
    " #MM#PPppPP#MM# ",
    "  ##PPYPYPP##   ",
    "   #PPWWPP#     ",
    "    #PPPP#      ",
    "     #DD#       ",
    "      ##        ",
  ];
  const f2 = [
    "      ####      ",
    "     #PPpp#     ",
    "  ####PYPY####  ",
    " #DDD#PWWP#DDD# ",
    " #MMM#PPPP#MMM# ",
    "  #MM#DDDD#MM#  ",
    "   ##      ##   ",
  ];
  const f3 = [
    "      ####      ",
    "     #PPpp#     ",
    "    #PPYPYPP#   ",
    "    #PPWWPP#    ",
    "    ##PPPP##    ",
    "   #DD#PP#DD#   ",
    "   #MM#DD#MM#   ",
    "    ##    ##    ",
  ];

  const frames = [f0, f1, f2, f3];
  const yOffsets = [2, 3, 4, 3];

  for (let f = 0; f < 4; f++) {
    const cel = doc.ensureCel(layerBody.id, doc.frames[f].id);
    drawMatrix(cel, doc, 0, yOffsets[f], frames[f], B_PAL);
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
