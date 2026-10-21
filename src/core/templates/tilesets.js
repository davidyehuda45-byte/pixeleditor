import { fillRect, pixel, outlineRect, drawMatrix } from './helpers.js';

export function buildTilesetTemplate(doc, id) {
  const layerFloor = doc.layers[0];
  layerFloor.name = 'Lantai Dasar (Floor/Terrain)';
  const layerWalls = doc.addLayer({ name: 'Dinding & Rintangan (Walls/Solids)' });
  const layerProps = doc.addLayer({ name: 'Dekorasi & Props (Decor)' });

  doc.grid = { x: 0, y: 0, w: 16, h: 16 };

  if (id === 'tile-dungeon') buildDungeonTiles(doc, layerFloor, layerWalls, layerProps);
  else if (id === 'tile-overworld') buildOverworldTiles(doc, layerFloor, layerWalls, layerProps);
  else if (id === 'tile-water') buildWaterTiles(doc, layerFloor, layerWalls, layerProps);
  else if (id === 'tile-desert') buildDesertTiles(doc, layerFloor, layerWalls, layerProps);
  else if (id === 'tile-snow') buildSnowTiles(doc, layerFloor, layerWalls, layerProps);
  else if (id === 'tile-scifi') buildScifiTiles(doc, layerFloor, layerWalls, layerProps);
  else if (id === 'tile-lava') buildLavaTiles(doc, layerFloor, layerWalls, layerProps);
  else if (id === 'tile-forest') buildForestTiles(doc, layerFloor, layerWalls, layerProps);
  else if (id === 'tile-castle') buildCastleTiles(doc, layerFloor, layerWalls, layerProps);
  else if (id === 'tile-graveyard') buildGraveyardTiles(doc, layerFloor, layerWalls, layerProps);
  else buildDungeonTiles(doc, layerFloor, layerWalls, layerProps);
}

// 1. Dungeon Batu Kuno (64x16: 4 tiles @ 16x16)
function buildDungeonTiles(doc, layerFloor, layerWalls, layerProps) {
  const cF = doc.ensureCel(layerFloor.id, doc.frames[0].id);
  const cW = doc.ensureCel(layerWalls.id, doc.frames[0].id);
  const cP = doc.ensureCel(layerProps.id, doc.frames[0].id);

  // Tile 0 (0..15): Stone Wall
  fillRect(cW, doc, 0, 0, 16, 16, '#566c86');
  fillRect(cW, doc, 1, 1, 14, 14, '#333f58');
  outlineRect(cW, doc, 0, 0, 16, 16, '#1a1c2c');
  // Mortar lines
  fillRect(cW, doc, 0, 5, 16, 1, '#1a1c2c');
  fillRect(cW, doc, 0, 10, 16, 1, '#1a1c2c');
  fillRect(cW, doc, 7, 0, 1, 5, '#1a1c2c');
  fillRect(cW, doc, 11, 5, 1, 5, '#1a1c2c');

  // Tile 1 (16..31): Stone Floor
  fillRect(cF, doc, 16, 0, 16, 16, '#94b0c2');
  fillRect(cF, doc, 17, 1, 14, 14, '#566c86');
  pixel(cF, doc, 20, 5, '#333f58');
  pixel(cF, doc, 27, 11, '#333f58');
  pixel(cF, doc, 22, 12, '#94b0c2');

  // Tile 2 (32..47): Spike Trap Hazard
  fillRect(cF, doc, 32, 0, 16, 16, '#566c86');
  for (let x = 35; x <= 45; x += 4) {
    for (let y = 3; y <= 12; y += 4) {
      pixel(cP, doc, x, y, '#f4f4f4'); // Steel spike point
      pixel(cP, doc, x, y + 1, '#94b0c2');
      pixel(cP, doc, x, y + 2, '#1a1c2c');
    }
  }

  // Tile 3 (48..63): Descent Stairs
  fillRect(cF, doc, 48, 0, 16, 16, '#566c86');
  for (let s = 0; s < 4; s++) {
    fillRect(cP, doc, 50, 2 + s * 3, 12, 2, '#262b44');
    fillRect(cP, doc, 50, 4 + s * 3, 12, 1, '#8b9bb4');
  }
}

