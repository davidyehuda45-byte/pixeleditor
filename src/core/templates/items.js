import { fillRect, pixel, outlineRect, drawMatrix } from './helpers.js';

export function buildItemTemplate(doc, id) {
  const layerBase = doc.layers[0];
  layerBase.name = 'Item';
  const layerDetail = doc.addLayer({ name: 'Isi & Detail (Contents/Glow)' });

  if (id === 'item-potions') buildPotions(doc, layerBase, layerDetail);
  else if (id === 'item-chests') buildChests(doc, layerBase, layerDetail);
  else if (id === 'item-gems') buildGems(doc, layerBase, layerDetail);
  else if (id === 'item-keys') buildKeys(doc, layerBase, layerDetail);
  else if (id === 'item-food') buildFood(doc, layerBase, layerDetail);
  else if (id === 'item-scrolls') buildScrolls(doc, layerBase, layerDetail);
  else if (id === 'item-coins') buildCoins(doc, layerBase, layerDetail);
  else if (id === 'item-rings') buildRings(doc, layerBase, layerDetail);
  else if (id === 'item-books') buildBooks(doc, layerBase, layerDetail);
  else if (id === 'item-shields-armor') buildArmorIcons(doc, layerBase, layerDetail);
  else buildPotions(doc, layerBase, layerDetail);
}

// 1. Botol Ramuan Alkimia (5 varian)
function buildPotions(doc, layerBase, layerDetail) {
  const potions = ['#b13e53', '#41a6f6', '#38b764', '#5d275d', '#fee761'];
  for (let f = 0; f < doc.frames.length; f++) {
    const cB = doc.ensureCel(layerBase.id, doc.frames[f].id);
    const cL = doc.ensureCel(layerDetail.id, doc.frames[f].id);
    const col = potions[f % potions.length];

    // Cork & Bottle Neck
    fillRect(cB, doc, 7, 2, 2, 2, '#e4a672');
    fillRect(cB, doc, 6, 4, 4, 2, '#8b9bb4');
    // Glass flask outline
    outlineRect(cB, doc, 4, 6, 8, 8, '#262b44');

    // Colored Liquid Inside
    fillRect(cL, doc, 5, 8, 6, 5, col);
    pixel(cL, doc, 5, 7, '#ffffff'); // Glass specular reflection
    pixel(cL, doc, 6, 7, '#ffffff');
  }
}

// 2. Peti Harta Karun (4 frame animasi)
function buildChests(doc, layerBase, layerDetail) {
  doc.tags = [{ name: 'open', from: 0, to: 3, direction: 'forward', repeat: 1 }];
  for (let f = 0; f < 4; f++) {
    const cB = doc.ensureCel(layerBase.id, doc.frames[f].id);
    const cL = doc.ensureCel(layerDetail.id, doc.frames[f].id);
    const lidY = f === 0 ? 5 : f === 1 ? 4 : f === 2 ? 3 : 2;

    // Wood Base & Iron Corners
    fillRect(cB, doc, 2, 7, 12, 7, '#733e39');
    outlineRect(cB, doc, 2, 7, 12, 7, '#181425');
    // Gold Banding & Keyhole
    fillRect(cB, doc, 2, 10, 12, 1, '#fee761');
    pixel(cB, doc, 7, 10, '#3e2731');

    // Arched Lid
    fillRect(cL, doc, 2, lidY, 12, 3, '#b13e53');
    outlineRect(cL, doc, 2, lidY, 12, 3, '#181425');

    // Gold Loot Glowing Inside
    if (f >= 2) {
      fillRect(cL, doc, 4, 6, 8, 2, '#fee761');
      pixel(cL, doc, 6, 5, '#ffffff'); // Sparkle!
    }
  }
}

// 3. Permata & Kristal (5 frames: Diamond, Emerald, Ruby, Sapphire, Amethyst)
function buildGems(doc, layerBase, layerDetail) {
  const gemColors = [
    { base: '#73eff7', light: '#ffffff', dark: '#41a6f6' },
    { base: '#38b764', light: '#a7f070', dark: '#257179' },
    { base: '#b13e53', light: '#ef7d57', dark: '#733e39' },
    { base: '#41a6f6', light: '#c0cbdc', dark: '#3b5dc9' },
    { base: '#5d275d', light: '#793c79', dark: '#3e2731' },
  ];

  for (let f = 0; f < doc.frames.length; f++) {
    const cB = doc.ensureCel(layerBase.id, doc.frames[f].id);
    const cL = doc.ensureCel(layerDetail.id, doc.frames[f].id);
    const g = gemColors[f % gemColors.length];

    // Faceted Cut Gem (Octagonal)
    fillRect(cB, doc, 5, 5, 6, 6, g.base);
    pixel(cB, doc, 4, 7, g.base);
    pixel(cB, doc, 4, 8, g.base);
    pixel(cB, doc, 11, 7, g.base);
    pixel(cB, doc, 11, 8, g.base);
    outlineRect(cB, doc, 4, 5, 8, 6, '#181425');

    // Highlights & Facets
    pixel(cL, doc, 6, 6, g.light);
    pixel(cL, doc, 7, 6, g.light);
    pixel(cL, doc, 9, 9, g.dark);
    pixel(cL, doc, 8, 9, g.dark);
  }
}

