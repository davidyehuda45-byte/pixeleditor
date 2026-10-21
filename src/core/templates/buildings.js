import { fillRect, pixel, outlineRect, drawMatrix } from './helpers.js';

export function buildBuildingTemplate(doc, id) {
  const layerWall = doc.layers[0];
  layerWall.name = 'Struktur & Dinding (Walls)';
  const layerRoof = doc.addLayer({ name: 'Atap & Genteng (Roof)' });
  const layerDetails = doc.addLayer({ name: 'Pintu, Jendela & Props (Details)' });

  if (id === 'bldg-cottage') buildCottage(doc, layerWall, layerRoof, layerDetails);
  else if (id === 'bldg-tower') buildCastleTower(doc, layerWall, layerRoof, layerDetails);
  else if (id === 'bldg-blacksmith') buildBlacksmith(doc, layerWall, layerRoof, layerDetails);
  else if (id === 'bldg-tavern') buildTavern(doc, layerWall, layerRoof, layerDetails);
  else if (id === 'bldg-wizard-tower') buildWizardTower(doc, layerWall, layerRoof, layerDetails);
  else if (id === 'bldg-windmill') buildWindmill(doc, layerWall, layerRoof, layerDetails);
  else if (id === 'bldg-dungeon-gate') buildDungeonGate(doc, layerWall, layerRoof, layerDetails);
  else if (id === 'bldg-shrine') buildShrine(doc, layerWall, layerRoof, layerDetails);
  else if (id === 'bldg-shop') buildShop(doc, layerWall, layerRoof, layerDetails);
  else if (id === 'bldg-mine-entrance') buildMineEntrance(doc, layerWall, layerRoof, layerDetails);
  else buildCottage(doc, layerWall, layerRoof, layerDetails);
}

// 1. Rumah Pondok Pedesaan (Cottage 64x64)
function buildCottage(doc, layerWall, layerRoof, layerDetails) {
  const cW = doc.ensureCel(layerWall.id, doc.frames[0].id);
  const cR = doc.ensureCel(layerRoof.id, doc.frames[0].id);
  const cD = doc.ensureCel(layerDetails.id, doc.frames[0].id);

  // Stone Walls & Foundation
  fillRect(cW, doc, 10, 24, 44, 36, '#566c86');
  outlineRect(cW, doc, 10, 24, 44, 36, '#1a1c2c');
  // Stone brick pattern lines
  for (let y = 30; y < 56; y += 6) {
    fillRect(cW, doc, 12, y, 40, 1, '#333f58');
    for (let x = 12 + (y % 12); x < 50; x += 12) {
      fillRect(cW, doc, x, y - 5, 1, 5, '#333f58');
    }
  }

  // Brick Chimney
  fillRect(cW, doc, 44, 6, 8, 18, '#b13e53');
  outlineRect(cW, doc, 44, 6, 8, 18, '#1a1c2c');
  fillRect(cW, doc, 43, 4, 10, 3, '#733e39'); // Rim
  // Smoke puff
  pixel(cD, doc, 47, 2, '#94b0c2');
  pixel(cD, doc, 48, 1, '#ffffff');

  // Slanted Wood Shingle Roof
  for (let r = 0; r < 18; r++) {
    fillRect(cR, doc, 6 + r * 2, 24 - r, 52 - r * 4, 2, '#733e39');
    fillRect(cR, doc, 7 + r * 2, 25 - r, 50 - r * 4, 1, '#ef7d57');
  }

  // Wooden Arched Door with Gold Handle
  fillRect(cD, doc, 26, 40, 12, 20, '#5d275d');
  fillRect(cD, doc, 27, 41, 10, 18, '#262b44');
  pixel(cD, doc, 35, 50, '#ffec27'); // Brass doorknob
  // Door arch
  fillRect(cD, doc, 28, 38, 8, 3, '#1a1c2c');

  // Cozy Glowing Mullioned Windows
  const drawWindow = (wx, wy) => {
    fillRect(cD, doc, wx, wy, 10, 10, '#ffcd75');
    outlineRect(cD, doc, wx, wy, 10, 10, '#333f58');
    fillRect(cD, doc, wx + 4, wy, 2, 10, '#333f58'); // Crossbars
    fillRect(cD, doc, wx, wy + 4, 10, 2, '#333f58');
    pixel(cD, doc, wx + 2, wy + 2, '#ffffff'); // Warm glow
  };
  drawWindow(14, 34);
  drawWindow(40, 34);
}

