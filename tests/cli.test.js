import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCli } from '../tools/cli.js';
import { PixelDocument } from '../src/core/document.js';
import { Layer } from '../src/core/layer.js';
import { Frame } from '../src/core/frame.js';
import { Cel } from '../src/core/cel.js';
import { stringifyProject } from '../src/io/project.js';

export const cliTests = [
  {
    name: 'CLI --help prints usage guide',
    async fn() {
      const code = await runCli(['--help']);
      assert.equal(code, 0);
    },
  },
  {
    name: 'CLI info and export command produce assets',
    async fn() {
      const tmpDir = path.resolve('tmp_test_cli');
      fs.mkdirSync(tmpDir, { recursive: true });

      const pfxPath = path.join(tmpDir, 'test_hero.pfx');
      const doc = new PixelDocument({ width: 16, height: 16, title: 'cli_hero' });
      const l1 = new Layer({ id: 'l1', name: 'main' });
      const f1 = new Frame({ id: 'f1', duration: 100 });
      const f2 = new Frame({ id: 'f2', duration: 100 });
      doc.layers = [l1];
      doc.frames = [f1, f2];
      doc.tags = [{ name: 'walk', from: 0, to: 1, direction: 'forward' }];

      const cel1 = new Cel({ layerId: 'l1', frameId: 'f1', x: 0, y: 0, width: 16, height: 16 });
      cel1.ensurePixels();
      cel1.pixels[0] = 255; cel1.pixels[1] = 0; cel1.pixels[2] = 0; cel1.pixels[3] = 255;
      const cel2 = new Cel({ layerId: 'l1', frameId: 'f2', x: 0, y: 0, width: 16, height: 16 });
      cel2.ensurePixels();
      cel2.pixels[0] = 0; cel2.pixels[1] = 255; cel2.pixels[2] = 0; cel2.pixels[3] = 255;
      doc.cels.set('l1:f1', cel1);
      doc.cels.set('l1:f2', cel2);

      fs.writeFileSync(pfxPath, stringifyProject(doc));

      // Test info
      const infoCode = await runCli(['info', pfxPath]);
      assert.equal(infoCode, 0);

      // Test sheet export
      const outSheetDir = path.join(tmpDir, 'out_sheet');
      const sheetCode = await runCli(['export', pfxPath, '--sheet', '--out', outSheetDir, '--scale', '2']);
      assert.equal(sheetCode, 0);
      assert.ok(fs.existsSync(path.join(outSheetDir, 'cli_hero.png')));
      assert.ok(fs.existsSync(path.join(outSheetDir, 'cli_hero_aseprite.json')));

      // Test godot export
      const outGodotDir = path.join(tmpDir, 'out_godot');
      const godotCode = await runCli(['export', pfxPath, '--godot', '--out', outGodotDir]);
      assert.equal(godotCode, 0);
      assert.ok(fs.existsSync(path.join(outGodotDir, 'cli_hero.png')));
      assert.ok(fs.existsSync(path.join(outGodotDir, 'cli_hero_spriteframes.tres')));
      const tres = fs.readFileSync(path.join(outGodotDir, 'cli_hero_spriteframes.tres'), 'utf8');
      assert.ok(tres.includes('[gd_resource type="SpriteFrames"'));

      // Cleanup
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {}
    },
  },
];
