/**
 * Animated GIF encoder with a hand-written LZW implementation and median-cut
 * quantisation. Also includes a small decoder used by the test-suite.
 */
import { medianCut } from '../core/palette.js';
import { parseHex } from '../utils/color.js';

class ByteWriter {
  constructor() { this.bytes = []; }
  byte(b) { this.bytes.push(b & 255); }
  u16(n) { this.byte(n); this.byte(n >> 8); }
  str(s) { for (let i = 0; i < s.length; i++) this.byte(s.charCodeAt(i)); }
  blob() { return new Uint8Array(this.bytes); }
}

/**
 * GIF LZW compressor. Codes are packed LSB-first and split into sub-blocks.
 * @param {number} minCodeSize
 * @param {Uint8Array} indices
 * @returns {Uint8Array[]} sub-blocks
 */
export function lzwEncode(minCodeSize, indices) {
  minCodeSize = Math.max(2, minCodeSize);
  const clear = 1 << minCodeSize;
  const end = clear + 1;
  const bytes = [];
  let bitBuffer = 0, bitCount = 0;
  let codeSize = minCodeSize + 1;
  let nextCode = end + 1;
  let dict = new Map();

  const emit = (code) => {
    bitBuffer |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      bytes.push(bitBuffer & 255);
      bitBuffer >>= 8;
      bitCount -= 8;
    }
    // GIF's LZW encoder grows the code width after packing, which keeps it in
    // sync with decoders that build their table one code behind.
    if (nextCode > (1 << codeSize) - 1 && codeSize < 12) codeSize++;
  };

  emit(clear);
  if (!indices.length) {
    emit(end);
    if (bitCount > 0) bytes.push(bitBuffer & 255);
    return splitSubBlocks(bytes);
  }
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const c = indices[i];
    const key = (prefix << 8) | c;
    const found = dict.get(key);
    if (found !== undefined) {
      prefix = found;
      continue;
    }
    emit(prefix);
    dict.set(key, nextCode++);
    if (nextCode >= 4096) {
      emit(clear);
      dict = new Map();
      codeSize = minCodeSize + 1;
      nextCode = end + 1;
    }
    prefix = c;
  }
  emit(prefix);
  emit(end);
  if (bitCount > 0) bytes.push(bitBuffer & 255);
  return splitSubBlocks(bytes);
}

function splitSubBlocks(bytes) {
  const blocks = [];
  for (let i = 0; i < bytes.length; i += 255) {
    const chunk = bytes.slice(i, i + 255);
    blocks.push(new Uint8Array([chunk.length, ...chunk]));
  }
  blocks.push(new Uint8Array([0]));
  return blocks;
}

/** Decode one LZW data stream (used by the tests and by decodeGIF). */
export function lzwDecode(minCodeSize, data) {
  const clear = 1 << minCodeSize;
  const end = clear + 1;
  let codeSize = minCodeSize + 1;
  let dict = [];
  const reset = () => {
    dict = [];
    for (let i = 0; i < clear; i++) dict[i] = [i];
    dict[clear] = [];
    dict[end] = [];
    codeSize = minCodeSize + 1;
  };
  reset();
  const out = [];
  let bitPos = 0;
  let previous = null;
  const readCode = () => {
    let code = 0;
    for (let i = 0; i < codeSize; i++) {
      const byte = data[(bitPos >> 3)];
      if (byte === undefined) return -1;
      const bit = (byte >> (bitPos & 7)) & 1;
      code |= bit << i;
      bitPos++;
    }
    return code;
  };
  for (;;) {
    const code = readCode();
    if (code < 0 || code === end) break;
    if (code === clear) { reset(); previous = null; continue; }
    let entry;
    if (dict[code]) entry = dict[code];
    else if (previous) entry = [...previous, previous[0]];
    else break;
    out.push(...entry);
    if (previous) {
      dict.push([...previous, entry[0]]);
      if (dict.length === (1 << codeSize) && codeSize < 12) codeSize++;
    }
    previous = entry;
  }
  return Uint8Array.from(out);
}

