import { fillRect, pixel, outlineRect, drawMatrix } from './helpers.js';

export function buildFxTemplate(doc, id) {
  const layerCore = doc.layers[0];
  layerCore.name = 'Inti FX (Core Flame/Energy)';
  const layerGlow = doc.addLayer({ name: 'Pendar Luar & Partikel (Outer Glow)' });

  doc.tags = [{ name: 'play', from: 0, to: doc.frames.length - 1, direction: 'forward', repeat: 1 }];

  if (id === 'fx-explosion') buildExplosion(doc, layerCore, layerGlow);
  else if (id === 'fx-slash') buildSlash(doc, layerCore, layerGlow);
  else if (id === 'fx-fireball') buildFireball(doc, layerCore, layerGlow);
  else if (id === 'fx-lightning') buildLightning(doc, layerCore, layerGlow);
  else if (id === 'fx-splash') buildSplash(doc, layerCore, layerGlow);
  else if (id === 'fx-poison') buildPoisonCloud(doc, layerCore, layerGlow);
  else if (id === 'fx-holy') buildHolyLight(doc, layerCore, layerGlow);
  else if (id === 'fx-ice') buildIceBlast(doc, layerCore, layerGlow);
  else buildExplosion(doc, layerCore, layerGlow);
}

// 1. Ledakan Bom (6 frames, 32x32)
function buildExplosion(doc, layerCore, layerGlow) {
  const stages = [3, 7, 12, 14, 10, 6];
  const cx = 16, cy = 16;

  for (let f = 0; f < 6; f++) {
    const cC = doc.ensureCel(layerCore.id, doc.frames[f].id);
    const cG = doc.ensureCel(layerGlow.id, doc.frames[f].id);
    const r = stages[f];

    // Core Yellow / White
    const coreColor = f < 3 ? '#ffffff' : f < 5 ? '#fee761' : '#8b9bb4';
    fillRect(cC, doc, cx - Math.floor(r / 2), cy - Math.floor(r / 2), r, r, coreColor);

    // Outer Orange Fire & Red Rim
    outlineRect(cG, doc, cx - Math.floor(r / 2) - 2, cy - Math.floor(r / 2) - 2, r + 4, r + 4, '#ef7d57');
    outlineRect(cG, doc, cx - Math.floor(r / 2) - 3, cy - Math.floor(r / 2) - 3, r + 6, r + 6, '#b13e53');

    // Flying Smoke Particles
    if (f >= 3) {
      pixel(cG, doc, cx - r - 2, cy - r, '#566c86');
      pixel(cG, doc, cx + r + 2, cy - r + 1, '#566c86');
      pixel(cG, doc, cx + r, cy + r + 2, '#333f58');
      pixel(cG, doc, cx - r - 1, cy + r + 1, '#333f58');
    }
  }
}

// 2. Tebasan Energi Pedang (4 frames, 32x32)
function buildSlash(doc, layerCore, layerGlow) {
  for (let f = 0; f < 4; f++) {
    const cC = doc.ensureCel(layerCore.id, doc.frames[f].id);
    const cG = doc.ensureCel(layerGlow.id, doc.frames[f].id);

    // Crescent Arc Sweep
    for (let i = 0; i < 16; i++) {
      const sx = 4 + i + f * 2;
      const sy = Math.round(16 + Math.sin((i / 16) * Math.PI) * (f === 1 ? -10 : -8));
      pixel(cC, doc, sx, sy, '#ffffff'); // White core
      pixel(cG, doc, sx, sy - 1, '#73eff7'); // Cyan glow
      pixel(cG, doc, sx, sy + 1, '#41a6f6');
    }
  }
}

// 3. Bola Api Meluncur (4 frames, 32x32)
function buildFireball(doc, layerCore, layerGlow) {
  for (let f = 0; f < 4; f++) {
    const cC = doc.ensureCel(layerCore.id, doc.frames[f].id);
    const cG = doc.ensureCel(layerGlow.id, doc.frames[f].id);

    const headX = 22, headY = 16;
    // Flaming Core
    fillRect(cC, doc, headX - 3, headY - 3, 6, 6, '#fee761');
    pixel(cC, doc, headX - 1, headY - 1, '#ffffff');

    // Outer Flame Tongue trailing to the left
    fillRect(cG, doc, headX - 5, headY - 4, 8, 8, '#ef7d57');
    outlineRect(cG, doc, headX - 5, headY - 4, 8, 8, '#b13e53');

    // Trailing Flame Tail
    for (let t = 0; t < 10; t++) {
      const wave = Math.sin((t + f * 2) * 0.8) * 2;
      pixel(cG, doc, headX - 5 - t, Math.round(headY + wave), '#ef7d57');
      pixel(cG, doc, headX - 6 - t, Math.round(headY + wave + 1), '#b13e53');
    }
  }
}