// 4. Kunci Dungeon & Gembok (4 frames)
function buildKeys(doc, layerBase, layerDetail) {
  const keys = ['#e4a672', '#fee761', '#8b9bb4', '#73eff7'];
  for (let f = 0; f < doc.frames.length; f++) {
    const cB = doc.ensureCel(layerBase.id, doc.frames[f].id);
    const cL = doc.ensureCel(layerDetail.id, doc.frames[f].id);
    const col = keys[f % keys.length];

    // Key Ring Loop
    fillRect(cB, doc, 4, 4, 5, 5, col);
    outlineRect(cB, doc, 4, 4, 5, 5, '#181425');
    pixel(cB, doc, 6, 6, '#000000'); // Hole

    // Key Shaft & Teeth
    fillRect(cB, doc, 8, 6, 6, 2, col);
    fillRect(cB, doc, 12, 8, 2, 3, col); // Teeth
    fillRect(cB, doc, 10, 8, 1, 2, col);

    pixel(cL, doc, 5, 5, '#ffffff'); // Shine
  }
}

// 5. Ransum Petualang (4 frames: Meat on bone, Apple, Bread, Cheese)
function buildFood(doc, layerBase, layerDetail) {
  for (let f = 0; f < doc.frames.length; f++) {
    const cB = doc.ensureCel(layerBase.id, doc.frames[f].id);
    const cL = doc.ensureCel(layerDetail.id, doc.frames[f].id);

    if (f === 0) {
      // Roasted Meat on Bone
      fillRect(cB, doc, 5, 5, 7, 6, '#733e39');
      outlineRect(cB, doc, 5, 5, 7, 6, '#181425');
      // Bone ends
      pixel(cB, doc, 3, 7, '#f4f4f4');
      pixel(cB, doc, 3, 8, '#f4f4f4');
      pixel(cB, doc, 13, 7, '#f4f4f4');
      pixel(cB, doc, 13, 8, '#f4f4f4');
      pixel(cL, doc, 7, 6, '#e4a672');
    } else if (f === 1) {
      // Red Apple with Leaf
      fillRect(cB, doc, 5, 6, 6, 6, '#b13e53');
      outlineRect(cB, doc, 5, 6, 6, 6, '#181425');
      pixel(cL, doc, 7, 4, '#733e39'); // Stem
      pixel(cL, doc, 8, 4, '#38b764'); // Green leaf
      pixel(cL, doc, 6, 7, '#ffffff');
    } else if (f === 2) {
      // Bread
      fillRect(cB, doc, 4, 6, 8, 5, '#e4a672');
      outlineRect(cB, doc, 4, 6, 8, 5, '#733e39');
      pixel(cL, doc, 6, 7, '#ffffff');
    } else {
      // Cheese wedge
      fillRect(cB, doc, 4, 6, 8, 5, '#fee761');
      outlineRect(cB, doc, 4, 6, 8, 5, '#e4a672');
      pixel(cL, doc, 7, 8, '#e4a672'); // Hole
    }
  }
}

// 6. Gulungan Mantra (3 frames)
function buildScrolls(doc, layerBase, layerDetail) {
  for (let f = 0; f < doc.frames.length; f++) {
    const cB = doc.ensureCel(layerBase.id, doc.frames[f].id);
    const cL = doc.ensureCel(layerDetail.id, doc.frames[f].id);

    // Parchment Scroll
    fillRect(cB, doc, 4, 4, 8, 8, '#ffcd75');
    outlineRect(cB, doc, 4, 4, 8, 8, '#733e39');
    // Scroll Roll edges
    fillRect(cB, doc, 3, 3, 10, 2, '#e4a672');
    fillRect(cB, doc, 3, 11, 10, 2, '#e4a672');

    // Red Wax Seal or Glowing Runes
    fillRect(cL, doc, 7, 7, 2, 2, f === 1 ? '#73eff7' : '#b13e53');
    pixel(cL, doc, 5, 6, '#733e39'); // Writing text line
    pixel(cL, doc, 9, 6, '#733e39');
  }
}

