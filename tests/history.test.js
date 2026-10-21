import assert from 'node:assert/strict';
import { AppStore } from '../src/core/store.js';
import { PixelDocument } from '../src/core/document.js';
import {
  addLayer, addFrame, commitPixelEdit, undo, redo, setLayerProps,
  applySelection, jumpHistory, deleteLayer, selectionInvert,
} from '../src/core/commands.js';

function setup(w = 4, h = 4) {
  const store = new AppStore({ storage: null });
  const doc = PixelDocument.create({ width: w, height: h });
  store.createSession(doc);
  return { store, doc };
}

function fingerprint(doc) {
  const layers = doc.layers.map((l) => `${l.id}:${l.name}:${l.visible}:${l.opacity}`);
  const pixels = [...doc.cels.values()].map((c) => c.pixels ? Array.from(c.pixels).join(',') : new Array(doc.width * doc.height * 4).fill(0).join(','));
  return JSON.stringify({ w: doc.width, h: doc.height, layers, frames: doc.frames.length, pixels });
}

export const historyTests = [
  {
    name: 'pixel diff undo/redo restores exact bytes',
    fn() {
      const { store, doc } = setup();
      const cel = doc.ensureCel(doc.layers[0].id, doc.frames[0].id);
      const before = cel.pixels.slice();
      cel.pixels.set([255, 12, 34, 255], (1 * 4 + 2) * 4);
      const after = cel.pixels.slice();
      commitPixelEdit(store, 'pencil', doc.layers[0].id, doc.frames[0].id, before, after);
      assert.equal(store.history.entries.length, 1);
      assert.equal(store.history.entries[0].size, 8);
      undo(store);
      assert.equal(doc.getCel(doc.layers[0].id, doc.frames[0].id).pixels[(1 * 4 + 2) * 4 + 3], 0);
      redo(store);
      assert.equal(doc.getCel(doc.layers[0].id, doc.frames[0].id).pixels[(1 * 4 + 2) * 4], 255);
    },
  },
  {
    name: 'structural commands undo and redo layers',
    fn() {
      const { store, doc } = setup();
      assert.equal(doc.layers.length, 1);
      addLayer(store, { name: 'second' });
      assert.equal(doc.layers.length, 2);
      undo(store);
      assert.equal(store.doc.layers.length, 1);
      redo(store);
      assert.equal(store.doc.layers.length, 2);
      assert.equal(store.doc.layers[1].name, 'second');
    },
  },
  {
    name: 'random command sequence undone back to initial state',
    fn() {
      const { store, doc } = setup();
      const initial = fingerprint(store.doc);
      commitPixelEdit(store, 'draw', doc.layers[0].id, doc.frames[0].id,
        new Uint8ClampedArray(4 * 4 * 4),
        (() => { const a = new Uint8ClampedArray(4 * 4 * 4); a.set([1, 2, 3, 255], 0); return a; })());
      addLayer(store);
      addFrame(store);
      setLayerProps(store, store.doc.layers[0].id, { opacity: 42, blend: 'multiply' }, 'props');
      applySelection(store, new Uint8Array(16).fill(1), { label: 'select' });
      selectionInvert(store);
      deleteLayer(store, store.doc.layers[0].id);
      const count = store.history.entries.length;
      assert.ok(count >= 6);
      while (store.history.canUndo) undo(store);
      assert.equal(fingerprint(store.doc), initial);
      while (store.history.canRedo) redo(store);
      assert.equal(store.history.index, count);
    },
  },
  {
    name: 'jumpTo time travels both directions',
    fn() {
      const { store } = setup();
      addLayer(store);
      addLayer(store);
      addFrame(store);
      assert.equal(store.history.entries.length, 3);
      jumpHistory(store, 1);
      assert.equal(store.doc.layers.length, 2);
      jumpHistory(store, 3);
      assert.equal(store.doc.frames.length, 2);
    },
  },
];
