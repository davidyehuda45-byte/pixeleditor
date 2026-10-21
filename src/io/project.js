/**
 * PixelForge project format (.pfx). JSON + base64 RLE-compressed RGBA cels.
 * All functions are synchronous and DOM-free so the CLI and tests can use them.
 */
import { PixelDocument } from '../core/document.js';
import { Layer } from '../core/layer.js';
import { Frame } from '../core/frame.js';
import { Cel } from '../core/cel.js';
import { Palette, PaletteSet } from '../core/palette.js';
import { Selection } from '../core/selection.js';

export const PFX_VERSION = 1;
export const PFX_FORMAT = 'pixelforge';

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function bytesToBase64(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1], c = bytes[i + 2];
    out += B64[a >> 2];
    out += B64[((a & 3) << 4) | ((b ?? 0) >> 4)];
    out += b === undefined ? '=' : B64[((b & 15) << 2) | ((c ?? 0) >> 6)];
    out += c === undefined ? '=' : B64[c & 63];
  }
  return out;
}

export function base64ToBytes(text) {
  const clean = String(text).replace(/[^A-Za-z0-9+/=]/g, '');
  const out = [];
  for (let i = 0; i < clean.length; i += 4) {
    const n1 = B64.indexOf(clean[i]);
    const n2 = B64.indexOf(clean[i + 1]);
    const n3 = clean[i + 2] === '=' ? -1 : B64.indexOf(clean[i + 2]);
    const n4 = clean[i + 3] === '=' ? -1 : B64.indexOf(clean[i + 3]);
    if (n1 < 0 || n2 < 0) throw new Error('Base64 tidak valid.');
    out.push((n1 << 2) | (n2 >> 4));
    if (n3 >= 0) out.push(((n2 & 15) << 4) | (n3 >> 2));
    if (n4 >= 0) out.push(((n3 & 3) << 6) | n4);
  }
  return Uint8Array.from(out);
}

/** Run-length encode RGBA. Format: uint32 count + RGBA, repeated. */
export function rleEncode(rgba) {
  const view = new DataView(new ArrayBuffer(4));
  const parts = [];
  let runStart = 0;
  const pixel = (i) => (rgba[i] << 24) | (rgba[i + 1] << 16) | (rgba[i + 2] << 8) | rgba[i + 3];
  let runColor = rgba.length >= 4 ? pixel(0) : 0;
  for (let i = 4; i <= rgba.length; i += 4) {
    const color = i < rgba.length ? pixel(i) : -1;
    if (color !== runColor) {
      const count = (i - runStart) / 4;
      view.setUint32(0, count, true);
      parts.push(new Uint8Array(view.buffer.slice(0)), rgba.subarray(runStart, i));
      runStart = i;
      runColor = color;
    }
  }
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

export function rleDecode(bytes, expectedLength) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const out = new Uint8ClampedArray(expectedLength);
  let p = 0, o = 0;
  while (p + 8 <= bytes.length && o < expectedLength) {
    const count = view.getUint32(p, true); p += 4;
    const r = bytes[p], g = bytes[p + 1], b = bytes[p + 2], a = bytes[p + 3]; p += 4;
    const n = Math.min(count, (expectedLength - o) / 4);
    for (let i = 0; i < n; i++) {
      out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = a;
      o += 4;
    }
  }
  if (o !== expectedLength) throw new Error(`Data piksel tidak lengkap (${o}/${expectedLength}).`);
  return out;
}

export function encodeCelData(pixels) {
  return bytesToBase64(rleEncode(pixels));
}

export function decodeCelData(text, width, height) {
  return rleDecode(base64ToBytes(text), width * height * 4);
}