// 2. Menara Kastil Batu (Castle Tower 64x64, 2 frames flag)
function buildCastleTower(doc, layerWall, layerRoof, layerDetails) {
  doc.tags = [{ name: 'idle', from: 0, to: 1, direction: 'forward', repeat: 0 }];
  for (let f = 0; f < 2; f++) {
    const cW = doc.ensureCel(layerWall.id, doc.frames[f].id);
    const cR = doc.ensureCel(layerRoof.id, doc.frames[f].id);
    const cD = doc.ensureCel(layerDetails.id, doc.frames[f].id);

    // Sturdy Tower Column
    fillRect(cW, doc, 16, 16, 32, 46, '#566c86');
    outlineRect(cW, doc, 16, 16, 32, 46, '#1a1c2c');
    // Stone masonry texture
    for (let y = 22; y < 60; y += 8) {
      fillRect(cW, doc, 18, y, 28, 1, '#333f58');
    }

    // Defensive Parapets (Battlement Teeth)
    fillRect(cR, doc, 14, 10, 36, 6, '#333f58');
    for (let p = 0; p < 4; p++) {
      fillRect(cR, doc, 14 + p * 10, 5, 6, 6, '#333f58');
      fillRect(cR, doc, 15 + p * 10, 6, 4, 5, '#566c86');
    }

    // Iron Portcullis & Narrow Arrow Slits
    fillRect(cD, doc, 26, 44, 12, 18, '#1a1c2c');
    for (let i = 28; i <= 36; i += 2) fillRect(cD, doc, i, 45, 1, 17, '#94b0c2');
    // Arrow slits
    fillRect(cD, doc, 31, 22, 2, 8, '#1a1c2c');
    fillRect(cD, doc, 31, 33, 2, 8, '#1a1c2c');

    // Royal Banner Flapping in Wind
    fillRect(cD, doc, 31, 0, 2, 10, '#333f58'); // Flagpole
    fillRect(cD, doc, 33, f === 0 ? 0 : 1, 10, 6, '#b13e53');
    pixel(cD, doc, 37, (f === 0 ? 0 : 1) + 2, '#fee761'); // Crown crest
  }
}

// 3. Bengkel Pandai Besi (Blacksmith Forge 64x64, 2 frames fire)
function buildBlacksmith(doc, layerWall, layerRoof, layerDetails) {
  doc.tags = [{ name: 'forge', from: 0, to: 1, direction: 'pingpong', repeat: 0 }];
  for (let f = 0; f < 2; f++) {
    const cW = doc.ensureCel(layerWall.id, doc.frames[f].id);
    const cR = doc.ensureCel(layerRoof.id, doc.frames[f].id);
    const cD = doc.ensureCel(layerDetails.id, doc.frames[f].id);

    // Stone workshop building
    fillRect(cW, doc, 8, 26, 48, 34, '#566c86');
    outlineRect(cW, doc, 8, 26, 48, 34, '#1a1c2c');
    // Roof
    fillRect(cR, doc, 4, 16, 56, 11, '#733e39');
    outlineRect(cR, doc, 4, 16, 56, 11, '#1a1c2c');

    // Heavy Stone Chimney
    fillRect(cW, doc, 14, 4, 10, 22, '#333f58');
    // Open Forge Fire with Glowing Embers
    fillRect(cD, doc, 12, 38, 14, 18, '#1a1c2c');
    fillRect(cD, doc, 14, 46, 10, 8, f === 0 ? '#ef7d57' : '#ffec27');
    pixel(cD, doc, 18, 44, '#ffffff'); // Intense spark!

    // Steel Anvil on Wood Stump
    fillRect(cD, doc, 38, 48, 10, 10, '#733e39'); // Stump
    fillRect(cD, doc, 36, 42, 14, 6, '#8b9bb4'); // Anvil face
    fillRect(cD, doc, 34, 42, 3, 3, '#c0cbdc'); // Horn
    outlineRect(cD, doc, 36, 42, 14, 6, '#1a1c2c');

    // Weapon display rack
    fillRect(cD, doc, 32, 28, 20, 2, '#733e39');
    for (let s = 34; s <= 48; s += 4) {
      fillRect(cD, doc, s, 30, 2, 8, '#c0cbdc'); // Swords on wall
    }
  }
}

