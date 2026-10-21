/**
 * Sprite-sheet packing: trim, dedupe, padding, extrusion, power-of-two and
 * horizontal/vertical/grid/packed layouts. Pure typed-array code.
 */
import { trimBounds } from '../utils/raster.js';
import { scaleRGBA } from './png.js';

function hashFrame(rgba, width, height) {
  let h = 2166136261;
  for (let i = 0; i < rgba.length; i += 4) {
    h ^= rgba[i]; h = Math.imul(h, 16777619);
    h ^= rgba[i + 1]; h = Math.imul(h, 16777619);
    h ^= rgba[i + 2]; h = Math.imul(h, 16777619);
    h ^= rgba[i + 3]; h = Math.imul(h, 16777619);
  }
  return `${width}x${height}:${(h >>> 0).toString(16)}:${rgba.length}`;
}

function extract(rgba, width, height, rect) {
  const out = new Uint8ClampedArray(rect.w * rect.h * 4);
  for (let y = 0; y < rect.h; y++) {
    const src = ((rect.y + y) * width + rect.x) * 4;
    out.set(rgba.subarray(src, src + rect.w * 4), y * rect.w * 4);
  }
  return out;
}

function nextPowerOfTwo(n) { let p = 1; while (p < n) p *= 2; return p; }

export function sheetPowerOfTwo(width, height) {
  return { width: nextPowerOfTwo(width), height: nextPowerOfTwo(height) };
}

/**
 * @param {{data:Uint8ClampedArray,width:number,height:number,duration?:number,name?:string}[]} frames
 * @param {object} opts
 */
