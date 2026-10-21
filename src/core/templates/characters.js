import { fillRect, pixel, outlineRect, drawMatrix } from './helpers.js';

export function buildCharacterTemplate(doc, id) {
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
  if (id === 'char-ghost') {
    buildGhostCharacter(doc, layerBody, layerFx);
    return;
  }
  if (id === 'char-dragon') {
    buildDragonCharacter(doc, layerBody, layerArmor, layerFx);
    return;
  }

  // Humanoids: 32x32 standard
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
  else if (id === 'char-paladin') buildPaladinCharacter(doc, layerBody, layerArmor, layerFx);
  else if (id === 'char-necromancer') buildNecromancerCharacter(doc, layerBody, layerArmor, layerFx);
  else if (id === 'char-skeleton') buildSkeletonCharacter(doc, layerBody, layerArmor, layerFx);
  else if (id === 'char-goblin') buildGoblinCharacter(doc, layerBody, layerArmor, layerFx);
  else if (id === 'char-orc') buildOrcCharacter(doc, layerBody, layerArmor, layerFx);
  else if (id === 'char-mannequin') buildMannequinCharacter(doc, layerBody, layerArmor, layerFx);
  else buildKnightCharacter(doc, layerBody, layerArmor, layerFx);
}

// 1. Ksatria (Knight)
export function buildKnightCharacter(doc, layerBody, layerArmor, layerFx) {
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

    pixel(cB, doc, 9, 16 + bob, '#8b9bb4');
    pixel(cB, doc, 9, 17 + bob, '#566c86');
    pixel(cB, doc, 22, 16 + bob, '#8b9bb4');
    pixel(cB, doc, 22, 17 + bob, '#566c86');

    const legLeftX = 11 - legStep;
    const legRightX = 17 + legStep;
    const footLift = f === 1 ? -1 : 0;
    fillRect(cB, doc, legLeftX, 22 + bob, 3, 4, '#566c86');
    fillRect(cB, doc, legLeftX - 1, 26 + bob, 4, 2, '#8b9bb4');
    outlineRect(cB, doc, legLeftX - 1, 26 + bob, 4, 2, '#1a1c2c');
    fillRect(cB, doc, legRightX, 22 + bob + footLift, 3, 4, '#8b9bb4');
    fillRect(cB, doc, legRightX, 26 + bob + footLift, 4, 2, '#c0cbdc');
    outlineRect(cB, doc, legRightX, 26 + bob + footLift, 4, 2, '#1a1c2c');

    const plumeRows = [
      `  ${f === 1 ? '#rr' : '#RR'}#   `,
      ` #rr${f === 3 ? 'r' : 'R'}r#  `,
      `#RRRr#  `,
      ` #RR#   `,
    ];
    drawMatrix(cA, doc, 8, 2 + bob, plumeRows, K_PAL);

    pixel(cA, doc, 15, 9 + bob, '#fee761');
    pixel(cA, doc, 16, 9 + bob, '#fee761');
    pixel(cA, doc, 15, 8 + bob, '#e4a672');
    pixel(cA, doc, 15, 10 + bob, '#e4a672');

    drawMatrix(cA, doc, 7, 13 + bob, [" ### ", "#SLL#", "#DD #"], K_PAL);
    drawMatrix(cA, doc, 20, 13 + bob, [" ### ", "#SLL#", "#DD #"], K_PAL);

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

    const capeW = f % 2 === 0 ? 0 : 1;
    fillRect(cA, doc, 8 - capeW, 15 + bob, 3, 8, '#b13e53');
    fillRect(cA, doc, 9 - capeW, 20 + bob, 2, 4, '#ef7d57');

    const swordBob = bob + (f === 1 ? -1 : 0);
    fillRect(cF, doc, 23, 7 + swordBob, 2, 10, '#c0cbdc');
    pixel(cF, doc, 23, 6 + swordBob, '#ffffff');
    pixel(cF, doc, 24, 7 + swordBob, '#ffffff');
    fillRect(cF, doc, 23, 17 + swordBob, 2, 1, '#566c86');
    fillRect(cF, doc, 21, 17 + swordBob, 6, 2, '#e4a672');
    pixel(cF, doc, 23, 17 + swordBob, '#fee761');
    fillRect(cF, doc, 23, 19 + swordBob, 2, 3, '#733e39');
    fillRect(cF, doc, 23, 22 + swordBob, 2, 2, '#b13e53');

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

// 2. Penyihir (Mage)
export function buildMageCharacter(doc, layerBody, layerArmor, layerFx) {
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
  };

  for (let f = 0; f < 4; f++) {
    const cB = doc.ensureCel(layerBody.id, doc.frames[f].id);
    const cA = doc.ensureCel(layerArmor.id, doc.frames[f].id);
    const cF = doc.ensureCel(layerFx.id, doc.frames[f].id);
    const bob = f % 2 === 0 ? 0 : 1;
    const step = [0, 1, 0, -1][f];

    fillRect(cB, doc, 12, 8 + bob, 8, 5, '#ffcd75');
    pixel(cB, doc, 14, 9 + bob, '#1a1c2c');
    pixel(cB, doc, 17, 9 + bob, '#1a1c2c');
    pixel(cB, doc, 14, 8 + bob, '#ffffff');
    pixel(cB, doc, 17, 8 + bob, '#ffffff');

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

    fillRect(cB, doc, 11 - step, 27 + bob, 4, 2, '#733e39');
    fillRect(cB, doc, 17 + step, 27 + bob, 4, 2, '#733e39');

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

    const staffBob = bob + (f === 1 ? -1 : 0);
    fillRect(cF, doc, 24, 8 + staffBob, 2, 19, '#733e39');
    fillRect(cF, doc, 25, 9 + staffBob, 1, 17, '#a2583e');
    pixel(cF, doc, 22, 6 + staffBob, '#e4a672');
    pixel(cF, doc, 23, 7 + staffBob, '#e4a672');
    pixel(cF, doc, 26, 7 + staffBob, '#e4a672');
    pixel(cF, doc, 27, 6 + staffBob, '#e4a672');

    const orbOffsets = [[0, 0], [1, -1], [0, -1], [-1, 0]][f % 4];
    const ox = 24 + orbOffsets[0], oy = 4 + staffBob + orbOffsets[1];
    fillRect(cF, doc, ox - 1, oy - 1, 4, 4, '#73eff7');
    pixel(cF, doc, ox, oy, '#ffffff');
    const sparkX = [21, 28, 22, 27][f % 4];
    const sparkY = [3, 5, 2, 3][f % 4];
    pixel(cF, doc, sparkX, sparkY + staffBob, '#fee761');
  }
}

