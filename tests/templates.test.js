import assert from 'node:assert/strict';
import { GAME_TEMPLATES, TEMPLATE_CATEGORIES, buildTemplate } from '../src/core/templates.js';

export const templateTests = [
  {
    name: 'template catalog defines exactly 70 game templates across 7 categories',
    fn() {
      assert.equal(GAME_TEMPLATES.length, 70, 'Must have exactly 70 game templates');
      assert.equal(TEMPLATE_CATEGORIES.length, 8, 'Must have 8 category options (all + 7 cats)');
      for (const tpl of GAME_TEMPLATES) {
        assert.ok(tpl.id, 'Template must have an id');
        assert.ok(tpl.cat, 'Template must have a category');
        assert.ok(tpl.w > 0 && tpl.h > 0, 'Dimensions must be positive');
        assert.ok(tpl.frames >= 1, 'Must have at least 1 frame');
      }
    },
  },
  {
    name: 'all 70 templates build valid PixelDocuments with populated cels and layers',
    fn() {
      for (const tpl of GAME_TEMPLATES) {
        const doc = buildTemplate(tpl.id);
        assert.equal(doc.width, tpl.w, `${tpl.id} width mismatch`);
        assert.equal(doc.height, tpl.h, `${tpl.id} height mismatch`);
        assert.equal(doc.frames.length, tpl.frames, `${tpl.id} frames count mismatch`);
        assert.ok(doc.layers.length >= 1, `${tpl.id} must have layers`);

        // Check that at least one cel has drawn pixels
        let hasPixels = false;
        for (const cel of doc.cels.values()) {
          if (cel.pixels && cel.pixels.some((v) => v > 0)) {
            hasPixels = true;
            break;
          }
        }
        assert.ok(hasPixels, `Template ${tpl.id} must contain drawn pixels`);
      }
    },
  },
  {
    name: 'character templates include multi-layer breakdown and game dev metadata',
    fn() {
      const knight = buildTemplate('char-knight');
      assert.ok(knight.layers.length >= 3, 'Knight must have Body, Armor, and Weapon layers');
      assert.ok(knight.tags.some((t) => t.name === 'walk'), 'Knight must have walk tag');
      assert.ok(knight.slices.some((s) => s.name === 'hitbox'), 'Knight must have hitbox slice');
      assert.ok(knight.anchors.some((a) => a.name === 'weapon_hand'), 'Knight must have weapon anchor');

      const dragon = buildTemplate('char-dragon');
      assert.equal(dragon.width, 48);
      assert.equal(dragon.height, 48);
      assert.ok(dragon.tags.some((t) => t.name === 'hover'), 'Dragon must have hover tag');
    },
  },
  {
    name: 'ui templates include 9-slice slice metadata',
    fn() {
      const dialog = buildTemplate('ui-dialog');
      assert.ok(dialog.slices.length >= 1, 'UI Dialog must have slice');
      const s = dialog.slices[0];
      assert.equal(s.name, 'dialog_frame');
      assert.ok(s.frames[0].center, 'UI Dialog must have 9-slice center rect');
    },
  },
];

