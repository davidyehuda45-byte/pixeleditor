import { fillRect, pixel, outlineRect, drawMatrix } from './helpers.js';

export function buildUiTemplate(doc, id) {
  const layerBg = doc.layers[0];
  layerBg.name = 'Bingkai UI (Frame/9-Slice)';
  const layerContent = doc.addLayer({ name: 'Isi & Teks (Content/Bar)' });

  if (id === 'ui-dialog') buildDialogBox(doc, layerBg, layerContent);
  else if (id === 'ui-healthbar') buildHealthBar(doc, layerBg, layerContent);
  else if (id === 'ui-inventory') buildInventorySlot(doc, layerBg, layerContent);
  else if (id === 'ui-buttons') buildButtons(doc, layerBg, layerContent);
  else if (id === 'ui-radar') buildRadar(doc, layerBg, layerContent);
  else if (id === 'ui-tooltip') buildTooltip(doc, layerBg, layerContent);
  else if (id === 'ui-hearts') buildHearts(doc, layerBg, layerContent);
  else if (id === 'ui-xp-gauge') buildXpGauge(doc, layerBg, layerContent);
  else buildDialogBox(doc, layerBg, layerContent);
}

// 1. Kotak Dialog RPG (48x48 9-slice)
function buildDialogBox(doc, layerBg, layerContent) {
  const cB = doc.ensureCel(layerBg.id, doc.frames[0].id);
  const cC = doc.ensureCel(layerContent.id, doc.frames[0].id);

  doc.slices = [
    { name: 'dialog_frame', frames: [{ frame: 0, rect: [0, 0, 48, 48], pivot: [24, 24], center: [8, 8, 32, 32] }] },
  ];

  // Dark Royal Blue Velvet Interior
  fillRect(cB, doc, 2, 2, 44, 44, '#1a1c2c');
  fillRect(cB, doc, 4, 4, 40, 40, '#262b44');

  // Gold Filigree Border
  outlineRect(cB, doc, 0, 0, 48, 48, '#fee761');
  outlineRect(cB, doc, 2, 2, 44, 44, '#e4a672');

  // Corner Diamond Gems
  pixel(cC, doc, 3, 3, '#ffffff');
  pixel(cC, doc, 44, 3, '#ffffff');
  pixel(cC, doc, 3, 44, '#ffffff');
  pixel(cC, doc, 44, 44, '#ffffff');
}

// 2. Bar Nyawa & Mana (64x16, 2 frames: Full HP vs Low HP)
function buildHealthBar(doc, layerBg, layerContent) {
  doc.tags = [{ name: 'state', from: 0, to: 1, direction: 'forward', repeat: 0 }];
  for (let f = 0; f < 2; f++) {
    const c0 = doc.ensureCel(layerBg.id, doc.frames[f].id);
    const c1 = doc.ensureCel(layerContent.id, doc.frames[f].id);

    // Outer Dark Metal Bezel
    fillRect(c0, doc, 0, 0, 64, 16, '#333f58');
    fillRect(c0, doc, 2, 2, 60, 12, '#181425');
    outlineRect(c0, doc, 0, 0, 64, 16, '#8b9bb4');

    // HP Red Fill Level
    const hpWidth = f === 0 ? 56 : 18;
    fillRect(c1, doc, 4, 4, hpWidth, 8, '#b13e53');
    fillRect(c1, doc, 4, 4, hpWidth, 2, '#ef7d57'); // Specular highlight
    pixel(c1, doc, 5, 5, '#ffffff');
  }
}

// 3. Slot Inventaris (24x24, 3 frames: Normal, Selected, Locked)
function buildInventorySlot(doc, layerBg, layerContent) {
  doc.tags = [{ name: 'state', from: 0, to: 2, direction: 'forward', repeat: 0 }];
  for (let f = 0; f < 3; f++) {
    const c0 = doc.ensureCel(layerBg.id, doc.frames[f].id);
    const c1 = doc.ensureCel(layerContent.id, doc.frames[f].id);

    // Beveled Container Slot
    fillRect(c0, doc, 2, 2, 20, 20, '#262b44');
    const borderColor = f === 1 ? '#fee761' : '#566c86';
    outlineRect(c0, doc, 0, 0, 24, 24, borderColor);

    if (f === 2) {
      // Locked Padlock Icon
      fillRect(c1, doc, 9, 11, 6, 6, '#e4a672');
      outlineRect(c1, doc, 10, 8, 4, 4, '#8b9bb4');
      pixel(c1, doc, 11, 13, '#181425'); // Keyhole
    }
  }
}

