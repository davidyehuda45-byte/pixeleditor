import { remapBiome, BIOME_PRESETS, GAMEBOY_PALETTE, PICO8_PALETTE } from '../src/core/effects/biomeRemap.js';

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

export const biomeTests = [
  {
    name: 'remapBiome preserves transparent pixels across all presets',
    fn() {
      const pixels = new Uint8ClampedArray([
        0, 0, 0, 0,
        128, 64, 32, 255,
        0, 0, 0, 0,
        255, 255, 255, 255
      ]);

      for (const preset of BIOME_PRESETS) {
        const remapped = remapBiome(pixels, preset.id);
        assert(remapped[3] === 0, `${preset.id} must preserve transparent pixel 0`);
        assert(remapped[11] === 0, `${preset.id} must preserve transparent pixel 2`);
        assert(remapped[7] === 255, `${preset.id} must preserve opaque alpha pixel 1`);
        assert(remapped[15] === 255, `${preset.id} must preserve opaque alpha pixel 3`);
      }
    },
  },
  {
    name: 'GameBoy preset strictly produces only 4 canonical shades',
    fn() {
      const pixels = new Uint8ClampedArray([
        10, 10, 10, 255,
        70, 70, 70, 255,
        150, 150, 150, 255,
        240, 240, 240, 255,
      ]);

      const remapped = remapBiome(pixels, 'gameboy');
      for (let i = 0; i < remapped.length; i += 4) {
        const r = remapped[i], g = remapped[i + 1], b = remapped[i + 2];
        const match = GAMEBOY_PALETTE.some(gb => gb[0] === r && gb[1] === g && gb[2] === b);
        assert(match, `GameBoy output [${r},${g},${b}] must be one of the 4 DMG shades`);
      }
    },
  },
  {
    name: 'Fire and Ice presets shift hues in expected warm and cold spectral bands',
    fn() {
      const neutralGray = new Uint8ClampedArray([128, 128, 128, 255]);
      const fire = remapBiome(neutralGray, 'fire');
      const ice = remapBiome(neutralGray, 'ice');

      // Fire should have higher red than blue
      assert(fire[0] > fire[2], `Fire must have higher red than blue: R=${fire[0]}, B=${fire[2]}`);
      // Ice should have higher blue than red
      assert(ice[2] > ice[0], `Ice must have higher blue than red: B=${ice[2]}, R=${ice[0]}`);
    },
  },
];

