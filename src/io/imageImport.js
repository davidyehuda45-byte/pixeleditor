/**
 * Browser-side image decoding and pixel-art conversion. Everything stays in
 * memory; decoded pixels are straight-alpha Uint8ClampedArray buffers.
 */
import { decodeGIF } from './gif.js';
import { sliceSheet } from './spritesheet.js';
import { scaleNearest, ditherThreshold } from '../utils/raster.js';
import { mapToPalette, medianCut } from '../core/palette.js';
import { parseHex } from '../utils/color.js';

function decodeWithImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        resolve({ width: canvas.width, height: canvas.height, data, frames: null });
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gambar tidak dapat didekode.')); };
    img.src = url;
  });
}

async function decodeBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(bitmap, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      bitmap.close?.();
      return { width: canvas.width, height: canvas.height, data };
    } catch {
      // Fall back to <img> below.
    }
  }
  return decodeWithImageElement(file);
}

function gifToFrames(bytes) {
  const gif = decodeGIF(bytes);
  if (!gif?.width || !gif?.height) throw new Error('GIF tidak valid.');
  const frames = [];
  for (const frame of gif.frames) {
    const out = new Uint8ClampedArray(gif.width * gif.height * 4);
    const palette = frame.palette || gif.palette;
    for (let y = 0; y < frame.height; y++) {
      for (let x = 0; x < frame.width; x++) {
        const di = ((y) * gif.width + (x)) * 4;
        if (di + 3 >= out.length) continue;
        const index = frame.indices[y * frame.width + x];
        if (index === frame.transparent) continue;
        const c = palette[index];
        if (!c) continue;
        out[di] = c[0]; out[di + 1] = c[1]; out[di + 2] = c[2]; out[di + 3] = 255;
      }
    }
    frames.push({ width: gif.width, height: gif.height, data: out, duration: Math.max(20, (frame.delay || 10) * 10) });
  }
  return { width: gif.width, height: gif.height, frames, data: frames[0]?.data || new Uint8ClampedArray(gif.width * gif.height * 4) };
}

function ditherToPalette(data, width, paletteColors, pattern = 'bayer4') {
  const palette = paletteColors.map((hex) => parseHex(hex));
  if (!palette.length) return data.slice();
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) { out[i + 3] = 0; continue; }
    const x = (i / 4) % Math.max(1, width);
    const y = Math.floor((i / 4) / Math.max(1, width));
    const sorted = palette
      .map((c) => ({ c, d: (c[0] - data[i]) ** 2 + (c[1] - data[i + 1]) ** 2 + (c[2] - data[i + 2]) ** 2 }))
      .sort((a, b) => a.d - b.d);
    const threshold = ditherThreshold(pattern === 'none' ? 'bayer4' : pattern, x, y);
    const nearest = sorted[0]?.c || [0, 0, 0];
    const second = sorted[1]?.c || nearest;
    const chooseSecond = threshold < 0.5 && sorted[0] && sorted[1];
    const c = chooseSecond ? second : nearest;
    out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = data[i + 3];
  }
  return out;
}

/**
 * Convert a decoded image to pixel art: nearest downscale, optional palette
 * quantisation + ordered dithering. Never uses browser smoothing.
 */
export function convertToPixelArt(source, { targetWidth, targetHeight, palette = null, colorCount = 16, dither = 'none' } = {}) {
  let data = source.data, width = source.width, height = source.height;
  const tw = Math.max(1, Math.min(1024, targetWidth || width));
  const th = Math.max(1, Math.min(1024, targetHeight || height));
  if (tw !== width || th !== height) {
    data = scaleNearest(data, width, height, tw, th);
    width = tw; height = th;
  }
  let colors = palette;
  if (!colors || !colors.length) colors = medianCut(data, Math.max(2, colorCount || 16));
  if (colors.length > 1) {
    if (dither && dither !== 'none') {
      data = ditherToPalette(data, width, colors, dither);
    } else {
      data = mapToPalette(data, colors);
    }
  }
  return { width, height, data, palette: colors };
}

/**
 * Decode a file into frames. Animated GIFs become multiple frames; other
 * formats decode to one frame via createImageBitmap (or <img> fallback).
 */
export async function decodeImageFile(picked) {
  const file = picked?.file;
  if (!file) throw new Error('Berkas gambar tidak ditemukan.');
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.gif')) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const decoded = gifToFrames(bytes);
    if (!decoded.frames.length) throw new Error('GIF tidak memiliki frame.');
    return decoded;
  }
  const decoded = await decodeBitmap(file);
  return { ...decoded, frames: null };
}

/** Build per-frame data from a sprite sheet. */
export function sliceSpriteSheet(decoded, { frameWidth, frameHeight, columns = 0, rows = 0, count = 0, margin = 0, spacing = 0 }) {
  const frames = sliceSheet(decoded, { frameWidth, frameHeight, columns, rows, count, margin, spacing });
  if (!frames.length) throw new Error('Ukuran frame tidak cocok dengan gambar.');
  return frames.map((f, index) => ({
    width: f.width,
    height: f.height,
    data: f.data,
    duration: 100,
    name: `frame_${index + 1}`,
  }));
}
