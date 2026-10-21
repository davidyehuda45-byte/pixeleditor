/**
 * Biome & Elemental Palette Remapping Engine
 * Pure deterministic pixel algorithms to generate elemental variants
 * (Fire, Ice, Poison, Shadow, Celestial, GameBoy, Pico-8) from any sprite.
 */

import { parseHex, toHex, rgbToHsv, hsvToRgb } from '../../utils/color.js';

// Canonical 4-shade Game Boy DMG palette
export const GAMEBOY_PALETTE = [
  [15, 56, 15, 255],     // darkest green #0f380f
  [48, 98, 48, 255],     // dark green    #306230
  [139, 172, 15, 255],   // light green   #8bac0f
  [155, 188, 15, 255],   // lightest      #9bbc0f
];

// Official 16-color PICO-8 palette
export const PICO8_PALETTE = [
  [0, 0, 0, 255],        // 0: Black
  [29, 43, 83, 255],     // 1: Dark Blue
  [126, 37, 83, 255],    // 2: Dark Purple
  [0, 135, 81, 255],     // 3: Dark Green
  [171, 82, 54, 255],    // 4: Brown
  [95, 87, 79, 255],     // 5: Dark Gray
  [194, 195, 199, 255],  // 6: Light Gray
  [255, 241, 232, 255],  // 7: White
  [255, 0, 77, 255],     // 8: Red
  [255, 163, 0, 255],    // 9: Orange
  [255, 236, 39, 255],   // 10: Yellow
  [0, 228, 54, 255],     // 11: Green
  [41, 173, 255, 255],   // 12: Blue
  [131, 118, 156, 255],  // 13: Indigo
  [255, 119, 168, 255],  // 14: Pink
  [255, 204, 170, 255],  // 15: Peach
];

/**
 * Finds the closest palette entry using perceptual weighted Euclidean distance.
 */
function findClosestColor(r, g, b, palette) {
  let closest = palette[0];
  let minDistance = Infinity;

  for (let i = 0; i < palette.length; i++) {
    const entry = palette[i];
    // Redmean color difference approximation
    const rmean = (r + entry[0]) / 2;
    const dr = r - entry[0];
    const dg = g - entry[1];
    const db = b - entry[2];
    const dist = (((512 + rmean) * dr * dr) >> 8) + 4 * dg * dg + (((767 - rmean) * db * db) >> 8);

    if (dist < minDistance) {
      minDistance = dist;
      closest = entry;
    }
  }

  return closest;
}

/**
 * Applies a specific biome preset to an RGBA byte array (Uint8ClampedArray).
 * Preserves alpha: transparent pixels (alpha = 0) remain untouched.
 */
export function remapBiome(pixels, presetId, options = {}) {
  const result = new Uint8ClampedArray(pixels.length);
  const len = pixels.length;

  for (let i = 0; i < len; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    if (a === 0) {
      result[i] = 0;
      result[i + 1] = 0;
      result[i + 2] = 0;
      result[i + 3] = 0;
      continue;
    }

    let nr = r, ng = g, nb = b, na = a;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const { h, s, v } = rgbToHsv(r, g, b);

    switch (presetId) {
      case 'fire': {
        // Shift hue towards red-orange-yellow, increase saturation
        const newH = Math.min(42, Math.max(8, (lum / 255) * 45));
        const newS = Math.min(1, Math.max(0.55, s * 1.25));
        const newV = Math.min(1, Math.max(0.12, v * 1.08));
        const [fr, fg, fb] = hsvToRgb(newH, newS, newV);
        nr = fr; ng = fg; nb = fb;
        break;
      }

      case 'ice': {
        // Shift hue towards icy cyan/cerulean (185-210 deg), cold brightness
        const newH = 192 + (lum / 255) * 18;
        const newS = Math.min(0.9, Math.max(0.2, s * 0.95 + 0.15));
        const newV = Math.min(1, Math.max(0.25, (lum / 255) * 0.85 + 0.2));
        const [ir, ig, ib] = hsvToRgb(newH, newS, newV);
        nr = ir; ng = ig; nb = ib;
        break;
      }

      case 'poison': {
        // Toxic acid neon green (90-135 deg) for highlights, venom purple (280 deg) for deep shadows
        let newH, newS, newV;
        if (lum > 90) {
          newH = 110 + (lum / 255) * 20;
          newS = Math.min(1, s * 1.3 + 0.3);
          newV = Math.min(1, v * 1.1);
        } else {
          newH = 285;
          newS = 0.75;
          newV = Math.max(0.15, lum / 180);
        }
        const [pr, pg, pb] = hsvToRgb(newH, newS, newV);
        nr = pr; ng = pg; nb = pb;
        break;
      }

      case 'shadow': {
        // Obsidian desaturation with deep purple / void tint
        const voidH = 265;
        const voidS = 0.45;
        const voidV = Math.max(0.08, (lum / 255) * 0.55);
        const [sr, sg, sb] = hsvToRgb(voidH, voidS, voidV);
        nr = sr; ng = sg; nb = sb;
        break;
      }

      case 'gold': {
        // Radiant divine gold & amber (40-52 deg)
        const goldH = 44 + (lum / 255) * 8;
        const goldS = Math.min(0.95, Math.max(0.35, s * 1.1 + 0.2));
        const goldV = Math.min(1, (lum / 255) * 0.8 + 0.25);
        const [gr, gg, gb] = hsvToRgb(goldH, goldS, goldV);
        nr = gr; ng = gg; nb = gb;
        break;
      }

      case 'gameboy': {
        // Quantize strictly to 4 Game Boy DMG shades based on luminance
        const index = Math.min(3, Math.floor((lum / 256) * 4));
        const gb = GAMEBOY_PALETTE[index];
        nr = gb[0]; ng = gb[1]; nb = gb[2];
        break;
      }

      case 'pico8': {
        // Perceptual match to the 16 PICO-8 console colors
        const p8 = findClosestColor(r, g, b, PICO8_PALETTE);
        nr = p8[0]; ng = p8[1]; nb = p8[2];
        break;
      }

      default:
        break;
    }

    result[i] = Math.round(nr);
    result[i + 1] = Math.round(ng);
    result[i + 2] = Math.round(nb);
    result[i + 3] = na;
  }

  return result;
}

export const BIOME_PRESETS = [
  { id: 'fire', nameKey: 'biome.fire', icon: 'sparkles', descKey: 'biome.fireDesc', color: '#ff5522' },
  { id: 'ice', nameKey: 'biome.ice', icon: 'sparkles', descKey: 'biome.iceDesc', color: '#44ccff' },
  { id: 'poison', nameKey: 'biome.poison', icon: 'sparkles', descKey: 'biome.poisonDesc', color: '#33ee66' },
  { id: 'shadow', nameKey: 'biome.shadow', icon: 'moon', descKey: 'biome.shadowDesc', color: '#8844cc' },
  { id: 'gold', nameKey: 'biome.gold', icon: 'sun', descKey: 'biome.goldDesc', color: '#ffcc22' },
  { id: 'gameboy', nameKey: 'biome.gameboy', icon: 'contrast', descKey: 'biome.gameboyDesc', color: '#8bac0f' },
  { id: 'pico8', nameKey: 'biome.pico8', icon: 'palette', descKey: 'biome.pico8Desc', color: '#ff004d' },
];