// 4. Tombol Aksi Retro (48x20, 3 frames: Normal, Hover, Pressed)
function buildButtons(doc, layerBg, layerContent) {
  doc.tags = [{ name: 'button', from: 0, to: 2, direction: 'forward', repeat: 0 }];
  for (let f = 0; f < 3; f++) {
    const c0 = doc.ensureCel(layerBg.id, doc.frames[f].id);
    const c1 = doc.ensureCel(layerContent.id, doc.frames[f].id);

    const btnBg = f === 0 ? '#3b5dc9' : f === 1 ? '#41a6f6' : '#262b44';
    fillRect(c0, doc, 1, 1, 46, 18, btnBg);
    outlineRect(c0, doc, 0, 0, 48, 20, '#181425');

    // Bevel top highlight / bottom shadow
    if (f !== 2) {
      fillRect(c1, doc, 2, 2, 44, 2, '#ffffff');
      fillRect(c1, doc, 2, 16, 44, 2, '#181425');
    } else {
      // Pressed state (inverted shadow)
      fillRect(c1, doc, 2, 2, 44, 2, '#181425');
    }
  }
}

// 5. Bingkai Radar & Kompas (48x48)
function buildRadar(doc, layerBg, layerContent) {
  const c0 = doc.ensureCel(layerBg.id, doc.frames[0].id);
  const c1 = doc.ensureCel(layerContent.id, doc.frames[0].id);

  // Round Outer Bezel
  outlineRect(c0, doc, 2, 2, 44, 44, '#fee761');
  outlineRect(c0, doc, 4, 4, 40, 40, '#566c86');
  fillRect(c0, doc, 5, 5, 38, 38, '#1a1c2c');

  // Crosshairs & Center Blip
  fillRect(c1, doc, 23, 6, 2, 36, '#262b44');
  fillRect(c1, doc, 6, 23, 36, 2, '#262b44');
  pixel(c1, doc, 23, 23, '#38b764'); // Player green blip
  pixel(c1, doc, 24, 23, '#38b764');
  pixel(c1, doc, 32, 14, '#b13e53'); // Enemy red blip
}

// 6. Kotak Info Tooltip (48x32 9-slice)
function buildTooltip(doc, layerBg, layerContent) {
  const c0 = doc.ensureCel(layerBg.id, doc.frames[0].id);
  const c1 = doc.ensureCel(layerContent.id, doc.frames[0].id);

  doc.slices = [
    { name: 'tooltip_frame', frames: [{ frame: 0, rect: [0, 0, 48, 26], pivot: [24, 32], center: [4, 4, 40, 18] }] },
  ];

  // Dark Tooltip Body
  fillRect(c0, doc, 1, 1, 46, 24, '#181425');
  outlineRect(c0, doc, 0, 0, 48, 26, '#8b9bb4');

  // Bottom Pointer Arrow
  pixel(c0, doc, 23, 26, '#8b9bb4');
  pixel(c0, doc, 24, 26, '#8b9bb4');
  pixel(c0, doc, 23, 27, '#8b9bb4');
  pixel(c0, doc, 24, 27, '#8b9bb4');
}

// 7. Indikator Hati Retro (48x16, 3 frames: Full, Half, Empty)
function buildHearts(doc, layerBg, layerContent) {
  doc.tags = [{ name: 'heart_state', from: 0, to: 2, direction: 'forward', repeat: 0 }];
  for (let f = 0; f < 3; f++) {
    const c0 = doc.ensureCel(layerBg.id, doc.frames[f].id);
    const c1 = doc.ensureCel(layerContent.id, doc.frames[f].id);

    // 3 Hearts placed at x=4, x=20, x=36
    for (let h = 0; h < 3; h++) {
      const hx = 4 + h * 16;
      // Heart Outline
      outlineRect(c0, doc, hx + 1, 2, 10, 10, '#181425');

      if (f === 0 || (f === 1 && h === 0)) {
        // Full Red Heart
        fillRect(c1, doc, hx + 2, 3, 8, 8, '#b13e53');
        pixel(c1, doc, hx + 3, 4, '#ffffff'); // Glint
      } else if (f === 1 && h === 1) {
        // Half Heart
        fillRect(c1, doc, hx + 2, 3, 4, 8, '#b13e53');
        pixel(c1, doc, hx + 3, 4, '#ffffff');
      }
    }
  }
}

// 8. Pengukur Level & XP (64x16, 2 frames)
function buildXpGauge(doc, layerBg, layerContent) {
  for (let f = 0; f < 2; f++) {
    const c0 = doc.ensureCel(layerBg.id, doc.frames[f].id);
    const c1 = doc.ensureCel(layerContent.id, doc.frames[f].id);

    // Beveled XP Rail
    fillRect(c0, doc, 2, 4, 60, 8, '#181425');
    outlineRect(c0, doc, 2, 4, 60, 8, '#566c86');

    // Cyan XP Fill
    const xpWidth = f === 0 ? 44 : 20;
    fillRect(c1, doc, 4, 6, xpWidth, 4, '#73eff7');
    fillRect(c1, doc, 4, 6, xpWidth, 1, '#ffffff');

    // Level Diamond in center
    fillRect(c1, doc, 29, 2, 6, 12, '#fee761');
    outlineRect(c1, doc, 29, 2, 6, 12, '#181425');
  }
}
