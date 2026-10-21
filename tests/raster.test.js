import assert from 'node:assert/strict';
import { linePoints, ellipseMask, floodFillMask, growMask, changedBounds, scaleNearest, flipPixels, rotatePixels, symmetryPoints, ditherThreshold, trimBounds } from '../src/utils/raster.js';

function rgba(w, h, color = [0, 0, 0, 0]) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) data.set(color, i * 4);
  return data;
}

export const rasterTests = [
  {
    name: 'Bresenham line handles endpoints, horizontal and vertical',
    fn() {
      assert.deepEqual(linePoints(0, 0, 0, 0), [[0, 0]]);
      assert.deepEqual(linePoints(0, 0, 3, 0), [[0, 0], [1, 0], [2, 0], [3, 0]]);
      assert.deepEqual(linePoints(0, 3, 0, 0), [[0, 3], [0, 2], [0, 1], [0, 0]]);
      const diag = linePoints(0, 0, 4, 4);
      assert.equal(diag.length, 5);
      assert.deepEqual(diag[4], [4, 4]);
    },
  },
  {
    name: 'ellipse outline is symmetric and inside its bounds',
    fn() {
      const { mask, width, height } = ellipseMask({ x: 0, y: 0, w: 11, h: 7 }, false, 1);
      assert.equal(width, 11);
      assert.equal(height, 7);
      assert.ok(mask.some((v) => v));
      for (let y = 0; y < height; y++) assert.equal(mask[y * width], mask[y * width + width - 1], `row ${y}`);
      const center = mask[3 * width + 5];
      assert.equal(center, 0, 'outline must not fill the centre');
    },
  },
  {
    name: 'flood fill contiguous vs global and tolerance',
    fn() {
      const w = 5, h = 3;
      const data = rgba(w, h, [255, 0, 0, 255]);
      for (let i = 0; i < w; i++) data.set([0, 0, 255, 255], (1 * w + i) * 4); // blue row splits
      const mask = floodFillMask(data, w, h, 0, 0, { tolerance: 0, contiguous: true });
      assert.equal(mask.reduce((s, v) => s + v, 0), 5, 'top half only');
      const global = floodFillMask(data, w, h, 0, 0, { tolerance: 0, contiguous: false });
      assert.equal(global.reduce((s, v) => s + v, 0), 10, 'both red rows');
      const tolerant = floodFillMask(data, w, h, 0, 0, { tolerance: 255, contiguous: false });
      assert.equal(tolerant.reduce((s, v) => s + v, 0), 15, 'tolerance matches everything');
    },
  },
  {
    name: 'flood fill does not overflow on 1024x1024',
    fn() {
      const w = 1024, h = 1024;
      const data = rgba(w, h, [1, 2, 3, 255]);
      const mask = floodFillMask(data, w, h, 512, 512, { tolerance: 0, contiguous: true });
      assert.equal(mask.reduce((s, v) => s + v, 0), w * h);
    },
  },
  {
    name: 'grow mask grows and shrinks',
    fn() {
      const w = 7, h = 7;
      const mask = new Uint8Array(w * h);
      mask[3 * w + 3] = 1;
      const grown = growMask(mask, w, h, 1);
      assert.equal(grown.reduce((s, v) => s + v, 0), 9);
      const back = growMask(grown, w, h, -1);
      assert.equal(back.reduce((s, v) => s + v, 0), 1);
    },
  },
  {
    name: 'nearest scale, flip and rotate preserve colours',
    fn() {
      const w = 2, h = 2;
      const data = new Uint8ClampedArray([
        1, 2, 3, 255, 4, 5, 6, 255,
        7, 8, 9, 255, 10, 11, 12, 255,
      ]);
      const scaled = scaleNearest(data, w, h, 4, 4);
      assert.equal(scaled.length, 4 * 4 * 4);
      assert.deepEqual([...scaled.slice(0, 4)], [1, 2, 3, 255]);
      const flipped = flipPixels(data, w, h, 'h');
      assert.deepEqual([...flipped.slice(0, 4)], [4, 5, 6, 255]);
      const rotated = rotatePixels(data, w, h, 90);
      assert.equal(rotated.width, 2);
      assert.deepEqual([...rotated.data.slice(0, 4)], [7, 8, 9, 255]);
    },
  },
  {
    name: 'changedBounds and trimBounds report exact rectangles',
    fn() {
      const w = 5, h = 5;
      const before = rgba(w, h);
      const after = before.slice();
      after.set([255, 0, 0, 255], (2 * w + 1) * 4);
      after.set([255, 0, 0, 255], (3 * w + 3) * 4);
      assert.deepEqual(changedBounds(before, after, w, h), { x: 1, y: 2, w: 3, h: 2 });
      assert.deepEqual(trimBounds(after, w, h), { x: 1, y: 2, w: 3, h: 2 });
    },
  },
  {
    name: 'symmetry mirrors and radial copies',
    fn() {
      const both = symmetryPoints(0, 0, { mode: 'both', width: 8, height: 8 });
      assert.ok(both.some(([x, y]) => x === 7 && y === 0));
      assert.ok(both.some(([x, y]) => x === 0 && y === 7));
      assert.ok(both.some(([x, y]) => x === 7 && y === 7));
      const radial = symmetryPoints(8, 4, { mode: 'radial', slices: 4, width: 16, height: 16 });
      assert.equal(radial.length, 4);
    },
  },
  {
    name: 'dither thresholds stay in range and repeat',
    fn() {
      for (const pattern of ['checker', 'dots', 'lines', 'bayer2', 'bayer4', 'bayer8']) {
        for (let i = 0; i < 8; i++) {
          const a = ditherThreshold(pattern, i, i * 3);
          assert.ok(a >= 0 && a <= 1, `${pattern} ${a}`);
          assert.equal(a, ditherThreshold(pattern, i + 8, i * 3 + 8));
        }
      }
    },
  },
];