// 4. Kedai Tavern (Tavern 64x64, 2 frames lanterns)
function buildTavern(doc, layerWall, layerRoof, layerDetails) {
  for (let f = 0; f < 2; f++) {
    const cW = doc.ensureCel(layerWall.id, doc.frames[f].id);
    const cR = doc.ensureCel(layerRoof.id, doc.frames[f].id);
    const cD = doc.ensureCel(layerDetails.id, doc.frames[f].id);

    // Half-timbered structure (White plaster with brown timber beams)
    fillRect(cW, doc, 8, 22, 48, 38, '#ffcd75');
    outlineRect(cW, doc, 8, 22, 48, 38, '#1a1c2c');
    // Timber frame beams
    fillRect(cW, doc, 8, 22, 48, 3, '#733e39');
    fillRect(cW, doc, 8, 40, 48, 3, '#733e39');
    fillRect(cW, doc, 8, 22, 3, 38, '#733e39');
    fillRect(cW, doc, 53, 22, 3, 38, '#733e39');
    fillRect(cW, doc, 30, 22, 3, 38, '#733e39');

    // Gabled Roof
    fillRect(cR, doc, 4, 10, 56, 13, '#b13e53');
    outlineRect(cR, doc, 4, 10, 56, 13, '#1a1c2c');

    // Double Tavern Doors
    fillRect(cD, doc, 25, 42, 14, 18, '#733e39');
    outlineRect(cD, doc, 25, 42, 14, 18, '#1a1c2c');

    // Swinging Wooden Sign with Foaming Beer Mug
    fillRect(cD, doc, 44, 28, 8, 2, '#333f58'); // Iron bracket
    fillRect(cD, doc, 46, 30, 8, 8, '#e4a672'); // Sign
    outlineRect(cD, doc, 46, 30, 8, 8, '#733e39');
    pixel(cD, doc, 49, 32, '#fee761'); // Beer
    pixel(cD, doc, 49, 31, '#ffffff'); // Foam

    // Glowing Lantern on porch
    pixel(cD, doc, 20, 38, '#fee761');
    pixel(cD, doc, 20, 39, f === 0 ? '#ffffff' : '#ef7d57');
  }
}

// 5. Menara Penyihir Astrologi (Wizard Tower 64x64, 4 frames glowing crystal)
function buildWizardTower(doc, layerWall, layerRoof, layerDetails) {
  doc.tags = [{ name: 'pulse', from: 0, to: 3, direction: 'forward', repeat: 0 }];
  for (let f = 0; f < 4; f++) {
    const cW = doc.ensureCel(layerWall.id, doc.frames[f].id);
    const cR = doc.ensureCel(layerRoof.id, doc.frames[f].id);
    const cD = doc.ensureCel(layerDetails.id, doc.frames[f].id);

    // Tall Slender Spire
    fillRect(cW, doc, 20, 16, 24, 46, '#333f58');
    outlineRect(cW, doc, 20, 16, 24, 46, '#181425');
    // Magical rune spiral
    for (let r = 0; r < 4; r++) {
      pixel(cW, doc, 22 + r * 5, 20 + r * 9, '#73eff7');
    }

    // Pointed Wizard Spire Cone
    for (let h = 0; h < 14; h++) {
      fillRect(cR, doc, 32 - h, 16 - h, h * 2, 2, '#5d275d');
    }

    // Floating Glowing Astral Crystal on Peak
    const cryY = 2 + (f % 2 === 0 ? 0 : 1);
    fillRect(cD, doc, 30, cryY, 4, 5, '#73eff7');
    pixel(cD, doc, 31, cryY + 1, '#ffffff'); // Crystal core
    // Magic sparks orbiting
    const sx = [28, 35, 31, 29][f], sy = [cryY - 1, cryY + 2, cryY + 6, cryY + 1][f];
    pixel(cD, doc, sx, sy, '#fee761');

    // Gothic Arched Portal
    fillRect(cD, doc, 27, 46, 10, 16, '#181425');
    fillRect(cD, doc, 28, 47, 8, 14, '#5d275d');
  }
}