function collectColors(frames) {
  const counts = new Map();
  for (const frame of frames) {
    for (let i = 0; i < frame.length; i += 4) {
      if (frame[i + 3] < 128) continue;
      const key = (frame[i] << 16) | (frame[i + 1] << 8) | frame[i + 2];
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return counts;
}

function quantize(frames, maxColors = 255) {
  const counts = collectColors(frames);
  if (counts.size <= maxColors) {
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => [((k >> 16) & 255), ((k >> 8) & 255), (k & 255)]);
  }
  const sample = new Uint8ClampedArray(counts.size * 4);
  let i = 0;
  for (const key of counts.keys()) {
    sample[i * 4] = (key >> 16) & 255;
    sample[i * 4 + 1] = (key >> 8) & 255;
    sample[i * 4 + 2] = key & 255;
    sample[i * 4 + 3] = 255;
    i++;
  }
  return medianCut(sample, maxColors).map((hex) => {
    const [r, g, b] = parseHex(hex);
    return [r, g, b];
  });
}

function nearestIndex(colors, r, g, b, cache) {
  const key = (r << 16) | (g << 8) | b;
  if (cache.has(key)) return cache.get(key);
  let best = 0, bestD = Infinity;
  for (let i = 0; i < colors.length; i++) {
    const c = colors[i];
    const d = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2;
    if (d < bestD) { bestD = d; best = i; if (!d) break; }
  }
  cache.set(key, best);
  return best;
}

/**
 * @param {Uint8ClampedArray[]} frames full-canvas RGBA frames
 * @param {number} width
 * @param {number} height
 * @param {object} opts
 * @returns {Uint8Array}
 */
export function encodeGIF(frames, width, height, opts = {}) {
  const { delay = 100, loop = 0 } = opts;
  if (!frames.length) throw new Error('GIF needs at least one frame');
  const colors = quantize(frames, 255);
  const transparentIndex = colors.length < 256 ? colors.length : 0;
  const tableSize = Math.max(2, 2 ** Math.ceil(Math.log2(colors.length + 1)));
  const w = new ByteWriter();
  w.str('GIF89a');
  w.u16(width);
  w.u16(height);
  w.byte(0x80 | 0x70 | (Math.log2(tableSize) - 1)); // global table, 8-bit colour resolution
  w.byte(0); // background colour index
  w.byte(0); // aspect ratio
  for (let i = 0; i < tableSize; i++) {
    const c = colors[i] || [0, 0, 0];
    w.byte(c[0]); w.byte(c[1]); w.byte(c[2]);
  }
  // Netscape looping extension
  w.byte(0x21); w.byte(0xff); w.byte(11); w.str('NETSCAPE2.0');
  w.byte(3); w.byte(1); w.u16(loop); w.byte(0);
  const cache = new Map();
  for (const frame of frames) {
    w.byte(0x21); w.byte(0xf9); w.byte(4);
    w.byte(0x09); // disposal 2 (restore background) + transparency flag
    w.u16(Math.max(2, Math.round(delay / 10)));
    w.byte(transparentIndex);
    w.byte(0);
    w.byte(0x2c);
    w.u16(0); w.u16(0); w.u16(width); w.u16(height);
    w.byte(0);
    const pixels = new Uint8Array(width * height);
    for (let i = 0; i < pixels.length; i++) {
      const a = frame[i * 4 + 3];
      if (a < 128) { pixels[i] = transparentIndex; continue; }
      pixels[i] = nearestIndex(colors, frame[i * 4], frame[i * 4 + 1], frame[i * 4 + 2], cache);
    }
    const bits = Math.max(2, Math.ceil(Math.log2(tableSize)));
    w.byte(bits);
    const blocks = lzwEncode(bits, pixels);
    for (const block of blocks) for (const b of block) w.byte(b);
  }
  w.byte(0x3b);
  return w.blob();
}

/** Minimal GIF decoder for tests: returns global palette + indexed frames. */
export function decodeGIF(bytes) {
  let p = 0;
  const str = (n) => { let s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(bytes[p++]); return s; };
  if (str(6) !== 'GIF89a') throw new Error('Not GIF89a');
  const width = bytes[p] | (bytes[p + 1] << 8); p += 2;
  const height = bytes[p] | (bytes[p + 1] << 8); p += 2;
  const packed = bytes[p++];
  const bg = bytes[p++]; p++;
  const hasGlobal = packed & 0x80;
  const tableSize = hasGlobal ? 2 ** ((packed & 7) + 1) : 0;
  const palette = [];
  for (let i = 0; i < tableSize; i++) { palette.push([bytes[p], bytes[p + 1], bytes[p + 2]]); p += 3; }
  const frames = [];
  let gce = null;
  while (p < bytes.length) {
    const block = bytes[p++];
    if (block === 0x3b) break;
    if (block === 0x21) {
      const label = bytes[p++];
      if (label === 0xf9) {
        const size = bytes[p++];
        const flags = bytes[p];
        const delay = bytes[p + 1] | (bytes[p + 2] << 8);
        const transparent = bytes[p + 3];
        p += size; p++; // terminator
        gce = { delay, transparent, disposal: (flags >> 2) & 7 };
      } else {
        // Generic extension: sub-block chain terminated by 0x00.
        while (p < bytes.length) {
          const n = bytes[p++];
          if (!n) break;
          p += n;
        }
      }
      continue;
    }
    if (block === 0x2c) {
      p += 4; // left/top
      const fw = bytes[p] | (bytes[p + 1] << 8); p += 2;
      const fh = bytes[p] | (bytes[p + 1] << 8); p += 2;
      const ipacked = bytes[p++];
      const localSize = ipacked & 0x80 ? 2 ** ((ipacked & 7) + 1) : 0;
      let localPalette = palette;
      if (localSize) { localPalette = []; for (let i = 0; i < localSize; i++) { localPalette.push([bytes[p], bytes[p + 1], bytes[p + 2]]); p += 3; } }
      const minCode = bytes[p++];
      const chunks = [];
      while (p < bytes.length) { const n = bytes[p++]; if (!n) break; chunks.push(bytes.slice(p, p + n)); p += n; }
      let total = 0;
      for (const c of chunks) total += c.length;
      const data = new Uint8Array(total);
      let off = 0;
      for (const c of chunks) { data.set(c, off); off += c.length; }
      const indices = lzwDecode(minCode, data);
      frames.push({ width: fw, height: fh, indices, palette: localPalette, delay: gce?.delay || 0, transparent: gce?.transparent ?? -1 });
      continue;
    }
    // Unknown block: attempt to skip a sub-block chain.
    while (p < bytes.length) { const n = bytes[p++]; if (!n) break; p += n; }
  }
  return { width, height, palette, frames, background: bg };
}
