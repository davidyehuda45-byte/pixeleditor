import assert from 'node:assert/strict';
import { PixelDocument } from '../src/core/document.js';
import { renderComposite, blendChannel, compositePixel } from '../src/core/compositor.js';

function paint(doc, layerId, frameId, rgba) {
  const cel = doc.ensureCel(layerId, frameId);
  for (let i = 0; i < cel.pixels.length; i += 4) cel.pixels.set(rgba, i);
}

function makeDoc(w = 2, h = 1) {
  return PixelDocument.create({ width: w, height: h });
}

export const compositorTests = [
  {
    name: 'source-over replaces opaque bottom layer',
    fn() {
      const doc = makeDoc();
      const bottom = doc.layers[0];
      const top = doc.addLayer({ name: 'top' });
      paint(doc, bottom.id, doc.frames[0].id, [255, 0, 0, 255]);
      paint(doc, top.id, doc.frames[0].id, [0, 0, 255, 255]);
      const out = renderComposite(doc, doc.frames[0].id);
      assert.deepEqual([...out.data.slice(0, 4)], [0, 0, 255, 255]);
    },
  },
  {
    name: 'layer opacity blends correctly',
    fn() {
      const doc = makeDoc(1, 1);
      const bottom = doc.layers[0];
      const top = doc.addLayer({ name: 'top', opacity: 128 });
      paint(doc, bottom.id, doc.frames[0].id, [255, 0, 0, 255]);
      paint(doc, top.id, doc.frames[0].id, [0, 0, 255, 255]);
      const out = renderComposite(doc, doc.frames[0].id);
      const [r, g, b, a] = out.data;
      assert.ok(Math.abs(r - 127) <= 1, `r=${r}`);
      assert.equal(g, 0);
      assert.ok(Math.abs(b - 127) <= 1, `b=${b}`);
      assert.equal(a, 255);
    },
  },
  {
    name: 'hidden layers and reference layers are excluded when requested',
    fn() {
      const doc = makeDoc(1, 1);
      doc.layers[0].visible = false;
      const ref = doc.addLayer({ name: 'ref', reference: true });
      paint(doc, ref.id, doc.frames[0].id, [0, 255, 0, 255]);
      const outEditor = renderComposite(doc, doc.frames[0].id, { includeReference: true });
      assert.equal(outEditor.data[3], 255, 'reference is visible in editor');
      const outExport = renderComposite(doc, doc.frames[0].id, { includeReference: false });
      assert.equal(outExport.data[3], 0, 'reference omitted from export');
    },
  },
  {
    name: 'group opacity is applied to the isolated group',
    fn() {
      const doc = makeDoc(1, 1);
      const bottom = doc.layers[0];
      paint(doc, bottom.id, doc.frames[0].id, [255, 255, 255, 255]);
      const group = doc.addLayer({ type: 'group', name: 'g', opacity: 128 });
      const child = doc.addLayer({ parentId: group.id, name: 'child' });
      paint(doc, child.id, doc.frames[0].id, [0, 255, 0, 255]);
      const out = renderComposite(doc, doc.frames[0].id);
      const [r, g, b] = out.data;
      assert.ok(Math.abs(r - 127) <= 1, `r=${r}`);
      assert.ok(Math.abs(g - 255) <= 1, `g=${g}`);
      assert.ok(Math.abs(b - 127) <= 1, `b=${b}`);
    },
  },
  {
    name: 'blend modes follow reference formulas',
    fn() {
      assert.equal(blendChannel('multiply', 255, 255), 255);
      assert.equal(blendChannel('multiply', 255, 0), 0);
      assert.equal(blendChannel('screen', 0, 0), 0);
      assert.equal(blendChannel('screen', 255, 255), 255);
      assert.equal(blendChannel('difference', 30, 10), 20);
      const dst = new Uint8ClampedArray([255, 0, 0, 255]);
      compositePixel(dst, 0, 0, 255, 0, 255, 1, 'multiply');
      assert.deepEqual([...dst], [0, 0, 0, 255]);
    },
  },
  {
    name: 'clipping layer is masked by the base alpha',
    fn() {
      const doc = makeDoc(2, 1);
      const base = doc.layers[0];
      const clip = doc.addLayer({ name: 'clip', clipping: true });
      const cel = doc.ensureCel(base.id, doc.frames[0].id);
      cel.pixels.set([255, 0, 0, 255], 0);
      cel.pixels.set([0, 0, 0, 0], 4);
      paint(doc, clip.id, doc.frames[0].id, [0, 0, 255, 255]);
      const out = renderComposite(doc, doc.frames[0].id);
      assert.deepEqual([...out.data.slice(0, 4)], [0, 0, 255, 255], 'pixel 0 clipped in');
      assert.equal(out.data[7], 0, 'pixel 1 clipped out');
    },
  },
];