// 6. Kincir Angin (Windmill 64x64, 4 frames rotating sails)
function buildWindmill(doc, layerWall, layerRoof, layerDetails) {
  doc.tags = [{ name: 'spin', from: 0, to: 3, direction: 'forward', repeat: 0 }];
  for (let f = 0; f < 4; f++) {
    const cW = doc.ensureCel(layerWall.id, doc.frames[f].id);
    const cR = doc.ensureCel(layerRoof.id, doc.frames[f].id);
    const cD = doc.ensureCel(layerDetails.id, doc.frames[f].id);

    // Round Stone Mill Tower (tapered)
    for (let y = 20; y < 60; y++) {
      const w = 24 + Math.floor((y - 20) * 0.25);
      fillRect(cW, doc, 32 - Math.floor(w / 2), y, w, 1, '#8b9bb4');
    }
    outlineRect(cW, doc, 18, 20, 28, 40, '#1a1c2c');

    // Conical Wood Cap
    for (let r = 0; r < 8; r++) {
      fillRect(cR, doc, 24 + r, 20 - r, 16 - r * 2, 2, '#733e39');
    }

    // Center Sail Hub (32, 22)
    const cx = 32, cy = 22;
    fillRect(cD, doc, cx - 2, cy - 2, 5, 5, '#333f58');

    // 4 Animated Rotating Sail Blades
    const angles = [0, 45, 90, 135];
    const a = angles[f] * (Math.PI / 180);
    for (let b = 0; b < 4; b++) {
      const ang = a + (b * Math.PI) / 2;
      for (let len = 4; len < 18; len += 2) {
        const px = Math.round(cx + Math.cos(ang) * len);
        const py = Math.round(cy + Math.sin(ang) * len);
        fillRect(cD, doc, px - 1, py - 1, 2, 2, '#ffffff'); // White canvas sail
        pixel(cD, doc, px, py, '#733e39'); // Wood spar
      }
    }
  }
}

// 7. Gerbang Dungeon (Dungeon Gate 64x64, 2 frames chains)
function buildDungeonGate(doc, layerWall, layerRoof, layerDetails) {
  doc.tags = [{ name: 'gate', from: 0, to: 1, direction: 'pingpong', repeat: 0 }];
  for (let f = 0; f < 2; f++) {
    const cW = doc.ensureCel(layerWall.id, doc.frames[f].id);
    const cR = doc.ensureCel(layerRoof.id, doc.frames[f].id);
    const cD = doc.ensureCel(layerDetails.id, doc.frames[f].id);

    // Ominous Rough Stone Arch
    fillRect(cW, doc, 8, 14, 48, 48, '#262b44');
    outlineRect(cW, doc, 8, 14, 48, 48, '#181425');
    // Inner Arch Opening
    fillRect(cW, doc, 18, 24, 28, 38, '#181425');

    // Skull Keystone
    fillRect(cR, doc, 28, 10, 8, 8, '#f4f4f4');
    outlineRect(cR, doc, 28, 10, 8, 8, '#181425');
    pixel(cR, doc, 30, 13, '#181425');
    pixel(cR, doc, 33, 13, '#181425');

    // Heavy Spiked Portcullis & Iron Chains
    const gateY = f === 0 ? 24 : 20;
    for (let gx = 20; gx <= 44; gx += 3) {
      fillRect(cD, doc, gx, gateY, 2, 38, '#8b9bb4');
      pixel(cD, doc, gx, gateY + 37, '#c0cbdc'); // Spike tip
    }
    fillRect(cD, doc, 18, gateY + 12, 28, 2, '#566c86');
    fillRect(cD, doc, 18, gateY + 26, 28, 2, '#566c86');

    // Hanging Torches with animated fire
    fillRect(cD, doc, 12, 32, 3, 6, '#733e39');
    pixel(cD, doc, 13, 30 + (f % 2), '#fee761');
    fillRect(cD, doc, 49, 32, 3, 6, '#733e39');
    pixel(cD, doc, 50, 30 + (f % 2), '#fee761');
  }
}