// 4. Sambaran Petir Bercabang (4 frames, 32x32)
function buildLightning(doc, layerCore, layerGlow) {
  for (let f = 0; f < 4; f++) {
    const cC = doc.ensureCel(layerCore.id, doc.frames[f].id);
    const cG = doc.ensureCel(layerGlow.id, doc.frames[f].id);

    let lx = 16;
    for (let y = 2; y < 30; y++) {
      if (y % 4 === 0) lx += (f % 2 === 0 ? 2 : -2);
      pixel(cC, doc, lx, y, '#ffffff');
      pixel(cG, doc, lx - 1, y, '#73eff7');
      pixel(cG, doc, lx + 1, y, '#41a6f6');

      // Fork branch
      if (y === 14) {
        pixel(cG, doc, lx + 3, y + 1, '#73eff7');
        pixel(cG, doc, lx + 5, y + 2, '#41a6f6');
      }
    }
  }
}

// 5. Percikan Air (4 frames, 32x32)
function buildSplash(doc, layerCore, layerGlow) {
  for (let f = 0; f < 4; f++) {
    const cC = doc.ensureCel(layerCore.id, doc.frames[f].id);
    const cG = doc.ensureCel(layerGlow.id, doc.frames[f].id);

    // Water pool base
    fillRect(cG, doc, 6, 26, 20, 2, '#41a6f6');

    // Cresting droplets flying up
    const dropHeight = [18, 12, 8, 22][f];
    pixel(cC, doc, 16, dropHeight, '#ffffff');
    pixel(cG, doc, 16, dropHeight + 1, '#73eff7');
    pixel(cC, doc, 12, dropHeight + 3, '#73eff7');
    pixel(cC, doc, 20, dropHeight + 3, '#73eff7');
  }
}

// 6. Awan Asap Racun (4 frames, 32x32)
function buildPoisonCloud(doc, layerCore, layerGlow) {
  for (let f = 0; f < 4; f++) {
    const cC = doc.ensureCel(layerCore.id, doc.frames[f].id);
    const cG = doc.ensureCel(layerGlow.id, doc.frames[f].id);

    const cx = 16, cy = 16;
    // Toxic Green Cloud Puffs
    fillRect(cC, doc, cx - 6, cy - 6, 12, 12, '#38b764');
    outlineRect(cG, doc, cx - 8, cy - 8, 16, 16, '#257179');

    // Poison Bubbles popping
    const bx = [12, 19, 14, 18][f], by = [13, 15, 18, 12][f];
    pixel(cC, doc, bx, by, '#a7f070');
    pixel(cC, doc, bx, by - 1, '#ffffff');
  }
}

// 7. Sinar Cahaya Suci (4 frames, 32x32)
function buildHolyLight(doc, layerCore, layerGlow) {
  for (let f = 0; f < 4; f++) {
    const cC = doc.ensureCel(layerCore.id, doc.frames[f].id);
    const cG = doc.ensureCel(layerGlow.id, doc.frames[f].id);

    // Vertical Golden Beam
    fillRect(cC, doc, 14, 0, 4, 32, '#ffffff');
    fillRect(cG, doc, 12, 0, 8, 32, '#fee761');

    // Floating angel motes
    const my = [6, 16, 24, 10][f];
    pixel(cC, doc, 10, my, '#ffffff');
    pixel(cC, doc, 22, my + 4, '#ffffff');
  }
}

// 8. Ledakan Es Kristal (4 frames, 32x32)
function buildIceBlast(doc, layerCore, layerGlow) {
  for (let f = 0; f < 4; f++) {
    const cC = doc.ensureCel(layerCore.id, doc.frames[f].id);
    const cG = doc.ensureCel(layerGlow.id, doc.frames[f].id);

    const spread = f * 3;
    const cx = 16, cy = 16;
    // 4 Crystal Spikes expanding diagonally
    pixel(cC, doc, cx - spread, cy - spread, '#ffffff');
    pixel(cG, doc, cx - spread + 1, cy - spread + 1, '#73eff7');

    pixel(cC, doc, cx + spread, cy - spread, '#ffffff');
    pixel(cG, doc, cx + spread - 1, cy - spread + 1, '#73eff7');

    pixel(cC, doc, cx - spread, cy + spread, '#ffffff');
    pixel(cG, doc, cx - spread + 1, cy + spread - 1, '#73eff7');

    pixel(cC, doc, cx + spread, cy + spread, '#ffffff');
    pixel(cG, doc, cx + spread - 1, cy + spread - 1, '#73eff7');
  }
}
