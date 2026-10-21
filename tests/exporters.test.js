import assert from 'node:assert/strict';
import { PixelDocument } from '../src/core/document.js';
import { buildSpriteSheet } from '../src/io/spritesheet.js';
import { buildAsepriteJSON, buildTexturePackerJSON, buildUnitySlices } from '../src/io/exporters/aseprite.js';
import { buildGodotSpriteFrames } from '../src/io/exporters/godot.js';
import { parseHexPalette, parseGplPalette, parseJascPalette, serializeGpl, buildRamp } from '../src/core/palette.js';
import { exportDocument } from '../src/io/export.js';

function makeDoc() {
  const doc = PixelDocument.create({ width: 4, height: 4, title: 'hero' });
  const layer = doc.layers[0];
  const f1 = doc.frames[0];
  const cel = doc.ensureCel(layer.id, f1.id);
  cel.pixels.set([255, 0, 0, 255], 0);
  const f2 = doc.addFrame({ copyFrom: f1.id, duration: 200 });
  const cel2 = doc.ensureCel(layer.id, f2.id);
  cel2.pixels.set([0, 255, 0, 255], 0);
  doc.tags = [{ name: 'idle', from: 0, to: 1, direction: 'forward', repeat: 0 }];
  doc.slices = [{ name: 'hurt', frames: [{ frame: 0, rect: [0, 0, 4, 4], pivot: [2, 4], center: [1, 1, 2, 2] }] }];
  return doc;
}

function frameData(doc, index) {
  const cel = doc.getCel(doc.layers[0].id, doc.frames[index].id);
  const data = cel.pixels ? cel.pixels.slice() : new Uint8ClampedArray(16 * 4);
  return { data, width: 4, height: 4, duration: doc.frames[index].duration };
}