// 8. Kuil Kuno & Altar (Shrine 48x48)
function buildShrine(doc, layerWall, layerRoof, layerDetails) {
  const cW = doc.ensureCel(layerWall.id, doc.frames[0].id);
  const cR = doc.ensureCel(layerRoof.id, doc.frames[0].id);
  const cD = doc.ensureCel(layerDetails.id, doc.frames[0].id);

  // Stone Platform & Weathered Pillars
  fillRect(cW, doc, 4, 38, 40, 8, '#8b9bb4');
  outlineRect(cW, doc, 4, 38, 40, 8, '#181425');
  // 4 Greek-style ruined pillars
  for (let p = 0; p < 4; p++) {
    const px = 6 + p * 11;
    fillRect(cW, doc, px, 16, 4, 22, '#c0cbdc');
    outlineRect(cW, doc, px, 16, 4, 22, '#566c86');
  }

  // Classical Pediment Roof (Triangle)
  for (let r = 0; r < 8; r++) {
    fillRect(cR, doc, 4 + r * 2, 16 - r * 2, 40 - r * 4, 2, '#8b9bb4');
  }
  // Moss green creeping on stones
  pixel(cW, doc, 8, 36, '#38b764');
  pixel(cW, doc, 9, 37, '#38b764');

  // Glowing Sacred Rune Pedestal in Center
  fillRect(cD, doc, 21, 30, 6, 8, '#566c86');
  fillRect(cD, doc, 20, 28, 8, 2, '#8b9bb4');
  // Floating glowing rune tablet
  fillRect(cD, doc, 22, 22, 4, 5, '#73eff7');
  pixel(cD, doc, 23, 24, '#ffffff');
}

// 9. Toko Petualang (Shop 48x48)
function buildShop(doc, layerWall, layerRoof, layerDetails) {
  const cW = doc.ensureCel(layerWall.id, doc.frames[0].id);
  const cR = doc.ensureCel(layerRoof.id, doc.frames[0].id);
  const cD = doc.ensureCel(layerDetails.id, doc.frames[0].id);

  // Timber shop stall
  fillRect(cW, doc, 6, 20, 36, 26, '#733e39');
  outlineRect(cW, doc, 6, 20, 36, 26, '#181425');

  // Striped Canvas Awning (Red & White)
  for (let s = 0; s < 10; s++) {
    const col = s % 2 === 0 ? '#b13e53' : '#f4f4f4';
    fillRect(cR, doc, 4 + s * 4, 12, 4, 8, col);
  }
  fillRect(cR, doc, 4, 20, 40, 2, '#ef7d57'); // Scallop trim

  // Counter with Potions on Display
  fillRect(cD, doc, 8, 32, 32, 4, '#e4a672');
  // Bottles
  pixel(cD, doc, 12, 30, '#b13e53'); // Health
  pixel(cD, doc, 13, 30, '#b13e53');
  pixel(cD, doc, 18, 30, '#41a6f6'); // Mana
  pixel(cD, doc, 19, 30, '#41a6f6');
  pixel(cD, doc, 24, 30, '#a7f070'); // Stamina
  pixel(cD, doc, 25, 30, '#a7f070');
}

// 10. Pintu Tambang Gua (Mine Entrance 48x48)
function buildMineEntrance(doc, layerWall, layerRoof, layerDetails) {
  const cW = doc.ensureCel(layerWall.id, doc.frames[0].id);
  const cR = doc.ensureCel(layerRoof.id, doc.frames[0].id);
  const cD = doc.ensureCel(layerDetails.id, doc.frames[0].id);

  // Rocky Mountain Cave Opening
  fillRect(cW, doc, 4, 10, 40, 36, '#566c86');
  fillRect(cW, doc, 12, 18, 24, 28, '#181425'); // Dark abyss
  outlineRect(cW, doc, 4, 10, 40, 36, '#1a1c2c');

  // Heavy Timber Support Beams
  fillRect(cR, doc, 10, 16, 4, 30, '#733e39');
  fillRect(cR, doc, 34, 16, 4, 30, '#733e39');
  fillRect(cR, doc, 8, 14, 32, 4, '#733e39');

  // Minecart Railway Tracks
  for (let r = 20; r <= 28; r += 2) {
    fillRect(cD, doc, 12, 44, 24, 2, '#333f58');
  }
  fillRect(cD, doc, 18, 38, 2, 10, '#8b9bb4'); // Steel rail
  fillRect(cD, doc, 28, 38, 2, 10, '#8b9bb4');

  // Hanging Miner Lantern
  pixel(cD, doc, 13, 20, '#fee761');
  pixel(cD, doc, 13, 21, '#ffffff');
}

