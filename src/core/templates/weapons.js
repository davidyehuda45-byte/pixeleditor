import { fillRect, pixel, outlineRect, drawMatrix } from './helpers.js';

export function buildWeaponTemplate(doc, id) {
  const layerWeapon = doc.layers[0];
  layerWeapon.name = 'Senjata (Weapon Sprite)';
  const layerGlow = doc.addLayer({ name: 'Efek Kilau & Partikel (FX)' });

  if (id === 'wpn-swords') buildSwords(doc, layerWeapon, layerGlow);
  else if (id === 'wpn-ranged') buildRanged(doc, layerWeapon, layerGlow);
  else if (id === 'wpn-shields') buildShields(doc, layerWeapon, layerGlow);
  else if (id === 'wpn-magic') buildMagicStaves(doc, layerWeapon, layerGlow);
  else if (id === 'wpn-heavy') buildHeavyWeapons(doc, layerWeapon, layerGlow);
  else if (id === 'wpn-polearms') buildPolearms(doc, layerWeapon, layerGlow);
  else if (id === 'wpn-guns') buildGuns(doc, layerWeapon, layerGlow);
  else if (id === 'wpn-daggers') buildDaggers(doc, layerWeapon, layerGlow);
  else if (id === 'wpn-scythes') buildScythes(doc, layerWeapon, layerGlow);
  else if (id === 'wpn-wands') buildWands(doc, layerWeapon, layerGlow);
  else buildSwords(doc, layerWeapon, layerGlow);
}

// 1. Koleksi Pedang & Katana (6 frames: Steel, Gold, Fire, Dark Katana, Venom, Rapier)
function buildSwords(doc, layerWeapon, layerGlow) {
  const swords = [
    { blade: '#c0cbdc', hilt: '#733e39', guard: '#8b9bb4', gem: '#41a6f6', shine: '#ffffff' },
    { blade: '#fee761', hilt: '#b13e53', guard: '#e4a672', gem: '#a7f070', shine: '#ffffff' },
    { blade: '#ef7d57', hilt: '#3e2731', guard: '#733e39', gem: '#fee761', shine: '#fee761' },
    { blade: '#262b44', hilt: '#ffffff', guard: '#566c86', gem: '#b13e53', shine: '#73eff7' },
    { blade: '#38b764', hilt: '#181425', guard: '#257179', gem: '#a7f070', shine: '#a7f070' },
    { blade: '#f4f4f4', hilt: '#e4a672', guard: '#fee761', gem: '#41a6f6', shine: '#ffffff' },
  ];

  for (let f = 0; f < doc.frames.length; f++) {
    const cel = doc.ensureCel(layerWeapon.id, doc.frames[f].id);
    const celGlow = doc.ensureCel(layerGlow.id, doc.frames[f].id);
    const s = swords[f % swords.length];

    // Diagonal blade from (6, 17) to (18, 5)
    for (let i = 0; i < 13; i++) {
      pixel(cel, doc, 6 + i, 17 - i, s.blade);
      pixel(cel, doc, 7 + i, 17 - i, '#1a1c2c'); // Outline edge
    }
    // Crossguard
    pixel(cel, doc, 5, 17, s.guard);
    pixel(cel, doc, 7, 19, s.guard);
    pixel(cel, doc, 6, 18, s.gem);
    // Hilt & Pommel
    pixel(cel, doc, 4, 19, s.hilt);
    pixel(cel, doc, 3, 20, s.hilt);
    pixel(cel, doc, 2, 21, s.guard); // Pommel

    // Gleam FX
    pixel(celGlow, doc, 18, 5, s.shine);
    pixel(celGlow, doc, 17, 6, s.gem);
  }
}

// 2. Busur & Crossbow (4 frames)
function buildRanged(doc, layerWeapon, layerGlow) {
  for (let f = 0; f < doc.frames.length; f++) {
    const cel = doc.ensureCel(layerWeapon.id, doc.frames[f].id);
    const celGlow = doc.ensureCel(layerGlow.id, doc.frames[f].id);

    if (f < 2) {
      // Recurve Bow & Arrow
      const bowColor = f === 0 ? '#733e39' : '#38b764';
      for (let y = 4; y <= 19; y++) {
        const x = y < 11 ? 8 + Math.floor((11 - y) * 0.7) : 8 + Math.floor((y - 11) * 0.7);
        pixel(cel, doc, x, y, bowColor);
        pixel(cel, doc, 6, y, '#f4f4f4'); // Bowstring
      }
      // Arrow
      fillRect(cel, doc, 4, 11, 14, 1, '#e4a672');
      pixel(celGlow, doc, 18, 11, '#ffffff'); // Arrowhead shine
    } else {
      // Iron Crossbow
      fillRect(cel, doc, 6, 11, 13, 2, '#733e39'); // Stock
      fillRect(cel, doc, 17, 7, 2, 10, '#8b9bb4'); // Prod
      fillRect(cel, doc, 5, 13, 3, 3, '#1a1c2c'); // Grip
      pixel(celGlow, doc, 18, 7, '#fee761');
    }
  }
}

