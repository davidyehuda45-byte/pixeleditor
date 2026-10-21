import assert from 'node:assert/strict';
import { ditherToPalette } from '../src/core/palette.js';
import {
  buildShapeMask, pixelPerfectFilter, bezierPoints, gradientMask,
  seededRandom, shadeColor
} from '../src/tools/drawing.js';

export const toolTests = [
  {
    name: 'ditherToPalette quantises with Floyd-Steinberg diffusion',
    fn() {
      const w = 4, h = 4;
      const data = new Uint8ClampedArray(w * h * 4);
      // Gray ramp
      for (let i = 0; i < w * h; i++) {
        const v = Math.round((i / (w * h - 1)) * 255);
        data[i * 4] = v; data[i * 4 + 1] = v; data[i * 4 + 2] = v; data[i * 4 + 3] = 255;
      }
      const palette = ['#000000', '#ffffff'];
      const out = ditherToPalette(data, w, h, palette, 0.75);
      assert.equal(out.length, data.length);
      // All output pixels must be strictly either black or white
      for (let i = 0; i < w * h; i++) {
        const val = out[i * 4];
        assert.ok(val === 0 || val === 255, `Pixel ${i} should be 0 or 255, got ${val}`);
        assert.equal(out[i * 4 + 3], 255);
      }
      // First pixel should be black, last pixel should be white
      assert.equal(out[0], 0);
      assert.equal(out[(w * h - 1) * 4], 255);
    },
  },
  {
    name: 'pixelPerfectFilter removes L-corner diagonal nubs',
    fn() {
      // Path: (0,0) -> (1,1) -> (2,2) is a diagonal line.
      // A corner nub is (0,0) -> (0,1) -> (1,1): (0,1) is redundant.
      const pathWithNub = [[0, 0], [0, 1], [1, 1]];
      const filtered = pixelPerfectFilter(pathWithNub);
      assert.equal(filtered.length, 2);
      assert.deepEqual(filtered[0], [0, 0]);
      assert.deepEqual(filtered[1], [1, 1]);
    },
  },
  {
    name: 'buildShapeMask rounded-rect generates rounded corners inside bounds',
    fn() {
      const doc = { width: 16, height: 16 };
      const mask = buildShapeMask('rounded-rect', doc, [2, 2], [13, 13], {
        filled: true,
        radius: 3,
        brushSize: 1,
      });
      assert.equal(mask.length, 256);
      // Corner pixel (2,2) should be 0 because radius=3 rounds it off
      assert.equal(mask[2 * 16 + 2], 0, 'Outer corner (2,2) should be shaved');
      // Center pixel (7,7) should be 1
      assert.equal(mask[7 * 16 + 7], 1, 'Center pixel (7,7) must be filled');
      // Edge pixel (7,2) should be 1
      assert.equal(mask[2 * 16 + 7], 1, 'Top edge midpoint (7,2) must be filled');
    },
  },
  {
    name: 'bezierPoints handles linear, quadratic, and cubic curves',
    fn() {
      const quad = bezierPoints([[0, 0], [10, 0], [10, 10]], 20);
      assert.ok(quad.length >= 20);
      assert.deepEqual(quad[0], [0, 0]);
      assert.deepEqual(quad[quad.length - 1], [10, 10]);

      const cubic = bezierPoints([[0, 0], [0, 10], [10, 10], [10, 0]], 30);
      assert.ok(cubic.length >= 30);
      assert.deepEqual(cubic[0], [0, 0]);
      assert.deepEqual(cubic[cubic.length - 1], [10, 0]);
    },
  },
  {
    name: 'seededRandom is deterministic given identical seeds',
    fn() {
      const rng1 = seededRandom(42);
      const rng2 = seededRandom(42);
      for (let i = 0; i < 10; i++) {
        assert.equal(rng1(), rng2());
      }
    },
  },
  {
    name: 'shadeColor finds adjacent shade in palette ramp',
    fn() {
      const palette = [[0, 0, 0], [128, 128, 128], [255, 255, 255]];
      // Brighten middle gray
      const lighter = shadeColor([128, 128, 128], palette, 1);
      assert.deepEqual(lighter, [255, 255, 255]);
      // Darken middle gray
      const darker = shadeColor([128, 128, 128], palette, -1);
      assert.deepEqual(darker, [0, 0, 0]);
    },
  },
  {
    name: 'gradientMask produces linear gradient across bounds',
    fn() {
      const doc = { width: 10, height: 1 };
      const mask = new Uint8Array(10).fill(1);
      const grad = gradientMask(doc, mask, [0, 0], [9, 0], {
        type: 'linear',
        dither: 'none',
        fromAlpha: [255, 0, 0],
      });
      // The start is 0 (not full), the end at [9,0] reaches 1.0 (drawn)
      assert.equal(grad[9 * 4], 255);
      assert.equal(grad[9 * 4 + 3], 255);
    },
  },
];