export const exporterTests = [
  {
    name: 'Aseprite JSON array/hash variants carry tags and slices',
    fn() {
      const doc = makeDoc();
      const sheet = buildSpriteSheet([frameData(doc, 0), frameData(doc, 1)], { layout: 'horizontal' });
      const arr = buildAsepriteJSON(sheet, doc, { imageName: 'hero.png', baseName: 'hero' });
      assert.equal(arr.frames.length, 2);
      assert.equal(arr.frames[0].frame.w, 4);
      assert.equal(arr.frames[1].duration, 200);
      assert.equal(arr.meta.frameTags[0].name, 'idle');
      assert.equal(arr.meta.slices[0].name, 'hurt');
      assert.equal(arr.meta.slices[0].keys[0].pivot.y, 4);
      assert.ok(arr.meta.pixelforge);
      const hash = buildAsepriteJSON(sheet, doc, { imageName: 'hero.png', baseName: 'hero', variant: 'hash' });
      assert.ok(hash.frames['hero_000.png']);
      assert.ok(!Array.isArray(hash.frames));
    },
  },
  {
    name: 'TexturePacker and Unity JSON have expected mappings',
    fn() {
      const doc = makeDoc();
      const sheet = buildSpriteSheet([frameData(doc, 0), frameData(doc, 1)], { layout: 'horizontal' });
      const tp = buildTexturePackerJSON(sheet, doc, { imageName: 'hero.png', baseName: 'hero' });
      assert.ok(tp.frames.hero_000);
      assert.equal(tp.animations.idle.length, 2);
      const unity = buildUnitySlices(sheet, doc, { imageName: 'hero.png', ppu: 16 });
      assert.equal(unity.sprites.length, 2);
      assert.equal(unity.filterMode, 'Point');
      assert.equal(unity.sprites[0].border.left, 1);
    },
  },
  {
    name: 'Godot 4 .tres references AtlasTextures and frame tags',
    fn() {
      const doc = makeDoc();
      const sheet = buildSpriteSheet([frameData(doc, 0), frameData(doc, 1)], { layout: 'horizontal' });
      const tres = buildGodotSpriteFrames(sheet, doc, { imagePath: 'res://hero.png', baseName: 'hero' });
      assert.match(tres, /^\[gd_resource type="SpriteFrames" load_steps=4 format=3\]/);
      assert.match(tres, /\[ext_resource type="Texture2D" path="res:\/\/hero.png" id="1_texture"\]/);
      assert.match(tres, /\[sub_resource type="AtlasTexture" id="AtlasTexture_1"\]/);
      assert.match(tres, /region = Rect2\(0, 0, 4, 4\)/);
      assert.match(tres, /"name": &"idle"/);
      assert.match(tres, /"speed": 6.6667/);
    },
  },
  {
    name: 'palette parsers accept GIMP, JASC and hex formats',
    fn() {
      const filled = new Uint8ClampedArray(16);
      filled.set([255, 10, 20, 255], 0);
      assert.deepEqual(parseHexPalette('#ff0a14\nabc\n'), ['#ff0a14', '#aabbcc']);
      const gpl = serializeGpl({ name: 'x', colors: ['#ff0000', '#00ff00'] });
      assert.deepEqual(parseGplPalette(gpl), ['#ff0000', '#00ff00']);
      const jasc = 'JASC-PAL\n0100\n2\n255 0 0\n0 255 0\n';
      assert.deepEqual(parseJascPalette(jasc), ['#ff0000', '#00ff00']);
      const ramp = buildRamp('#000000', '#ffffff', 3);
      assert.equal(ramp.length, 3);
      assert.equal(ramp[0], '#000000');
      assert.equal(ramp[2], '#ffffff');
    },
  },
  {
    name: 'export pipeline produces PNG, sheet and Godot files',
    async fn() {
      const doc = makeDoc();
      const result = await exportDocument(doc, {
        format: 'godot', scope: 'all', baseName: 'hero', scale: 1, layout: 'horizontal',
      });
      const names = result.files.map((f) => f.name);
      assert.ok(names.includes('hero.png'), names.join(','));
      assert.ok(names.some((n) => n.endsWith('.tres')));
      assert.ok(names.some((n) => n.endsWith('_aseprite.json')));
      assert.equal(result.width, 8);
      assert.equal(result.height, 4);
      const gif = await exportDocument(doc, { format: 'gif', scope: 'tag', tagName: 'idle', baseName: 'hero' });
      assert.equal(gif.files[0].name, 'hero_idle.gif');
      assert.equal(gif.files[0].data[0], 0x47);
      const png = await exportDocument(doc, { format: 'png', scope: 'current', baseName: 'hero' });
      assert.equal(png.files.length, 1);
      assert.equal(png.files[0].name, 'hero.png');
      assert.equal(png.files[0].data[1], 0x50);
    },
  },
  {
    name: 'Phaser, Raylib, and Love2D exporters generate valid engine data',
    async fn() {
      const doc = makeDoc();
      const result = await exportDocument(doc, {
        format: 'sheet', scope: 'all', baseName: 'hero', scale: 1, layout: 'horizontal',
      });
      const names = result.files.map((f) => f.name);
      assert.ok(names.includes('hero_phaser.json'), 'Phaser JSON must be generated');
      assert.ok(names.includes('hero_raylib.h'), 'Raylib C header must be generated');
      assert.ok(names.includes('hero_love2d.lua'), 'Love2D Lua script must be generated');

      const raylibFile = result.files.find(f => f.name === 'hero_raylib.h');
      const raylibCode = new TextDecoder().decode(raylibFile.data);
      assert.ok(raylibCode.includes('static const Rectangle hero_rects[2]'));
      assert.ok(raylibCode.includes('#define HERO_ANIM_IDLE_FROM 0'));

      const loveFile = result.files.find(f => f.name === 'hero_love2d.lua');
      const loveCode = new TextDecoder().decode(loveFile.data);
      assert.ok(loveCode.includes('love.graphics.newQuad(0, 0, 4, 4, 8, 4)'));
    },
  },
];
