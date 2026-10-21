import assert from 'node:assert/strict';
import { parseHex, toHex, rgbToHsv, hsvToRgb, mixHex, contrastRatio, channelDistance } from '../src/utils/color.js';

export const colorTests = [
  {
    name: 'hex parsing supports 3/4/6/8 digits',
    fn() {
      assert.deepEqual(parseHex('#f00'), [255, 0, 0, 255]);
      assert.deepEqual(parseHex('#ff000080'), [255, 0, 0, 128]);
      assert.deepEqual(parseHex('abc'), [170, 187, 204, 255]);
      assert.equal(toHex([1, 2, 3, 255]), '#010203');
      assert.equal(toHex([1, 2, 3, 4]), '#01020304');
    },
  },
  {
    name: 'HSV round trip is stable',
    fn() {
      for (const rgb of [[255, 0, 0], [12, 100, 200], [0, 0, 0], [255, 255, 255], [123, 45, 67]]) {
        const hsv = rgbToHsv(...rgb);
        const back = hsvToRgb(hsv.h, hsv.s, hsv.v);
        assert.deepEqual(back, rgb);
      }
    },
  },
  {
    name: 'mix, contrast and channel distance',
    fn() {
      assert.equal(mixHex('#000000', '#ffffff', 0.5), '#808080');
      assert.ok(contrastRatio('#000000', '#ffffff') > 20);
      assert.equal(channelDistance([0, 0, 0, 255], [3, 2, 1, 255]), 3);
    },
  },
];