// 3. Pemanah (Archer)
export function buildArcherCharacter(doc, layerBody, layerArmor, layerFx) {
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

    fillRect(cB, doc, 12, 8 + bob, 8, 6, '#ffcd75');
    pixel(cB, doc, 14, 10 + bob, '#181425');
    pixel(cB, doc, 17, 10 + bob, '#181425');
    pixel(cB, doc, 18, 10 + bob, '#ffffff');
    pixel(cB, doc, 11, 10 + bob, '#ffcd75');
    pixel(cB, doc, 10, 9 + bob, '#ffcd75');

    const hair = [
      "  ####### ",
      " #hHHHHH# ",
      "#hHHHHHH# ",
      "#HHH######",
      "#HH#      ",
    ];
    drawMatrix(cB, doc, 10, 5 + bob, hair, A_PAL);

    fillRect(cB, doc, 11 - step, 24 + bob, 3, 4, '#733e39');
    fillRect(cB, doc, 10 - step, 27 + bob, 4, 2, '#a2583e');
    outlineRect(cB, doc, 10 - step, 27 + bob, 4, 2, '#181425');
    fillRect(cB, doc, 17 + step, 24 + bob, 3, 4, '#733e39');
    fillRect(cB, doc, 17 + step, 27 + bob, 4, 2, '#a2583e');
    outlineRect(cB, doc, 17 + step, 27 + bob, 4, 2, '#181425');

    const cap = [
      "    #RR#   ",
      "   #R##    ",
      "  #GGGGG#  ",
      " #GGGGGGG# ",
      "########## ",
    ];
    drawMatrix(cA, doc, 11, 2 + bob, cap, A_PAL);

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

    fillRect(cA, doc, 8, 11 + bob, 3, 9, '#733e39');
    pixel(cA, doc, 8, 9 + bob, '#ffffff');
    pixel(cA, doc, 9, 8 + bob, '#ffffff');
    pixel(cA, doc, 10, 9 + bob, '#ffffff');

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

// 4. Pembunuh Bayangan (Rogue)
export function buildRogueCharacter(doc, layerBody, layerArmor, layerFx) {
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

    fillRect(cB, doc, 12, 9 + bob, 8, 5, '#181425');
    fillRect(cB, doc, 13, 8 + bob, 6, 2, '#ffcd75');
    pixel(cB, doc, 14, 9 + bob, '#73eff7');
    pixel(cB, doc, 17, 9 + bob, '#73eff7');

    fillRect(cB, doc, 11 - step, 25 + bob, 3, 3, '#181425');
    fillRect(cB, doc, 10 - step, 27 + bob, 4, 1, '#262b44');
    fillRect(cB, doc, 17 + step, 25 + bob, 3, 3, '#181425');
    fillRect(cB, doc, 17 + step, 27 + bob, 4, 1, '#262b44');

    const hood = [
      "   #####   ",
      "  #CCCCC#  ",
      " #CcCCCC#  ",
      "#CcCCCCCC# ",
      "#CCCCCCCC# ",
    ];
    drawMatrix(cA, doc, 10, 4 + bob, hood, R_PAL);

    const scarfWave = f === 1 ? -1 : f === 3 ? 1 : 0;
    fillRect(cA, doc, 6, 13 + bob + scarfWave, 5, 2, '#3b5dc9');
    fillRect(cA, doc, 4, 14 + bob + scarfWave, 4, 2, '#262b44');

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

// 5. Paladin Suci (Paladin)
export function buildPaladinCharacter(doc, layerBody, layerArmor, layerFx) {
  const P_PAL = {
    '#': '#1a1c2c',
    'G': '#fee761', // Polished gold
    'g': '#e4a672',
    'W': '#ffffff', // Radiant shine
    'D': '#733e39',
    'B': '#41a6f6', // Sacred cyan-blue
    'b': '#3b5dc9',
    'K': '#ffcd75',
    'S': '#c0cbdc',
  };

  for (let f = 0; f < 4; f++) {
    const cB = doc.ensureCel(layerBody.id, doc.frames[f].id);
    const cA = doc.ensureCel(layerArmor.id, doc.frames[f].id);
    const cF = doc.ensureCel(layerFx.id, doc.frames[f].id);
    const bob = f % 2 === 0 ? 0 : 1;
    const step = [0, 1, 0, -1][f];

    // Head with Golden Halo Crest
    const head = [
      "   #WGGW#   ",
      "  #GGGGGG#  ",
      " #gGGGGGGg# ",
      " #gG#KK#Gg# ",
      " #gG#KK#Gg# ",
      "  #gGGGGg#  ",
      "   ######   ",
    ];
    drawMatrix(cB, doc, 10, 6 + bob, head, P_PAL);

    // Golden Boots
    const lX = 11 - step, rX = 17 + step;
    fillRect(cB, doc, lX, 23 + bob, 3, 5, '#e4a672');
    fillRect(cB, doc, lX - 1, 27 + bob, 4, 2, '#fee761');
    outlineRect(cB, doc, lX - 1, 27 + bob, 4, 2, '#1a1c2c');
    fillRect(cB, doc, rX, 23 + bob, 3, 5, '#e4a672');
    fillRect(cB, doc, rX, 27 + bob, 4, 2, '#fee761');
    outlineRect(cB, doc, rX, 27 + bob, 4, 2, '#1a1c2c');

    // Sacred White-Gold Breastplate & Blue Cape
    const plate = [
      "  ######  ",
      " #WGGGGW# ",
      "#WGBBBBGW#",
      "#gGBWWWBGg#",
      " #gGGGGg# ",
      " #BBBBBB# ",
      " #BBBBBB# ",
    ];
    drawMatrix(cA, doc, 11, 13 + bob, plate, P_PAL);
    // Pauldrons
    drawMatrix(cA, doc, 7, 13 + bob, ["###", "#GW#", "###"], P_PAL);
    drawMatrix(cA, doc, 21, 13 + bob, ["###", "#GW#", "###"], P_PAL);

    // Glowing Golden Warhammer & Sacred Tower Shield
    const hBob = bob + (f === 1 ? -1 : 0);
    // Warhammer
    fillRect(cF, doc, 24, 7 + hBob, 4, 4, '#fee761');
    outlineRect(cF, doc, 24, 7 + hBob, 4, 4, '#1a1c2c');
    pixel(cF, doc, 25, 8 + hBob, '#ffffff'); // Rune gleam
    fillRect(cF, doc, 23, 11 + hBob, 2, 13, '#733e39');
    // Tower Shield
    fillRect(cF, doc, 4, 12 + bob, 5, 12, '#41a6f6');
    outlineRect(cF, doc, 4, 12 + bob, 5, 12, '#fee761');
    pixel(cF, doc, 6, 16 + bob, '#ffffff'); // Cross
    pixel(cF, doc, 6, 17 + bob, '#ffffff');
  }
}

// 6. Nekromanser Hitam (Necromancer)
export function buildNecromancerCharacter(doc, layerBody, layerArmor, layerFx) {
  const N_PAL = {
    '#': '#181425',
    'D': '#181425', // Black robe
    'P': '#3e2731', // Dark burgundy
    'S': '#f4f4f4', // Horned skull
    's': '#8b9bb4',
    'G': '#73eff7', // Green-cyan soul flame
    'g': '#38b764',
  };

  for (let f = 0; f < 4; f++) {
    const cB = doc.ensureCel(layerBody.id, doc.frames[f].id);
    const cA = doc.ensureCel(layerArmor.id, doc.frames[f].id);
    const cF = doc.ensureCel(layerFx.id, doc.frames[f].id);
    const bob = f % 2 === 0 ? 0 : 1;
    const step = [0, 1, 0, -1][f];

    // Horned Skull Mask with Green Soul Eyes
    const skullMask = [
      "#S    #S",
      " #S##S# ",
      " #SSSS# ",
      " #s#G#s#",
      " #SSSS# ",
      "  ####  ",
    ];
    drawMatrix(cB, doc, 12, 6 + bob, skullMask, N_PAL);
    pixel(cB, doc, 14, 9 + bob, '#73eff7');
    pixel(cB, doc, 17, 9 + bob, '#73eff7');

    fillRect(cB, doc, 12 - step, 27 + bob, 3, 2, '#181425');
    fillRect(cB, doc, 17 + step, 27 + bob, 3, 2, '#181425');

    // Tattered Dark Shroud Robe
    const shroud = [
      "  ######  ",
      " #DPPPPD# ",
      "#DPDDDDDP#",
      "#DDDDDDDD#",
      "#DPDDDDDP#",
      "#DDDDDDDD#",
      " #DPPPPD# ",
      " #D#DD#D# ",
    ];
    drawMatrix(cA, doc, 11, 13 + bob, shroud, N_PAL);

    // Death Scythe with glowing blade
    const sBob = bob + (f === 1 ? -1 : 0);
    fillRect(cF, doc, 24, 6 + sBob, 2, 20, '#3e2731'); // Shaft
    // Scythe Curved Blade
    const blade = [
      "  ##### ",
      " #GGGG# ",
      "#GGGG#  ",
      "#G##    ",
      "##      ",
    ];
    drawMatrix(cF, doc, 18, 4 + sBob, blade, N_PAL);
    pixel(cF, doc, 20, 5 + sBob, '#ffffff'); // Soul edge
  }
}

// 7. Tengkorak (Skeleton)
export function buildSkeletonCharacter(doc, layerBody, layerArmor, layerFx) {
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

    fillRect(cB, doc, 15, 13 + bob, 2, 7, '#8b9bb4');
    for (let r = 0; r < 3; r++) {
      fillRect(cB, doc, 12, 14 + bob + r * 2, 8, 1, '#f4f4f4');
      pixel(cB, doc, 11, 14 + bob + r * 2, '#8b9bb4');
      pixel(cB, doc, 20, 14 + bob + r * 2, '#8b9bb4');
    }
    fillRect(cB, doc, 13, 20 + bob, 6, 2, '#f4f4f4');
    outlineRect(cB, doc, 13, 20 + bob, 6, 2, '#181425');

    const lX = 12 - step, rX = 17 + step;
    fillRect(cB, doc, lX, 22 + bob, 2, 5, '#f4f4f4');
    fillRect(cB, doc, lX - 1, 27 + bob, 3, 1, '#8b9bb4');
    fillRect(cB, doc, rX, 22 + bob, 2, 5, '#f4f4f4');
    fillRect(cB, doc, rX, 27 + bob, 3, 1, '#8b9bb4');

    const helm = [
      "#R         ",
      " #Rr#####  ",
      "  #RrRRRR# ",
      "   ######  ",
    ];
    drawMatrix(cA, doc, 9, 3 + bob, helm, S_PAL);

    fillRect(cA, doc, 9, 13 + bob, 4, 3, '#733e39');
    pixel(cA, doc, 8, 12 + bob, '#e4a672');
    fillRect(cA, doc, 13, 21 + bob, 6, 3, '#3e2731');
    pixel(cA, doc, 14, 24 + bob, '#733e39');

    const wBob = bob + (f === 1 ? -1 : 0);
    fillRect(cF, doc, 23, 7 + wBob, 3, 11, '#733e39');
    pixel(cF, doc, 23, 6 + wBob, '#e4a672');
    pixel(cF, doc, 25, 11 + wBob, '#181425');
    pixel(cF, doc, 23, 14 + wBob, '#181425');
    fillRect(cF, doc, 21, 18 + wBob, 7, 2, '#181425');
    fillRect(cF, doc, 23, 20 + wBob, 2, 3, '#f4f4f4');
  }
}

// 8. Goblin Hutan (Goblin)
export function buildGoblinCharacter(doc, layerBody, layerArmor, layerFx) {
  const G_PAL = {
    '#': '#181425',
    'G': '#38b764',
    'g': '#a7f070',
    'D': '#257179',
    'Y': '#fee761',
    'B': '#733e39',
    'b': '#e4a672',
  };

  for (let f = 0; f < 4; f++) {
    const cB = doc.ensureCel(layerBody.id, doc.frames[f].id);
    const cA = doc.ensureCel(layerArmor.id, doc.frames[f].id);
    const cF = doc.ensureCel(layerFx.id, doc.frames[f].id);
    const bob = f % 2 === 0 ? 0 : 1;
    const step = [0, 1, 0, -1][f];

    // Big Pointed Goblin Ears & Mischievous Grin
    const goblinHead = [
      "#g        #g",
      "#G#      #G#",
      " #G######G# ",
      " #gGgGGgGg# ",
      " #gG#YY#Gg# ",
      " #GGGGGGGG# ",
      "  #G#GG#G#  ",
      "   ######   ",
    ];
    drawMatrix(cB, doc, 10, 8 + bob, goblinHead, G_PAL);

    // Bare Goblin Feet
    fillRect(cB, doc, 11 - step, 26 + bob, 3, 3, '#38b764');
    fillRect(cB, doc, 17 + step, 26 + bob, 3, 3, '#38b764');

    // Ragged Loincloth
    fillRect(cA, doc, 12, 19 + bob, 8, 5, '#733e39');
    fillRect(cA, doc, 13, 22 + bob, 6, 2, '#3e2731');

    // Chipped Wooden Spear
    const sBob = bob + (f === 1 ? -1 : 0);
    fillRect(cF, doc, 23, 10 + sBob, 2, 17, '#733e39');
    // Flint spearhead
    pixel(cF, doc, 23, 8 + sBob, '#8b9bb4');
    pixel(cF, doc, 24, 8 + sBob, '#8b9bb4');
    pixel(cF, doc, 23, 7 + sBob, '#c0cbdc');
  }
}

// 9. Prajurit Orc (Orc)
export function buildOrcCharacter(doc, layerBody, layerArmor, layerFx) {
  const O_PAL = {
    '#': '#181425',
    'G': '#257179', // Deep dark green skin
    'g': '#38b764',
    'W': '#ffffff', // Tusks
    'R': '#b13e53', // War paint
    'I': '#566c86', // Spiked iron
    'i': '#8b9bb4',
    'B': '#733e39',
  };

  for (let f = 0; f < 4; f++) {
    const cB = doc.ensureCel(layerBody.id, doc.frames[f].id);
    const cA = doc.ensureCel(layerArmor.id, doc.frames[f].id);
    const cF = doc.ensureCel(layerFx.id, doc.frames[f].id);
    const bob = f % 2 === 0 ? 0 : 1;
    const step = [0, 1, 0, -1][f];

    // Massive Jaw with Upward Tusks
    const orcHead = [
      "   ######   ",
      "  #GGGGGG#  ",
      " #GRRRRRG#  ",
      " #G#YY#GG#  ",
      " #GGGGGGGG# ",
      " #WGGGGGGW# ", // Tusks!
      " #W######W# ",
      "   ######   ",
    ];
    drawMatrix(cB, doc, 10, 5 + bob, orcHead, O_PAL);

    // Heavy Boots
    const lX = 10 - step, rX = 18 + step;
    fillRect(cB, doc, lX, 23 + bob, 4, 5, '#566c86');
    outlineRect(cB, doc, lX, 23 + bob, 4, 5, '#181425');
    fillRect(cB, doc, rX, 23 + bob, 4, 5, '#566c86');
    outlineRect(cB, doc, rX, 23 + bob, 4, 5, '#181425');

    // Heavy Iron Studded Armor
    const ironArmor = [
      "  ########  ",
      " #IIIIIIII# ",
      "#iIIiIIiIIi#",
      "#IIIIIIIIII#",
      "#iIIiIIiIIi#",
      " #BBBBBBBB# ",
      " #BBBBBBBB# ",
    ];
    drawMatrix(cA, doc, 10, 13 + bob, ironArmor, O_PAL);

    // Giant Double-Bladed Battle Axe
    const aBob = bob + (f === 1 ? -1 : 0);
    fillRect(cF, doc, 25, 7 + aBob, 2, 19, '#733e39');
    // Double blades
    fillRect(cF, doc, 21, 8 + aBob, 4, 7, '#8b9bb4');
    outlineRect(cF, doc, 21, 8 + aBob, 4, 7, '#181425');
    fillRect(cF, doc, 27, 8 + aBob, 4, 7, '#8b9bb4');
    outlineRect(cF, doc, 27, 8 + aBob, 4, 7, '#181425');
  }
}

// 10. Naga Merah Mini Boss (Dragon 48x48)
export function buildDragonCharacter(doc, layerBody, layerArmor, layerFx) {
  doc.tags = [{ name: 'hover', from: 0, to: 3, direction: 'pingpong', repeat: 0, color: '#ef7d57' }];
  const D_PAL = {
    '#': '#181425',
    'R': '#b13e53',
    'r': '#ef7d57',
    'Y': '#fee761',
    'W': '#ffffff',
    'D': '#3e2731',
    'H': '#e4a672', // Horns
  };

  for (let f = 0; f < 4; f++) {
    const cB = doc.ensureCel(layerBody.id, doc.frames[f].id);
    const cA = doc.ensureCel(layerArmor.id, doc.frames[f].id);
    const cF = doc.ensureCel(layerFx.id, doc.frames[f].id);
    const wingY = [0, -2, -1, 1][f];

    // Dragon Horned Head & Scaled Body (20x22)
    const head = [
      " #H          #H ",
      "  #HH######HH#  ",
      "  #rrRRRRRRrr#  ",
      " #rrrRRRRRRrrr# ",
      " #rr#YY##YY#rr# ",
      " #rrrrrrrrrrrr# ",
      " #rWWWWWWWWWWr# ", // Sharp fangs
      "  ############  ",
    ];
    drawMatrix(cB, doc, 16, 12, head, D_PAL);
    // Body & Tail
    fillRect(cB, doc, 18, 20, 12, 14, '#b13e53');
    fillRect(cB, doc, 20, 22, 8, 10, '#ef7d57'); // Chest scales
    // Tail waving
    pixel(cB, doc, 15, 33, '#b13e53');
    pixel(cB, doc, 13, 34 + (f % 2), '#b13e53');
    pixel(cB, doc, 11, 35 + (f % 2), '#ef7d57');

    // Dragon Membranous Wings (Flapping on layerArmor)
    const leftWing = [
      "  ########   ",
      " #rrrrrrrr## ",
      "#rDDDDDDDDDr#",
      "#rDDDDDDDDDr#",
      " #rDDDDDDDr# ",
      "  ###rDr###  ",
    ];
    drawMatrix(cA, doc, 4, 14 + wingY, leftWing, D_PAL);

    const rightWing = [
      "   ########  ",
      " ##rrrrrrrr# ",
      "#rDDDDDDDDDr#",
      "#rDDDDDDDDDr#",
      " #rDDDDDDDr# ",
      "  ###rDr###  ",
    ];
    drawMatrix(cA, doc, 31, 14 + wingY, rightWing, D_PAL);

    // Fire breath embers (FX layer)
    if (f >= 2) {
      pixel(cF, doc, 22, 21, '#fee761');
      pixel(cF, doc, 25, 21, '#ef7d57');
    }
  }
}

// 11. Slime (16x16, 4 frame bounce)
export function buildSlimeCharacter(doc, layerBody) {
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

// 12. Kelelawar Gua (Bat, 16x16, 4 frame fly)
export function buildBatCharacter(doc, layerBody) {
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

// 13. Hantu Melayang (Ghost, 16x16, 4 frame float)
export function buildGhostCharacter(doc, layerBody, layerFx) {
  doc.tags = [{ name: 'float', from: 0, to: 3, direction: 'pingpong', repeat: 0, color: '#73eff7' }];
  const GH_PAL = {
    '#': '#262b44',
    'W': '#f4f4f4',
    'w': '#c0cbdc',
    'C': '#73eff7',
    'E': '#181425',
  };

  for (let f = 0; f < 4; f++) {
    const cB = doc.ensureCel(layerBody.id, doc.frames[f].id);
    const cF = doc.ensureCel(layerFx.id, doc.frames[f].id);
    const floatY = [2, 1, 0, 1][f];

    const ghost = [
      "    ######    ",
      "   #WWWWWW#   ",
      "  #WWWWWWWW#  ",
      "  #W#E#WW#E#  ",
      "  #WW#WWWW#W  ",
      "  #WWWWWWWW#  ",
      "   #WWWWWW#   ",
      `  ${f % 2 === 0 ? '#w#w#w#w#' : ' #w#w#w# '}  `,
    ];
    drawMatrix(cB, doc, 1, floatY, ghost, GH_PAL);

    // Ethereal cyan spirit aura (FX layer)
    pixel(cF, doc, 4, floatY + 3, '#73eff7');
    pixel(cF, doc, 9, floatY + 3, '#73eff7');
    pixel(cF, doc, 2, floatY + 6, '#73eff7');
    pixel(cF, doc, 13, floatY + 5, '#73eff7');
  }
}

// 14. Manekin Dasar (Artist Dummy, 32x32)
export function buildMannequinCharacter(doc, layerBody, layerArmor, layerFx) {
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

    fillRect(cB, doc, 14, 12 + bob, 3, 2, '#262b44');

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

    for (let x = 13; x <= 18; x += 2) pixel(cA, doc, x, 15 + bob, '#41a6f6');
    for (let x = 13; x <= 18; x += 2) pixel(cA, doc, x, 19 + bob, '#41a6f6');

    fillRect(cF, doc, 10, 29, 12, 2, '#262b44');
    fillRect(cF, doc, 12, 28, 8, 3, '#1a1c2c');
  }
}