export function buildSpriteSheet(frames, opts = {}) {
  const {
    layout = 'horizontal',
    columns = 8,
    padding = 0,
    extrude = 0,
    trim = false,
    dedupe = false,
    powerOfTwo = false,
    maxWidth = 8192,
    maxHeight = 8192,
    scale = 1,
  } = opts;
  if (!frames.length) throw new Error('Tidak ada frame untuk diekspor.');
  const prepared = frames.map((frame, index) => {
    let data = frame.data;
    let width = frame.width, height = frame.height;
    if (scale > 1) {
      data = scaleRGBA(data, width, height, scale);
      width *= scale; height *= scale;
    }
    const bounds = trim ? (trimBounds(data, width, height) || { x: 0, y: 0, w: 1, h: 1 }) : { x: 0, y: 0, w: width, h: height };
    const trimmedData = trim || scale > 1 ? extract(data, width, height, bounds) : data;
    return {
      index,
      data: trimmedData,
      width: bounds.w,
      height: bounds.h,
      sourceWidth: width,
      sourceHeight: height,
      trimX: bounds.x, trimY: bounds.y,
      trimmed: bounds.w !== width || bounds.h !== height,
      duration: frame.duration ?? 100,
      name: frame.name || `frame_${index}`,
    };
  });

  // Dedupe identical visual frames, preserving the mapping.
  let unique = prepared;
  let dedupeMap = null;
  if (dedupe) {
    const map = new Map();
    const reverse = new Map();
    unique = [];
    dedupeMap = new Map();
    for (const frame of prepared) {
      const hash = hashFrame(frame.data, frame.width, frame.height);
      if (!map.has(hash)) {
        map.set(hash, unique.length);
        reverse.set(unique.length, []);
        unique.push(frame);
      }
      const target = map.get(hash);
      dedupeMap.set(frame.index, target);
    }
  }

  const gap = Math.max(padding, extrude);
  const maxFrameW = Math.max(...unique.map((f) => f.width));
  const maxFrameH = Math.max(...unique.map((f) => f.height));
  let positions = [];
  let sheetWidth = 0, sheetHeight = 0;

  if (layout === 'horizontal') {
    sheetWidth = unique.reduce((s, f) => s + f.width, 0) + gap * (unique.length + 1);
    sheetHeight = maxFrameH + gap * 2;
    let x = gap;
    for (const f of unique) {
      positions.push({ x, y: gap });
      x += f.width + gap;
    }
  } else if (layout === 'vertical') {
    sheetWidth = maxFrameW + gap * 2;
    sheetHeight = unique.reduce((s, f) => s + f.height, 0) + gap * (unique.length + 1);
    let y = gap;
    for (const f of unique) {
      positions.push({ x: gap, y });
      y += f.height + gap;
    }
  } else if (layout === 'grid') {
    const cols = Math.max(1, Math.min(columns, unique.length));
    const rows = Math.ceil(unique.length / cols);
    const colWidths = Array.from({ length: cols }, (_, c) => Math.max(...unique.filter((_, i) => i % cols === c).map((f) => f.width), 0));
    const rowHeights = Array.from({ length: rows }, (_, r) => Math.max(...unique.slice(r * cols, r * cols + cols).map((f) => f.height), 0));
    sheetWidth = colWidths.reduce((s, w) => s + w, 0) + gap * (cols + 1);
    sheetHeight = rowHeights.reduce((s, h) => s + h, 0) + gap * (rows + 1);
    let y = gap;
    for (let r = 0; r < rows; r++) {
      let x = gap;
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (i >= unique.length) break;
        positions.push({ x, y });
        x += colWidths[c] + gap;
      }
      y += rowHeights[r] + gap;
    }
  } else {
    // Shelf packing (simple, deterministic). Sort by height desc.
    const order = unique.map((f, i) => i).sort((a, b) => unique[b].height - unique[a].height);
    const limit = Math.min(maxWidth, powerOfTwo ? nextPowerOfTwo(Math.max(maxFrameW + gap * 2, 256)) : maxWidth);
    let x = gap, y = gap, shelfH = 0;
    const placed = new Map();
    for (const i of order) {
      const f = unique[i];
      if (x + f.width + gap > limit && x > gap) {
        x = gap; y += shelfH + gap; shelfH = 0;
      }
      placed.set(i, { x, y });
      x += f.width + gap;
      shelfH = Math.max(shelfH, f.height);
    }
    sheetWidth = Math.max(...[...placed.values()].map((p, i) => p.x + unique[i].width + gap));
    sheetHeight = y + shelfH + gap;
    positions = unique.map((_, i) => placed.get(i));
  }

  if (powerOfTwo) {
    const p = sheetPowerOfTwo(sheetWidth, sheetHeight);
    sheetWidth = p.width;
    sheetHeight = p.height;
  }
  if (sheetWidth > maxWidth || sheetHeight > maxHeight) {
    throw new Error(`Sprite sheet ${sheetWidth}×${sheetHeight} melebihi batas ${maxWidth}×${maxHeight}. Kurangi skala atau layout.`);
  }

  const canvas = new Uint8ClampedArray(sheetWidth * sheetHeight * 4);
  unique.forEach((f, i) => {
    const pos = positions[i];
    for (let y = 0; y < f.height; y++) {
      const src = y * f.width * 4;
      const dst = ((pos.y + y) * sheetWidth + pos.x) * 4;
      canvas.set(f.data.subarray(src, src + f.width * 4), dst);
    }
  });

  if (extrude > 0) {
    // Duplicate edge pixels outward, clipped to the sheet.
    for (let i = 0; i < unique.length; i++) {
      const f = unique[i];
      const pos = positions[i];
      for (let e = 1; e <= extrude; e++) {
        // left/right edges
        for (let y = 0; y < f.height; y++) {
          const sy = pos.y + y;
          if (pos.x - e >= 0) {
            const si = (sy * sheetWidth + pos.x) * 4, di = (sy * sheetWidth + pos.x - e) * 4;
            canvas[di] = canvas[si]; canvas[di + 1] = canvas[si + 1]; canvas[di + 2] = canvas[si + 2]; canvas[di + 3] = canvas[si + 3];
          }
          if (pos.x + f.width - 1 + e < sheetWidth) {
            const si = (sy * sheetWidth + pos.x + f.width - 1) * 4, di = (sy * sheetWidth + pos.x + f.width - 1 + e) * 4;
            canvas[di] = canvas[si]; canvas[di + 1] = canvas[si + 1]; canvas[di + 2] = canvas[si + 2]; canvas[di + 3] = canvas[si + 3];
          }
        }
        // top/bottom edges
        for (let x = 0; x < f.width; x++) {
          const sx = pos.x + x;
          if (pos.y - e >= 0) {
            const si = (pos.y * sheetWidth + sx) * 4, di = ((pos.y - e) * sheetWidth + sx) * 4;
            canvas[di] = canvas[si]; canvas[di + 1] = canvas[si + 1]; canvas[di + 2] = canvas[si + 2]; canvas[di + 3] = canvas[si + 3];
          }
          if (pos.y + f.height - 1 + e < sheetHeight) {
            const si = ((pos.y + f.height - 1) * sheetWidth + sx) * 4, di = ((pos.y + f.height - 1 + e) * sheetWidth + sx) * 4;
            canvas[di] = canvas[si]; canvas[di + 1] = canvas[si + 1]; canvas[di + 2] = canvas[si + 2]; canvas[di + 3] = canvas[si + 3];
          }
        }
      }
    }
  }

  const outFrames = prepared.map((f, frameIndex) => {
    const uniqueIndex = dedupeMap ? dedupeMap.get(frameIndex) : frameIndex;
    const u = unique[uniqueIndex];
    const pos = positions[uniqueIndex];
    return {
      index: frameIndex,
      name: f.name,
      x: pos.x, y: pos.y,
      w: u.width, h: u.height,
      sourceWidth: f.sourceWidth, sourceHeight: f.sourceHeight,
      trimX: f.trimX, trimY: f.trimY,
      trimmed: f.trimmed,
      duration: f.duration,
      dedupedTo: dedupeMap ? (dedupeMap.get(frameIndex) === frameIndex ? null : uniqueIndex) : null,
    };
  });

  return {
    data: canvas, width: sheetWidth, height: sheetHeight,
    frames: outFrames,
    uniqueCount: unique.length,
    dedupeMap: dedupeMap ? [...dedupeMap.entries()] : null,
    layout, scale, trim, padding, extrude,
  };
}

/** Split a sheet into frames (for import). */
export function sliceSheet(sheet, opts = {}) {
  const { frameWidth, frameHeight, columns = 0, rows = 0, count = 0, margin = 0, spacing = 0 } = opts;
  const cols = columns || Math.max(1, Math.floor((sheet.width - margin * 2 + spacing) / (frameWidth + spacing)));
  const rr = rows || Math.max(1, Math.floor((sheet.height - margin * 2 + spacing) / (frameHeight + spacing)));
  const total = count || cols * rr;
  const frames = [];
  for (let i = 0; i < total; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    const x = margin + c * (frameWidth + spacing);
    const y = margin + r * (frameHeight + spacing);
    if (x + frameWidth > sheet.width || y + frameHeight > sheet.height) break;
    const data = new Uint8ClampedArray(frameWidth * frameHeight * 4);
    for (let yy = 0; yy < frameHeight; yy++) {
      const src = ((y + yy) * sheet.width + x) * 4;
      data.set(sheet.data.subarray(src, src + frameWidth * 4), yy * frameWidth * 4);
    }
    frames.push({ data, width: frameWidth, height: frameHeight, x, y });
  }
  return frames;
}