// 3. Perisai Tempur (4 frames: Kite, Tower, Buckler, Dragon)
function buildShields(doc, layerWeapon, layerGlow) {
  const shields = [
    { bg: '#3b5dc9', border: '#fee761', emblem: '#ffffff' },
    { bg: '#566c86', border: '#8b9bb4', emblem: '#fee761' },
    { bg: '#733e39', border: '#e4a672', emblem: '#b13e53' },
    { bg: '#b13e53', border: '#ef7d57', emblem: '#fee761' },
  ];

  for (let f = 0; f < 4; f++) {
    const cel = doc.ensureCel(layerWeapon.id, doc.frames[f].id);
    const celGlow = doc.ensureCel(layerGlow.id, doc.frames[f].id);
    const s = shields[f];

    fillRect(cel, doc, 6, 4, 12, 16, s.bg);
    outlineRect(cel, doc, 6, 4, 12, 16, s.border);
    // Heraldic Boss / Emblem in center
    fillRect(celGlow, doc, 10, 10, 4, 4, s.emblem);
    pixel(celGlow, doc, 11, 11, '#ffffff');
  }
}

// 4. Tongkat & Scepter Sihir (4 frames: Oak, Fire, Ice, Holy)
function buildMagicStaves(doc, layerWeapon, layerGlow) {
  const staves = [
    { wood: '#733e39', gem: '#73eff7', spark: '#ffffff' },
    { wood: '#3e2731', gem: '#ef7d57', spark: '#fee761' },
    { wood: '#262b44', gem: '#41a6f6', spark: '#ffffff' },
    { wood: '#fee761', gem: '#ffffff', spark: '#fee761' },
  ];

  for (let f = 0; f < 4; f++) {
    const cel = doc.ensureCel(layerWeapon.id, doc.frames[f].id);
    const celGlow = doc.ensureCel(layerGlow.id, doc.frames[f].id);
    const st = staves[f];

    // Staff Shaft
    fillRect(cel, doc, 11, 7, 2, 15, st.wood);
    // Crown Prongs
    pixel(cel, doc, 9, 5, st.wood);
    pixel(cel, doc, 10, 6, st.wood);
    pixel(cel, doc, 13, 6, st.wood);
    pixel(cel, doc, 14, 5, st.wood);

    // Floating Crystal Orb
    fillRect(celGlow, doc, 10, 3, 4, 4, st.gem);
    pixel(celGlow, doc, 11, 4, st.spark);
  }
}

// 5. Senjata Berat (4 frames: Battleaxe, Warhammer, Morningstar, Halberd)
function buildHeavyWeapons(doc, layerWeapon, layerGlow) {
  for (let f = 0; f < 4; f++) {
    const cel = doc.ensureCel(layerWeapon.id, doc.frames[f].id);
    const celGlow = doc.ensureCel(layerGlow.id, doc.frames[f].id);

    // Heavy Handle
    fillRect(cel, doc, 11, 8, 2, 14, '#733e39');

    if (f === 0) {
      // Double Battleaxe
      fillRect(cel, doc, 6, 4, 5, 7, '#8b9bb4');
      fillRect(cel, doc, 13, 4, 5, 7, '#8b9bb4');
      outlineRect(cel, doc, 6, 4, 12, 7, '#1a1c2c');
      pixel(celGlow, doc, 6, 4, '#ffffff');
    } else if (f === 1) {
      // Warhammer
      fillRect(cel, doc, 7, 4, 10, 6, '#566c86');
      outlineRect(cel, doc, 7, 4, 10, 6, '#1a1c2c');
      pixel(celGlow, doc, 8, 5, '#fee761');
    } else {
      // Halberd / Mace
      fillRect(cel, doc, 8, 3, 8, 7, '#8b9bb4');
      pixel(celGlow, doc, 11, 2, '#ffffff'); // Top spearhead
    }
  }
}