/** Serialise a document to a plain JS object ready for JSON.stringify. */
export function serializeProject(doc) {
  const celIds = new Map();
  const cels = [];
  for (const [key, cel] of doc.cels) {
    const [layerId, frameId] = key.split('|');
    if (!doc.getLayer(layerId) || !doc.getFrame(frameId)) continue;
    if (celIds.has(cel)) {
      cels.push({ layer: layerId, frame: frameId, source: celIds.get(cel) });
    } else {
      const id = cel.id || `cel_${celIds.size + 1}`;
      celIds.set(cel, id);
      const record = {
        id, layer: layerId, frame: frameId, x: cel.x, y: cel.y,
        w: cel.width, h: cel.height, opacity: cel.opacity,
      };
      if (cel.pixels) record.data = encodeCelData(cel.pixels);
      cels.push(record);
    }
  }
  return {
    format: PFX_FORMAT,
    version: PFX_VERSION,
    encoding: 'rle-rgba',
    meta: {
      title: doc.title,
      created: doc.created,
      modified: doc.modified,
      app: 'PixelForge 1.0.0',
    },
    canvas: {
      width: doc.width, height: doc.height,
      pixelAspect: doc.pixelAspect || [1, 1],
      background: doc.background,
    },
    palette: {
      active: doc.palette.palettes[doc.palette.active]?.name || 'main',
      palettes: doc.palette.palettes.map((p) => ({ name: p.name, colors: p.colors, locked: p.locked })),
      indexed: doc.palette.indexed,
    },
    frames: doc.frames.map((f) => ({ id: f.id, duration: f.duration, userData: f.userData })),
    layers: doc.layers.map((l) => ({
      id: l.id, type: l.type, name: l.name, parentId: l.parentId,
      visible: l.visible, locked: l.locked, lockAlpha: l.lockAlpha,
      opacity: l.opacity, blend: l.blend, reference: l.reference,
      clipping: l.clipping, expanded: l.expanded, color: l.color,
      userData: l.userData,
    })),
    cels,
    tags: doc.tags,
    slices: doc.slices,
    hitboxes: doc.hitboxes,
    anchors: doc.anchors,
    grid: doc.grid,
    guides: doc.guides,
    userData: doc.userData,
  };
}

export function stringifyProject(doc) {
  return JSON.stringify(serializeProject(doc));
}

export function parseProject(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Berkas proyek bukan JSON yang valid.');
  }
  return deserializeProject(data);
}

function assert(condition, message) {
  if (!condition) throw new Error(`Berkas .pfx rusak: ${message}`);
}

/** Migrations apply in order to old schema versions. */
const MIGRATIONS = {
  // 1 → 2 would live here. Current version is 1.
};

