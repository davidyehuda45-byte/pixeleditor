import assert from 'node:assert/strict';
import { PixelDocument } from '../src/core/document.js';
import { serializeProject, stringifyProject, parseProject, rleEncode, rleDecode, bytesToBase64, base64ToBytes, PFX_VERSION } from '../src/io/project.js';

function buildDoc() {
  const doc = PixelDocument.create({ width: 8, height: 6, title: 'roundtrip' });
  const body = doc.layers[0];
  const frame1 = doc.frames[0].id;
  const cel = doc.ensureCel(body.id, frame1);
  for (let i = 0; i < 8 * 6; i++) cel.pixels.set([i, 255 - i, (i * 3) & 255, i % 2 ? 255 : 0], i * 4);
  const layer2 = doc.addLayer({ name: 'outline', opacity: 123, blend: 'multiply' });
  const cel2 = doc.ensureCel(layer2.id, frame1);
  cel2.pixels.set([9, 8, 7, 255], 0);
  const frame2 = doc.addFrame({ duration: 250, copyFrom: frame1, link: true });
  doc.tags = [{ name: 'idle', from: 0, to: 1, direction: 'pingpong', repeat: 2 }];
  doc.slices = [{ name: 'button', frames: [{ frame: 0, rect: [1, 2, 4, 3], pivot: [2, 3], center: [2, 3, 1, 1] }] }];
  doc.hitboxes = [{ name: 'hurt', frame: 0, type: 'rect', rect: [1, 1, 5, 4] }];
  doc.anchors = [{ name: 'hand', frame: 0, x: 6, y: 2 }];
  doc.grid = { x: 1, y: 1, w: 4, h: 4 };
  doc.userData = { hello: 'world' };
  return { doc, body, layer2, frame1, frame2 };
}

export const projectTests = [
  {
    name: 'RLE and base64 round trip exact bytes',
    fn() {
      const data = new Uint8ClampedArray(16 * 4);
      data.set([255, 0, 0, 255], 0);
      data.set([5, 6, 7, 8], 8);
      const bytes = rleEncode(data);
      assert.deepEqual([...rleDecode(bytes, data.length)], [...data]);
      const b64 = bytesToBase64(bytes);
      assert.deepEqual([...base64ToBytes(b64)], [...bytes]);
    },
  },
  {
    name: '.pfx round trip preserves pixels, layers, links and metadata',
    fn() {
      const { doc, layer2, frame1, frame2 } = buildDoc();
      const text = stringifyProject(doc);
      const parsed = parseProject(text);
      assert.equal(parsed.width, 8);
      assert.equal(parsed.height, 6);
      assert.equal(parsed.layers.length, 2);
      assert.equal(parsed.frames.length, 2);
      assert.equal(parsed.layers[1].opacity, 123);
      assert.equal(parsed.layers[1].blend, 'multiply');
      assert.equal(parsed.tags[0].direction, 'pingpong');
      assert.deepEqual(parsed.slices[0].frames[0].rect, [1, 2, 4, 3]);
      assert.deepEqual(parsed.userData, { hello: 'world' });
      assert.deepEqual(parsed.grid, { x: 1, y: 1, w: 4, h: 4 });
      assert.deepEqual(
        [...parsed.getCel(doc.layers[0].id, frame1).pixels],
        [...doc.getCel(doc.layers[0].id, frame1).pixels],
      );
      assert.deepEqual(
        [...parsed.getCel(layer2.id, frame1).pixels],
        [...doc.getCel(layer2.id, frame1).pixels],
      );
      assert.equal(parsed.getCel(doc.layers[0].id, frame1), parsed.getCel(doc.layers[0].id, frame2.id), 'linked cel survives');
    },
  },
  {
    name: '.pfx rejects corrupted JSON and unsupported versions',
    fn() {
      assert.throws(() => parseProject('{nope'), /JSON/);
      const { doc } = buildDoc();
      const obj = serializeProject(doc);
      assert.throws(() => parseProject(JSON.stringify({ ...obj, format: 'other' })), /format/);
      assert.throws(() => parseProject(JSON.stringify({ ...obj, version: PFX_VERSION + 1 })), /versi/);
      const broken = { ...obj, cels: obj.cels.map((c) => ({ ...c, data: c.data ? 'AAAA' : c.data })) };
      assert.throws(() => parseProject(JSON.stringify(broken)), /piksel|Base64|pfx/);
      assert.throws(() => parseProject(JSON.stringify({ ...obj, canvas: { width: 0, height: 0 } })), /kanvas/);
    },
  },
];