// 6. Tombak & Trisula (4 frames, 32x32)
function buildPolearms(doc, layerWeapon, layerGlow) {
  for (let f = 0; f < 4; f++) {
    const cel = doc.ensureCel(layerWeapon.id, doc.frames[f].id);
    const celGlow = doc.ensureCel(layerGlow.id, doc.frames[f].id);

    // Diagonal polearm from (6, 25) to (25, 6)
    for (let i = 0; i < 20; i++) {
      pixel(cel, doc, 6 + i, 25 - i, '#733e39');
    }
    // Spearhead / Trident
    if (f === 1) {
      // Sea Trident
      pixel(cel, doc, 24, 7, '#41a6f6');
      pixel(cel, doc, 26, 5, '#41a6f6');
      pixel(cel, doc, 27, 4, '#41a6f6');
      pixel(celGlow, doc, 27, 4, '#ffffff');
    } else {
      // Knight Lance
      fillRect(cel, doc, 23, 5, 4, 4, '#c0cbdc');
      pixel(celGlow, doc, 27, 3, '#ffffff');
    }
  }
}

// 7. Senjata Api Retro (4 frames: Flintlock, Blunderbuss, Musket, Plasma)
function buildGuns(doc, layerWeapon, layerGlow) {
  for (let f = 0; f < 4; f++) {
    const cel = doc.ensureCel(layerWeapon.id, doc.frames[f].id);
    const celGlow = doc.ensureCel(layerGlow.id, doc.frames[f].id);

    // Barrel
    fillRect(cel, doc, 8, 10, 10, 3, f === 3 ? '#3b5dc9' : '#8b9bb4');
    // Wooden Stock
    fillRect(cel, doc, 5, 11, 5, 5, '#733e39');
    pixel(cel, doc, 4, 15, '#733e39'); // Grip
    // Trigger & Flint
    pixel(cel, doc, 9, 13, '#1a1c2c');
    pixel(cel, doc, 8, 9, '#fee761');

    if (f === 3) {
      // Plasma glow muzzle
      pixel(celGlow, doc, 18, 11, '#73eff7');
    }
  }
}

// 8. Belati & Senjata Lempar (4 frames)
function buildDaggers(doc, layerWeapon, layerGlow) {
  for (let f = 0; f < 4; f++) {
    const cel = doc.ensureCel(layerWeapon.id, doc.frames[f].id);
    const celGlow = doc.ensureCel(layerGlow.id, doc.frames[f].id);

    if (f === 1) {
      // 4-Point Shuriken
      fillRect(cel, doc, 10, 10, 4, 4, '#8b9bb4');
      pixel(cel, doc, 11, 7, '#c0cbdc');
      pixel(cel, doc, 11, 16, '#c0cbdc');
      pixel(cel, doc, 7, 11, '#c0cbdc');
      pixel(cel, doc, 16, 11, '#c0cbdc');
      pixel(celGlow, doc, 12, 12, '#ffffff');
    } else {
      // Curved Dagger with poison
      for (let i = 0; i < 8; i++) pixel(cel, doc, 7 + i, 16 - i, '#c0cbdc');
      pixel(cel, doc, 6, 17, '#733e39');
      pixel(celGlow, doc, 14, 9, '#a7f070'); // Poison shine
    }
  }
}

// 9. Sabit Maut & Cakar (4 frames, 32x32)
function buildScythes(doc, layerWeapon, layerGlow) {
  for (let f = 0; f < 4; f++) {
    const cel = doc.ensureCel(layerWeapon.id, doc.frames[f].id);
    const celGlow = doc.ensureCel(layerGlow.id, doc.frames[f].id);

    // Long Staff
    fillRect(cel, doc, 22, 6, 2, 22, '#3e2731');
    // Massive Curved Blade
    for (let c = 0; c < 12; c++) {
      pixel(cel, doc, 21 - c, 6 + Math.floor(c * 0.5), '#8b9bb4');
      pixel(cel, doc, 21 - c, 5 + Math.floor(c * 0.5), '#1a1c2c');
    }
    pixel(celGlow, doc, 10, 11, '#73eff7'); // Gleam
  }
}

// 10. Tongkat Peri & Orbs (4 frames)
function buildWands(doc, layerWeapon, layerGlow) {
  for (let f = 0; f < 4; f++) {
    const cel = doc.ensureCel(layerWeapon.id, doc.frames[f].id);
    const celGlow = doc.ensureCel(layerGlow.id, doc.frames[f].id);

    // Slim Silver Wand
    fillRect(cel, doc, 7, 15, 8, 2, '#f4f4f4');
    // Star Head
    pixel(cel, doc, 15, 15, '#fee761');
    pixel(cel, doc, 16, 14, '#fee761');
    pixel(cel, doc, 16, 16, '#fee761');
    pixel(cel, doc, 17, 15, '#fee761');
    // Magic twinkle
    pixel(celGlow, doc, 18, 14, '#ffffff');
  }
}

