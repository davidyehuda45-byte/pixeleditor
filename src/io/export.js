/**
 * High-level export pipeline. Runs in small asynchronous steps so the UI can
 * show progress and cancel; encoders remain pure modules.
 */
import { renderComposite } from '../core/compositor.js';
import { encodePNG } from './png.js';
import { encodeGIF } from './gif.js';
import { buildSpriteSheet } from './spritesheet.js';
import { buildAsepriteJSON, buildTexturePackerJSON, buildUnitySlices } from './exporters/aseprite.js';
import { buildGodotSpriteFrames } from './exporters/godot.js';
import { buildPhaserAtlas } from './exporters/phaser.js';
import { buildRaylibHeader } from './exporters/raylib.js';
import { buildLove2DAtlas } from './exporters/love2d.js';
import { createZip } from './zip.js';
import { scaleRGBA } from './png.js';

const encoder = new TextEncoder();

export function formatFileName(template, vars = {}) {
  const base = template || '{title}_{frame}';
  return base.replace(/\{(\w+)(?::(\d+))?\}/g, (_, key, pad) => {
    let value = vars[key] ?? '';
    if (pad) value = String(value).padStart(parseInt(pad, 10), '0');
    return String(value);
  }).replace(/[\\/:*?"<>|]/g, '_');
}

function frameIndices(doc, opts) {
  const total = doc.frames.length;
  if (opts.scope === 'current') return [Math.max(0, Math.min(total - 1, opts.frameIndex ?? 0))];
  if (opts.scope === 'tag') {
    const tag = doc.tags.find((t) => t.name === opts.tagName);
    if (!tag) return [0];
    return Array.from({ length: tag.to - tag.from + 1 }, (_, i) => tag.from + i).filter((i) => i >= 0 && i < total);
  }
  if (opts.scope === 'range') {
    const from = Math.max(0, opts.range?.from ?? 0), to = Math.min(total - 1, opts.range?.to ?? total - 1);
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  }
  return Array.from({ length: total }, (_, i) => i);
}

/** Composite the requested frames with optional selection crop. */
export async function gatherFrames(doc, opts = {}, { onProgress, signal } = {}) {
  const indices = frameIndices(doc, opts);
  const includeHidden = !!opts.includeHidden;
  const includeReference = !!opts.includeReference;
  const background = !!opts.background;
  const selection = opts.scope === 'selection' ? doc.selection.bounds : null;
  const cropRect = selection || { x: 0, y: 0, w: doc.width, h: doc.height };
  const frames = [];
  for (let n = 0; n < indices.length; n++) {
    if (signal?.aborted) throw new Error('Ekspor dibatalkan.');
    const frameIndex = indices[n];
    const frame = doc.frames[frameIndex];
    const composite = renderComposite(doc, frame.id, { includeHidden, includeReference, background });
    let data = composite.data;
    let width = doc.width, height = doc.height;
    if (selection) {
      const out = new Uint8ClampedArray(selection.w * selection.h * 4);
      for (let y = 0; y < selection.h; y++) {
        const src = ((selection.y + y) * width + selection.x) * 4;
        out.set(data.subarray(src, src + selection.w * 4), y * selection.w * 4);
      }
      data = out;
      width = selection.w;
      height = selection.h;
    }
    frames.push({ data, width, height, duration: frame.duration, name: `frame_${frameIndex}`, frameIndex });
    if (onProgress) onProgress(n + 1, indices.length);
    if (n % 4 === 3) await new Promise((r) => setTimeout(r, 0));
  }
  return { frames, indices, cropRect };
}

function adjustedTags(doc, indices) {
  const offset = indices[0] ?? 0;
  return doc.tags
    .filter((t) => indices.includes(t.from) || (t.from <= indices[0] && t.to >= indices[0]))
    .map((t) => {
      const covered = indices.filter((i) => i >= t.from && i <= t.to);
      if (!covered.length) return null;
      return { ...t, from: indices.indexOf(covered[0]), to: indices.indexOf(covered[covered.length - 1]) };
    })
    .filter(Boolean);
}

function frameBaseName(opts, doc, tag) {
  return formatFileName(opts.fileNameTemplate || '{title}_{frame}', {
    title: opts.baseName || doc.title || 'sprite',
    frame: '',
    tag: tag || '',
    layer: '',
    slice: '',
  }).replace(/[_\-\s]+$/, '') || 'sprite';
}

/**
 * @param {import('../core/document.js').PixelDocument} doc
 * @param {object} opts
 * @param {{onProgress?:Function, signal?:AbortSignal}} hooks
 * @returns {Promise<{files:{name,data,type}[], sheet:any, width:number, height:number}>}
 */
export async function exportDocument(doc, opts = {}, hooks = {}) {
  const { onProgress, signal } = hooks;
  const format = opts.format || 'png';
  const scale = Math.max(1, Math.min(16, opts.scale || 1));
  const baseName = opts.baseName || (doc.title || 'sprite').replace(/\s+/g, '_');
  const tagName = opts.tagName || '';
  const frameNameTemplate = opts.fileNameTemplate || '{title}_{frame:3}';

  const { frames, indices } = await gatherFrames(doc, opts, {
    onProgress: (done, total) => onProgress?.(Math.round((done / total) * 35), `Render frame ${done}/${total}`),
    signal,
  });
  if (signal?.aborted) throw new Error('Ekspor dibatalkan.');
  const sheetFrames = frames.map((f) => ({
    ...f,
    name: formatFileName(frameNameTemplate, {
      title: baseName, tag: tagName, frame: f.frameIndex + 1, slice: '',
    }),
  }));
  const files = [];
  const tags = adjustedTags(doc, indices);
  const meta = { scale, baseName, indices, tags };

  const makeName = (suffix) => `${baseName}${tagName ? `_${tagName}` : ''}${suffix}`;

  if (format === 'gif') {
    let gifFrames = frames.map((f) => (scale > 1 ? scaleRGBA(f.data, f.width, f.height, scale) : f.data));
    const gif = encodeGIF(gifFrames, frames[0].width * scale, frames[0].height * scale, {
      delay: Math.round(frames.reduce((s, f) => s + f.duration, 0) / frames.length),
      loop: 0,
    });
    files.push({ name: makeName('.gif'), data: gif, type: 'image/gif' });
    return { files, sheet: null, width: frames[0].width * scale, height: frames[0].height * scale, meta };
  }

  if (format === 'png') {
    for (let i = 0; i < frames.length; i++) {
      if (signal?.aborted) throw new Error('Ekspor dibatalkan.');
      const f = frames[i];
      const data = scale > 1 ? scaleRGBA(f.data, f.width, f.height, scale) : f.data;
      const png = await encodePNG(data, f.width * scale, f.height * scale);
      const name = frames.length === 1
        ? makeName('.png')
        : formatFileName(frameNameTemplate, { title: baseName, tag: tagName, frame: f.frameIndex + 1, slice: '' }) + '.png';
      files.push({ name, data: png, type: 'image/png' });
      onProgress?.(35 + Math.round(((i + 1) / frames.length) * 60), `PNG ${i + 1}/${frames.length}`);
      if (i % 3 === 2) await new Promise((r) => setTimeout(r, 0));
    }
    return { files, sheet: null, width: frames[0].width * scale, height: frames[0].height * scale, meta };
  }

  if (format === 'zip') {
    for (let i = 0; i < frames.length; i++) {
      if (signal?.aborted) throw new Error('Ekspor dibatalkan.');
      const f = frames[i];
      const data = scale > 1 ? scaleRGBA(f.data, f.width, f.height, scale) : f.data;
      const png = await encodePNG(data, f.width * scale, f.height * scale);
      const name = formatFileName(frameNameTemplate, { title: baseName, tag: tagName, frame: f.frameIndex + 1, slice: '' }) + '.png';
      files.push({ name, data: png, type: 'image/png' });
      onProgress?.(35 + Math.round(((i + 1) / frames.length) * 55), `PNG ${i + 1}/${frames.length}`);
      if (i % 3 === 2) await new Promise((r) => setTimeout(r, 0));
    }
    const json = buildAsepriteJSON({
      ...buildSpriteSheet(frames, { layout: 'horizontal', padding: 0, scale: 1 }),
      frames: frames.map((f, i) => ({ ...f, x: 0, y: 0, w: f.width, h: f.height, trimX: 0, trimY: 0, trimmed: false, sourceWidth: f.width, sourceHeight: f.height })),
    }, doc, { imageName: '', baseName, scale, frameTags: tags });
    files.push({ name: makeName('_meta.json'), data: encoder.encode(JSON.stringify(json, null, 2)), type: 'application/json' });
    const zip = createZip(files.map((f) => ({ name: f.name, data: f.data })));
    return { files: [{ name: makeName('_png.zip'), data: zip, type: 'application/zip' }], sheet: null, width: 0, height: 0, meta };
  }

  // Sheet based formats.
  const sheet = buildSpriteSheet(sheetFrames, {
    layout: opts.layout || 'horizontal',
    columns: opts.columns || 8,
    padding: opts.padding || 0,
    extrude: opts.extrude || 0,
    trim: !!opts.trim,
    dedupe: !!opts.dedupe,
    powerOfTwo: !!opts.powerOfTwo,
    maxWidth: opts.maxWidth || 8192,
    maxHeight: opts.maxHeight || 8192,
    scale,
  });
  const imageName = makeName('.png');
  const png = await encodePNG(sheet.data, sheet.width, sheet.height);
  files.push({ name: imageName, data: png, type: 'image/png' });
  onProgress?.(60, 'Membuat PNG sheet');

  const effectiveTags = opts.frameTags ? tags : tags;
  if (format === 'sheet' || format === 'json' || format === 'godot' || format === 'phaser' || format === 'raylib' || format === 'love2d') {
    const aseprite = buildAsepriteJSON(sheet, doc, {
      imageName, baseName, scale, variant: opts.jsonVariant || 'array', frameTags: effectiveTags,
    });
    files.push({ name: makeName('_aseprite.json'), data: encoder.encode(JSON.stringify(aseprite, null, 2)), type: 'application/json' });
    const tp = buildTexturePackerJSON(sheet, doc, { imageName, baseName, scale, frameTags: effectiveTags });
    files.push({ name: makeName('_texturepacker.json'), data: encoder.encode(JSON.stringify(tp, null, 2)), type: 'application/json' });
    const unity = buildUnitySlices(sheet, doc, { imageName, baseName, ppu: opts.ppu || 16 });
    files.push({ name: makeName('_unity.json'), data: encoder.encode(JSON.stringify(unity, null, 2)), type: 'application/json' });

    // Phaser 3 Texture Atlas
    const phaser = buildPhaserAtlas(sheet, imageName, { baseName, tags: effectiveTags });
    files.push({ name: makeName('_phaser.json'), data: encoder.encode(phaser.jsonContent), type: 'application/json' });

    // Raylib C header
    const raylibHeader = buildRaylibHeader(sheet, imageName, { baseName, tags: effectiveTags });
    files.push({ name: makeName('_raylib.h'), data: encoder.encode(raylibHeader), type: 'text/plain' });

    // Love2D Lua script
    const love2dScript = buildLove2DAtlas(sheet, imageName, { baseName, tags: effectiveTags });
    files.push({ name: makeName('_love2d.lua'), data: encoder.encode(love2dScript), type: 'text/plain' });
  }
  if (format === 'godot') {
    onProgress?.(70, 'Membuat .tres Godot');
    const tres = buildGodotSpriteFrames(sheet, doc, {
      imagePath: `res://${imageName}`,
      frameTags: effectiveTags,
      baseName,
    });
    files.push({ name: makeName('_spriteframes.tres'), data: encoder.encode(tres), type: 'text/plain' });
  }
  onProgress?.(95, 'Menyelesaikan');
  return { files, sheet, width: sheet.width, height: sheet.height, meta };
}

/** Zip a list of export files (used when multiple downloads are undesirable). */
export function zipExportedFiles(files, name = 'pixelforge_export.zip') {
  return { name, data: createZip(files.map((f) => ({ name: f.name, data: f.data }))), type: 'application/zip' };
}