// 2. Padang Rumput Hijau (Overworld 64x64)
function buildOverworldTiles(doc, layerFloor, layerWalls, layerProps) {
  const cF = doc.ensureCel(layerFloor.id, doc.frames[0].id);
  const cW = doc.ensureCel(layerWalls.id, doc.frames[0].id);
  const cP = doc.ensureCel(layerProps.id, doc.frames[0].id);

  // Base Lush Grass
  fillRect(cF, doc, 0, 0, 64, 64, '#38b764');
  // Grass blades tufts
  for (let y = 4; y < 60; y += 12) {
    for (let x = 4; x < 60; x += 12) {
      pixel(cF, doc, x, y, '#a7f070');
      pixel(cF, doc, x + 1, y - 1, '#a7f070');
      pixel(cF, doc, x, y + 1, '#257179');
    }
  }

  // Dirt Path in quadrant 2
  fillRect(cF, doc, 16, 0, 16, 64, '#e4a672');
  fillRect(cF, doc, 0, 16, 64, 16, '#e4a672');

  // Natural Grey Boulder (32..48, 0..16)
  fillRect(cW, doc, 34, 2, 12, 12, '#8b9bb4');
  outlineRect(cW, doc, 34, 2, 12, 12, '#1a1c2c');
  pixel(cW, doc, 36, 4, '#ffffff');

  // Pine Tree (48..64, 32..48)
  fillRect(cP, doc, 54, 42, 4, 8, '#733e39'); // Trunk
  fillRect(cP, doc, 50, 34, 12, 8, '#257179'); // Foliage
  fillRect(cP, doc, 52, 28, 8, 6, '#38b764');
}

// 3. Pantai & Ombak Bergerak (Water 32x32, 3 frames waves)
function buildWaterTiles(doc, layerFloor, layerWalls, layerProps) {
  doc.tags = [{ name: 'wave', from: 0, to: 2, direction: 'forward', repeat: 0 }];
  for (let f = 0; f < 3; f++) {
    const cF = doc.ensureCel(layerFloor.id, doc.frames[f].id);
    const cP = doc.ensureCel(layerProps.id, doc.frames[f].id);

    // Golden Sand on top
    fillRect(cF, doc, 0, 0, 32, 12, '#fee761');
    fillRect(cF, doc, 0, 10, 32, 2, '#e4a672');

    // Deep Clear Water
    fillRect(cF, doc, 0, 12, 32, 20, '#41a6f6');
    fillRect(cF, doc, 0, 24, 32, 8, '#3b5dc9');

    // Animated Ocean Foam Ripple Lines
    const waveY = 12 + f * 2;
    for (let x = 0; x < 32; x += 4) {
      pixel(cP, doc, x + (f % 2), waveY, '#ffffff');
      pixel(cP, doc, x + 1 + (f % 2), waveY, '#73eff7');
    }
  }
}

// 4. Gurun Pasir & Reruntuhan (Desert 64x64)
function buildDesertTiles(doc, layerFloor, layerWalls, layerProps) {
  const cF = doc.ensureCel(layerFloor.id, doc.frames[0].id);
  const cW = doc.ensureCel(layerWalls.id, doc.frames[0].id);
  const cP = doc.ensureCel(layerProps.id, doc.frames[0].id);

  fillRect(cF, doc, 0, 0, 64, 64, '#fee761');
  // Sand dunes ripples
  for (let y = 6; y < 60; y += 14) {
    for (let x = 0; x < 64; x += 6) {
      pixel(cF, doc, x, y, '#e4a672');
    }
  }

  // Sandstone Pyramid Block (16x16)
  fillRect(cW, doc, 16, 16, 16, 16, '#e4a672');
  outlineRect(cW, doc, 16, 16, 16, 16, '#733e39');

  // Desert Saguaro Cactus (32..48, 16..32)
  fillRect(cP, doc, 38, 18, 4, 14, '#38b764');
  fillRect(cP, doc, 34, 22, 4, 6, '#38b764');
  fillRect(cP, doc, 42, 20, 4, 6, '#38b764');
}

// 5. Pegunungan Salju & Es (Snow 64x64)
function buildSnowTiles(doc, layerFloor, layerWalls, layerProps) {
  const cF = doc.ensureCel(layerFloor.id, doc.frames[0].id);
  const cW = doc.ensureCel(layerWalls.id, doc.frames[0].id);

  fillRect(cF, doc, 0, 0, 64, 64, '#ffffff');
  // Snowdrifts
  for (let y = 8; y < 60; y += 12) {
    for (let x = 2; x < 60; x += 10) {
      pixel(cF, doc, x, y, '#c0cbdc');
    }
  }

  // Slick Ice Lake (Tile 16..32, 16..32)
  fillRect(cF, doc, 16, 16, 16, 16, '#73eff7');
  outlineRect(cF, doc, 16, 16, 16, 16, '#41a6f6');
  pixel(cF, doc, 20, 20, '#ffffff');

  // Ice Wall (32..48, 16..32)
  fillRect(cW, doc, 32, 16, 16, 16, '#8b9bb4');
  outlineRect(cW, doc, 32, 16, 16, 16, '#333f58');
}

