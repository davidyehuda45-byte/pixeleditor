import assert from 'node:assert/strict';
import { buildSpriteSheet, sliceSheet } from '../src/io/spritesheet.js';

function frame(w, h, draw) {
  const data = new Uint8ClampedArray(w * h * 4);
  draw?.(data, w, h);
  return { data, width: w, height: h, duration: 100 };
}

export const sheetTests = [
  {
    name: 'horizontal layout places frames left to right',
    fn() {
      const a = frame(4, 4, (d) => d.set([255, 0, 0, 255], 0));
      const b = frame(4, 4, (d) => d.set([0, 255, 0, 255], 0));
      const sheet = buildSpriteSheet([a, b], { layout: 'horizontal' });
      assert.equal(sheet.width, 8);
      assert.equal(sheet.height, 4);
      assert.deepEqual(sheet.frames.map((f) => f.x), [0, 4]);
      assert.deepEqual([...sheet.data.slice(0, 4)], [255, 0, 0, 255]);
      assert.deepEqual([...sheet.data.slice(16, 20)], [0, 255, 0, 255]);
    },
  },
  {
    name: 'trim records source offset and source size',
    fn() {
      const a = frame(4, 4, (d) => {
        d.set([10, 20, 30, 255], (1 * 4 + 1) * 4);
        d.set([10, 20, 30, 255], (2 * 4 + 2) * 4);
      });
      const sheet = buildSpriteSheet([a], { layout: 'horizontal', trim: true });
      assert.equal(sheet.width, 2);
      assert.equal(sheet.height, 2);
      const f = sheet.frames[0];
      assert.equal(f.trimX, 1);
      assert.equal(f.trimY, 1);
      assert.equal(f.sourceWidth, 4);
      assert.equal(f.sourceHeight, 4);
      assert.equal(f.trimmed, true);
    },
  },
  {
    name: 'padding and extrude produce bleed-free edges',
    fn() {
      const a = frame(2, 2, (d) => {
        d.set([255, 0, 0, 255], 0);
        d.set([0, 255, 0, 255], 4);
        d.set([0, 0, 255, 255], 8);
        d.set([255, 255, 255, 255], 12);
      });
      const sheet = buildSpriteSheet([a], { layout: 'horizontal', padding: 1, extrude: 1 });
      assert.ok(sheet.width >= 4);
      assert.ok(sheet.height >= 4);
      // left edge duplicate
      const left = [...sheet.data.slice((1 * sheet.width + 0) * 4, (1 * sheet.width + 0) * 4 + 4)];
      assert.deepEqual(left, [255, 0, 0, 255]);
      // right edge duplicate is the top-right source pixel
      const right = [...sheet.data.slice((1 * sheet.width + 3) * 4, (1 * sheet.width + 3) * 4 + 4)];
      assert.deepEqual(right, [0, 255, 0, 255]);
    },
  },
  {
    name: 'dedupe maps identical frames to one cell',
    fn() {
      const a = frame(3, 3, (d) => d.set([1, 2, 3, 255], 0));
      const b = frame(3, 3, (d) => d.set([1, 2, 3, 255], 0));
      const sheet = buildSpriteSheet([a, b], { layout: 'horizontal', dedupe: true });
      assert.equal(sheet.uniqueCount, 1);
      assert.equal(sheet.frames.length, 2);
      assert.equal(sheet.frames[1].dedupedTo, 0);
      assert.equal(sheet.width, 3);
    },
  },
  {
    name: 'power of two and grid layouts',
    fn() {
      const mk = (c) => frame(2, 2, (d) => d.set([c, 0, 0, 255], 0));
      const sheet = buildSpriteSheet([mk(1), mk(2), mk(3)], { layout: 'grid', columns: 2, powerOfTwo: true, padding: 1 });
      assert.equal(sheet.width & (sheet.width - 1), 0);
      assert.equal(sheet.height & (sheet.height - 1), 0);
      assert.equal(sheet.frames.length, 3);
    },
  },
  {
    name: 'sliceSheet splits a horizontal strip back into frames',
    fn() {
      const a = frame(3, 2, (d) => d.set([255, 0, 0, 255], 0));
      const b = frame(3, 2, (d) => d.set([0, 255, 0, 255], 0));
      const sheet = buildSpriteSheet([a, b], { layout: 'horizontal' });
      const frames = sliceSheet(sheet, { frameWidth: 3, frameHeight: 2, columns: 2, rows: 1 });
      assert.equal(frames.length, 2);
      assert.deepEqual([...frames[1].data.slice(0, 4)], [0, 255, 0, 255]);
    },
  },
];