export function deserializeProject(data) {
  assert(data && typeof data === 'object', 'root harus objek');
  assert(data.format === PFX_FORMAT, 'format bukan "pixelforge"');
  assert(Number.isInteger(data.version) && data.version >= 1, 'versi tidak valid');
  assert(data.version <= PFX_VERSION, `versi ${data.version} lebih baru dari aplikasi ini (${PFX_VERSION})`);
  let migrated = data;
  for (let v = data.version; v < PFX_VERSION; v++) {
    if (!MIGRATIONS[v]) throw new Error(`Tidak ada migrasi dari versi ${v}.`);
    migrated = MIGRATIONS[v](migrated);
  }
  const canvas = migrated.canvas || {};
  const width = canvas.width, height = canvas.height;
  assert(Number.isInteger(width) && Number.isInteger(height) && width >= 1 && height >= 1 && width <= 4096 && height <= 4096, 'ukuran kanvas tidak valid');
  assert(Array.isArray(migrated.frames) && migrated.frames.length > 0, 'frames kosong');
  assert(Array.isArray(migrated.layers) && migrated.layers.length > 0, 'layers kosong');
  assert(Array.isArray(migrated.cels), 'cels harus array');

  const palettes = [];
  if (migrated.palette?.palettes?.length) {
    for (const p of migrated.palette.palettes) {
      if (!p || typeof p.name !== 'string' || !Array.isArray(p.colors)) continue;
      const colors = p.colors.filter((c) => typeof c === 'string' && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(c));
      palettes.push(new Palette({ name: p.name, colors, locked: !!p.locked }));
    }
  }
  if (!palettes.length) palettes.push(new Palette({ name: 'main', colors: ['#000000', '#ffffff'] }));
  const activeName = migrated.palette?.active;
  const active = Math.max(0, palettes.findIndex((p) => p.name === activeName));
  const palette = new PaletteSet({ palettes, active, indexed: !!migrated.palette?.indexed });

  const layers = migrated.layers.map((l, i) => {
    assert(l && typeof l.id === 'string', `layer #${i} tanpa id`);
    return new Layer({
      id: l.id,
      type: l.type === 'group' ? 'group' : 'layer',
      name: typeof l.name === 'string' ? l.name.slice(0, 200) : `Layer ${i + 1}`,
      parentId: typeof l.parentId === 'string' ? l.parentId : null,
      visible: l.visible !== false,
      locked: !!l.locked,
      lockAlpha: !!l.lockAlpha,
      opacity: Number.isFinite(l.opacity) ? Math.max(0, Math.min(255, l.opacity)) : 255,
      blend: typeof l.blend === 'string' ? l.blend : 'normal',
      reference: !!l.reference,
      clipping: !!l.clipping,
      expanded: l.expanded !== false,
      color: typeof l.color === 'string' ? l.color : '#7c6cf5',
      userData: l.userData ?? null,
    });
  });
  const layerIds = new Set(layers.map((l) => l.id));
  assert(layerIds.size === layers.length, 'id layer duplikat');
  for (const l of layers) if (l.parentId && !layerIds.has(l.parentId)) l.parentId = null;

  const frames = migrated.frames.map((f, i) => {
    assert(f && typeof f.id === 'string', `frame #${i} tanpa id`);
    return new Frame({ id: f.id, duration: Math.max(10, Math.min(10000, Number(f.duration) || 100)), userData: f.userData ?? null });
  });
  const frameIds = new Set(frames.map((f) => f.id));
  assert(frameIds.size === frames.length, 'id frame duplikat');

  const cels = new Map();
  const byId = new Map();
  for (const c of migrated.cels) {
    if (!c || !layerIds.has(c.layer) || !frameIds.has(c.frame)) continue;
    const key = PixelDocument.celKey(c.layer, c.frame);
    if (c.source) {
      const source = byId.get(c.source);
      assert(source, `cel sumber "${c.source}" tidak ditemukan`);
      assert(cels.has(PixelDocument.celKey(source.layerId, source.frameId)), 'cel sumber belum dibaca');
      cels.set(key, source);
      continue;
    }
    const w = Number.isInteger(c.w) && c.w > 0 ? c.w : width;
    const h = Number.isInteger(c.h) && c.h > 0 ? c.h : height;
    let pixels = null;
    if (c.data) {
      try {
        pixels = decodeCelData(c.data, w, h);
      } catch (err) {
        throw new Error(`Berkas .pfx rusak: data piksel cel ${c.layer}/${c.frame} tidak valid (${err.message}).`);
      }
    }
    const cel = new Cel({
      layerId: c.layer, frameId: c.frame, width: w, height: h,
      x: Number.isInteger(c.x) ? c.x : 0, y: Number.isInteger(c.y) ? c.y : 0,
      opacity: Number.isFinite(c.opacity) ? Math.max(0, Math.min(255, c.opacity)) : 255,
      pixels,
    });
    if (typeof c.id === 'string') { cel.id = c.id; byId.set(c.id, cel); }
    else { byId.set(cel.id, cel); }
    cels.set(key, cel);
  }
  // Ensure every layer/frame pair has a cel object (empty if absent).
  for (const layer of layers) {
    if (layer.type === 'group') continue;
    for (const frame of frames) {
      if (!cels.has(PixelDocument.celKey(layer.id, frame.id))) {
        cels.set(PixelDocument.celKey(layer.id, frame.id), new Cel({ layerId: layer.id, frameId: frame.id, width, height }));
      }
    }
  }

  const doc = new PixelDocument({
    title: typeof migrated.meta?.title === 'string' ? migrated.meta.title : 'Untitled',
    width, height,
    background: typeof canvas.background === 'string' ? canvas.background : null,
    pixelAspect: Array.isArray(canvas.pixelAspect) ? canvas.pixelAspect : [1, 1],
    layers, frames, cels,
    tags: Array.isArray(migrated.tags) ? migrated.tags : [],
    slices: Array.isArray(migrated.slices) ? migrated.slices : [],
    hitboxes: Array.isArray(migrated.hitboxes) ? migrated.hitboxes : [],
    anchors: Array.isArray(migrated.anchors) ? migrated.anchors : [],
    guides: Array.isArray(migrated.guides) ? migrated.guides : [],
    grid: migrated.grid && Number.isFinite(migrated.grid.w) ? migrated.grid : { x: 0, y: 0, w: 16, h: 16 },
    palette,
    selection: new Selection(width, height),
    userData: migrated.userData ?? null,
    created: typeof migrated.meta?.created === 'string' ? migrated.meta.created : new Date().toISOString(),
    modified: typeof migrated.meta?.modified === 'string' ? migrated.meta.modified : new Date().toISOString(),
  });
  return doc;
}

/** Produce a stable fingerprint used by tests/tests of round trips. */
export function projectFingerprint(doc) {
  const data = serializeProject(doc);
  // Replace cell ids so independent documents compare equal.
  return JSON.stringify({ ...data, cels: data.cels.map((c) => ({ ...c, id: undefined })) });
}