// 6. Pangkalan Sci-Fi (SciFi 64x64)
function buildScifiTiles(doc, layerFloor, layerWalls, layerProps) {
  const cF = doc.ensureCel(layerFloor.id, doc.frames[0].id);
  const cW = doc.ensureCel(layerWalls.id, doc.frames[0].id);

  // Steel Industrial Grate
  fillRect(cF, doc, 0, 0, 64, 64, '#333f58');
  for (let y = 0; y < 64; y += 4) {
    fillRect(cF, doc, 0, y, 64, 1, '#1a1c2c');
    fillRect(cF, doc, y, 0, 1, 64, '#1a1c2c');
  }

  // Yellow & Black Hazard Stripes (16x16)
  for (let s = 0; s < 16; s++) {
    const col = (s % 4 < 2) ? '#fee761' : '#181425';
    fillRect(cF, doc, 16 + s, 16, 1, 16, col);
  }

  // Metal Bulkhead Wall (32..48, 16..32)
  fillRect(cW, doc, 32, 16, 16, 16, '#566c86');
  outlineRect(cW, doc, 32, 16, 16, 16, '#181425');
  fillRect(cW, doc, 36, 20, 8, 8, '#73eff7'); // Glowing terminal
}

// 7. Gua Vulkanik & Lahar (Lava 32x32, 3 frames)
function buildLavaTiles(doc, layerFloor, layerWalls, layerProps) {
  doc.tags = [{ name: 'lava', from: 0, to: 2, direction: 'forward', repeat: 0 }];
  for (let f = 0; f < 3; f++) {
    const cF = doc.ensureCel(layerFloor.id, doc.frames[f].id);
    const cW = doc.ensureCel(layerWalls.id, doc.frames[f].id);

    // Black Basalt Rock
    fillRect(cW, doc, 0, 0, 32, 12, '#181425');
    fillRect(cW, doc, 0, 10, 32, 2, '#3e2731');

    // Molten Lava
    fillRect(cF, doc, 0, 12, 32, 20, '#b13e53');
    fillRect(cF, doc, 0, 16, 32, 12, '#ef7d57');
    // Lava bubbles
    const bubbleX = [8, 20, 14][f];
    pixel(cF, doc, bubbleX, 20, '#fee761');
    pixel(cF, doc, bubbleX, 19, '#ffffff');
  }
}

// 8. Hutan Lebat Berlumut (Forest 64x64)
function buildForestTiles(doc, layerFloor, layerWalls, layerProps) {
  const cF = doc.ensureCel(layerFloor.id, doc.frames[0].id);
  const cP = doc.ensureCel(layerProps.id, doc.frames[0].id);

  fillRect(cF, doc, 0, 0, 64, 64, '#257179');
  // Forest soil patches
  fillRect(cF, doc, 16, 16, 16, 16, '#733e39');

  // Spotted Red Mushrooms
  fillRect(cP, doc, 20, 24, 6, 4, '#b13e53');
  pixel(cP, doc, 21, 25, '#ffffff');
  pixel(cP, doc, 24, 25, '#ffffff');
  fillRect(cP, doc, 22, 28, 2, 3, '#f4f4f4'); // Stem
}

// 9. Aula Istana Megah (Castle 64x64)
function buildCastleTiles(doc, layerFloor, layerWalls, layerProps) {
  const cF = doc.ensureCel(layerFloor.id, doc.frames[0].id);
  const cW = doc.ensureCel(layerWalls.id, doc.frames[0].id);

  // Checkered Marble Floor (Black & White)
  for (let y = 0; y < 64; y += 8) {
    for (let x = 0; x < 64; x += 8) {
      const isWhite = (x / 8 + y / 8) % 2 === 0;
      fillRect(cF, doc, x, y, 8, 8, isWhite ? '#f4f4f4' : '#181425');
    }
  }

  // Red Velvet Carpet Runner in center
  fillRect(cF, doc, 24, 0, 16, 64, '#b13e53');
  fillRect(cF, doc, 23, 0, 1, 64, '#fee761'); // Gold trim
  fillRect(cF, doc, 40, 0, 1, 64, '#fee761');
}

// 10. Kuburan & Tanah Keramat (Graveyard 64x64)
function buildGraveyardTiles(doc, layerFloor, layerWalls, layerProps) {
  const cF = doc.ensureCel(layerFloor.id, doc.frames[0].id);
  const cP = doc.ensureCel(layerProps.id, doc.frames[0].id);

  fillRect(cF, doc, 0, 0, 64, 64, '#262b44');

  // Cracked Stone Tombstone (16x16)
  fillRect(cP, doc, 20, 20, 8, 12, '#8b9bb4');
  outlineRect(cP, doc, 20, 20, 8, 12, '#181425');
  fillRect(cP, doc, 18, 30, 12, 2, '#566c86'); // Base
  pixel(cP, doc, 23, 23, '#181425'); // Cross
  pixel(cP, doc, 24, 23, '#181425');
  pixel(cP, doc, 24, 24, '#181425');
}