// 7. Koin Emas & Batangan (4 frames)
function buildCoins(doc, layerBase, layerDetail) {
  for (let f = 0; f < doc.frames.length; f++) {
    const cB = doc.ensureCel(layerBase.id, doc.frames[f].id);
    const cL = doc.ensureCel(layerDetail.id, doc.frames[f].id);

    if (f < 2) {
      // Gold Coin Stack
      for (let s = 0; s < 3; s++) {
        fillRect(cB, doc, 5, 9 - s * 2, 6, 2, '#fee761');
        outlineRect(cB, doc, 5, 9 - s * 2, 6, 2, '#e4a672');
      }
      pixel(cL, doc, 7, 5, '#ffffff'); // Gold gleam
    } else {
      // Gold Ingot
      fillRect(cB, doc, 4, 8, 8, 4, '#fee761');
      outlineRect(cB, doc, 4, 8, 8, 4, '#e4a672');
      pixel(cL, doc, 5, 9, '#ffffff');
    }
  }
}

// 8. Cincin & Amulet (3 frames)
function buildRings(doc, layerBase, layerDetail) {
  for (let f = 0; f < doc.frames.length; f++) {
    const cB = doc.ensureCel(layerBase.id, doc.frames[f].id);
    const cL = doc.ensureCel(layerDetail.id, doc.frames[f].id);

    // Gold / Silver Band Ring
    const bandCol = f === 1 ? '#c0cbdc' : '#fee761';
    fillRect(cB, doc, 5, 6, 6, 6, bandCol);
    outlineRect(cB, doc, 5, 6, 6, 6, '#181425');
    pixel(cB, doc, 7, 8, '#000000'); // Inner ring hole
    pixel(cB, doc, 8, 8, '#000000');

    // Inset Ruby / Sapphire Gem on top
    pixel(cL, doc, 7, 5, f === 0 ? '#b13e53' : '#41a6f6');
    pixel(cL, doc, 8, 5, '#ffffff');
  }
}

// 9. Kitab Sihir & Grimoire (3 frames)
function buildBooks(doc, layerBase, layerDetail) {
  for (let f = 0; f < doc.frames.length; f++) {
    const cB = doc.ensureCel(layerBase.id, doc.frames[f].id);
    const cL = doc.ensureCel(layerDetail.id, doc.frames[f].id);

    // Thick Book Cover
    const cover = f === 0 ? '#5d275d' : f === 1 ? '#733e39' : '#181425';
    fillRect(cB, doc, 4, 4, 8, 9, cover);
    outlineRect(cB, doc, 4, 4, 8, 9, '#181425');
    // Book Pages Rim
    fillRect(cB, doc, 11, 5, 2, 7, '#ffcd75');

    // Gold Star or Rune Emblem on Cover
    pixel(cL, doc, 7, 8, '#fee761');
    pixel(cL, doc, 8, 7, '#fee761');
    pixel(cL, doc, 8, 9, '#fee761');
  }
}

// 10. Perlengkapan Pelindung (4 frames: Helm, Mail, Gauntlets, Boots)
function buildArmorIcons(doc, layerBase, layerDetail) {
  for (let f = 0; f < doc.frames.length; f++) {
    const cB = doc.ensureCel(layerBase.id, doc.frames[f].id);
    const cL = doc.ensureCel(layerDetail.id, doc.frames[f].id);

    if (f === 0) {
      // Steel Helmet with Crest
      fillRect(cB, doc, 4, 5, 8, 7, '#8b9bb4');
      outlineRect(cB, doc, 4, 5, 8, 7, '#1a1c2c');
      fillRect(cL, doc, 5, 8, 6, 2, '#1a1c2c'); // Visor slit
      pixel(cL, doc, 7, 4, '#b13e53'); // Crest
    } else if (f === 1) {
      // Chainmail Cuirass
      fillRect(cB, doc, 4, 5, 8, 8, '#566c86');
      outlineRect(cB, doc, 4, 5, 8, 8, '#1a1c2c');
      pixel(cL, doc, 6, 7, '#8b9bb4');
      pixel(cL, doc, 9, 7, '#8b9bb4');
    } else {
      // Armored Boots
      fillRect(cB, doc, 5, 6, 6, 6, '#8b9bb4');
      outlineRect(cB, doc, 5, 6, 6, 6, '#1a1c2c');
      pixel(cL, doc, 6, 7, '#ffffff');
    }
  }
}

