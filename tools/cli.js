#!/usr/bin/env node
/**
 * PixelForge Headless CLI.
 * Exports .pfx projects into sprite sheets, PNGs, GIF, and engine formats (Godot/Aseprite/Unity/TexturePacker)
 * entirely without DOM dependencies.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseProject } from '../src/io/project.js';
import { exportDocument } from '../src/io/export.js';

function printHelp() {
  console.log(`
PixelForge CLI - Headless asset exporter

Usage:
  node tools/cli.js export <project.pfx> [options]
  node tools/cli.js info <project.pfx>

Commands:
  export <file>     Export .pfx to sprite sheet, PNG frames, GIF, or engine assets
  info <file>       Display summary info about a .pfx document

Options:
  --out <dir>       Output directory (default: current directory or "build")
  --format <fmt>    Export format: sheet, png, gif, godot, zip (default: sheet)
  --sheet           Shortcut for --format sheet
  --png             Shortcut for --format png
  --gif             Shortcut for --format gif
  --godot           Shortcut for --format godot (includes sprite sheet + .tres)
  --json            Shortcut to ensure Aseprite/TP/Unity JSON metadata is generated
  --scale <n>       Integer scaling factor 1-16 (default: 1)
  --tag <name>      Export only frames within the named tag
  --layout <type>   Sheet layout: horizontal, vertical, grid, packed (default: horizontal)
  --columns <n>     Columns for grid layout (default: 8)
  --padding <n>     Pixel padding between frames (default: 0)
  --extrude <n>     Repeat border pixels by N pixels to avoid texture bleeding (default: 0)
  --trim            Trim transparent outer pixels per frame
  --dedupe          Deduplicate identical frames in the sprite sheet
  --power-of-two    Pad atlas dimensions up to powers of two
  -h, --help        Show this help text
`);
}

function parseArgs(args) {
  const flags = {
    command: 'help',
    file: null,
    out: '.',
    format: 'sheet',
    scale: 1,
    tag: null,
    layout: 'horizontal',
    columns: 8,
    padding: 0,
    extrude: 0,
    trim: false,
    dedupe: false,
    powerOfTwo: false,
    json: false,
  };

  if (!args.length || args[0] === '-h' || args[0] === '--help') {
    flags.command = 'help';
    return flags;
  }

  flags.command = args[0];
  let i = 1;
  while (i < args.length) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') {
      flags.command = 'help';
      return flags;
    }
    if (!flags.file && !arg.startsWith('-')) {
      flags.file = arg;
      i++;
      continue;
    }
    if (arg === '--out') {
      flags.out = args[++i];
    } else if (arg === '--format') {
      flags.format = args[++i];
    } else if (arg === '--sheet') {
      flags.format = 'sheet';
    } else if (arg === '--png') {
      flags.format = 'png';
    } else if (arg === '--gif') {
      flags.format = 'gif';
    } else if (arg === '--godot') {
      flags.format = 'godot';
    } else if (arg === '--json') {
      flags.json = true;
    } else if (arg === '--scale') {
      flags.scale = parseInt(args[++i], 10) || 1;
    } else if (arg === '--tag') {
      flags.tag = args[++i];
    } else if (arg === '--layout') {
      flags.layout = args[++i];
    } else if (arg === '--columns') {
      flags.columns = parseInt(args[++i], 10) || 8;
    } else if (arg === '--padding') {
      flags.padding = parseInt(args[++i], 10) || 0;
    } else if (arg === '--extrude') {
      flags.extrude = parseInt(args[++i], 10) || 0;
    } else if (arg === '--trim') {
      flags.trim = true;
    } else if (arg === '--dedupe') {
      flags.dedupe = true;
    } else if (arg === '--power-of-two' || arg === '--powerOfTwo') {
      flags.powerOfTwo = true;
    }
    i++;
  }
  return flags;
}

export async function runCli(argv = process.argv.slice(2)) {
  const flags = parseArgs(argv);

  if (flags.command === 'help' || !flags.command) {
    printHelp();
    return 0;
  }

  if (!flags.file) {
    console.error('Error: Masukkan path berkas .pfx.');
    printHelp();
    return 1;
  }

  const filePath = path.resolve(flags.file);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: Berkas tidak ditemukan: ${filePath}`);
    return 1;
  }

  let text;
  try {
    text = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`Error membaca berkas: ${err.message}`);
    return 1;
  }

  let doc;
  try {
    doc = parseProject(text);
  } catch (err) {
    console.error(`Error mem-parsing .pfx: ${err.message}`);
    return 1;
  }

  if (flags.command === 'info') {
    console.log(`Document: ${doc.title || 'Untitled'}`);
    console.log(`Dimensions: ${doc.width}x${doc.height}`);
    console.log(`Frames: ${doc.frames.length}`);
    console.log(`Layers: ${doc.layers.length} (${doc.layers.map((l) => l.name).join(', ')})`);
    console.log(`Tags: ${doc.tags.length ? doc.tags.map((t) => `${t.name} [${t.from}..${t.to}]`).join(', ') : 'none'}`);
    console.log(`Slices: ${doc.slices.length ? doc.slices.map((s) => s.name).join(', ') : 'none'}`);
    return 0;
  }

  if (flags.command === 'export') {
    const outDir = path.resolve(flags.out || 'build');
    fs.mkdirSync(outDir, { recursive: true });

    const exportOpts = {
      format: flags.format,
      scale: flags.scale,
      baseName: (doc.title || path.basename(filePath, path.extname(filePath))).replace(/\s+/g, '_'),
      scope: flags.tag ? 'tag' : 'all',
      tagName: flags.tag,
      layout: flags.layout,
      columns: flags.columns,
      padding: flags.padding,
      extrude: flags.extrude,
      trim: flags.trim,
      dedupe: flags.dedupe,
      powerOfTwo: flags.powerOfTwo,
    };

    console.log(`Mengekspor ${doc.title || 'dokumen'} [format: ${flags.format}, skala: ${flags.scale}x]...`);
    const result = await exportDocument(doc, exportOpts);

    for (const file of result.files) {
      const dest = path.join(outDir, file.name);
      fs.writeFileSync(dest, Buffer.from(file.data));
      console.log(`  ✓ ${file.name} (${file.data.length} byte)`);
    }

    console.log(`Selesai: ${result.files.length} berkas disimpan ke ${outDir}`);
    return 0;
  }

  console.error(`Perintah tidak dikenal: ${flags.command}`);
  printHelp();
  return 1;
}

// When invoked directly from CLI
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) {
  runCli().then((code) => {
    if (code !== 0) process.exit(code);
  });
}
