/**
 * Self-contained PNG encoder (RGBA8). Uses CompressionStream for the zlib
 * stream when available and falls back to uncompressed DEFLATE blocks so the
 * encoder also works in Node tests and in old Safari.
 */
const SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

let crcTable = null;
function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c >>> 0;
  }
  return crcTable;
}

export function crc32(bytes) {
  const table = getCrcTable();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = table[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function adler32(bytes) {
  let a = 1, b = 0;
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function u32(n) {
  return new Uint8Array([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);
}

function concat(parts) {
  let length = 0;
  for (const p of parts) length += p.length;
  const out = new Uint8Array(length);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

function chunk(type, data) {
  const typeBytes = new Uint8Array([...type].map((c) => c.charCodeAt(0)));
  const crc = crc32(concat([typeBytes, data]));
  return concat([u32(data.length), typeBytes, data, u32(crc)]);
}

/** DEFLATE "stored" blocks plus zlib header/adler; valid but uncompressed. */
export function zlibStore(raw) {
  const blocks = [];
  let offset = 0;
  do {
    const len = Math.min(65535, raw.length - offset);
    const final = offset + len >= raw.length ? 1 : 0;
    const header = new Uint8Array(5);
    header[0] = final;
    header[1] = len & 255;
    header[2] = (len >> 8) & 255;
    header[3] = ~len & 255;
    header[4] = (~len >> 8) & 255;
    blocks.push(header, raw.subarray(offset, offset + len));
    offset += len;
  } while (offset < raw.length);
  const zlibHeader = new Uint8Array([0x78, 0x01]);
  const adler = u32(adler32(raw));
  return concat([zlibHeader, ...blocks, adler]);
}

function scanlines(rgba, width, height) {
  // One filter byte (0 = none) per scanline.
  const stride = width * 4;
  const out = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    out[y * (stride + 1)] = 0;
    out.set(rgba.subarray(y * stride, y * stride + stride), y * (stride + 1) + 1);
  }
  return out;
}

async function compressZlib(raw) {
  if (typeof CompressionStream === 'undefined') return zlibStore(raw);
  try {
    const cs = new CompressionStream('deflate');
    const writer = cs.writable.getWriter();
    writer.write(raw);
    writer.close();
    const buffer = await new Response(cs.readable).arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return zlibStore(raw);
  }
}

function buildPNG(width, height, compressed) {
  const ihdr = concat([
    u32(width), u32(height),
    new Uint8Array([8, 6, 0, 0, 0]), // 8-bit, RGBA, deflate, adaptive, no interlace
  ]);
  return concat([
    SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', new Uint8Array(0)),
  ]);
}

/** @returns {Promise<Uint8Array>} */
export async function encodePNG(rgba, width, height) {
  const raw = scanlines(rgba, width, height);
  const compressed = await compressZlib(raw);
  return buildPNG(width, height, compressed);
}

/** Deterministic synchronous encoder (stored DEFLATE blocks). */
export function encodePNGSync(rgba, width, height) {
  return buildPNG(width, height, zlibStore(scanlines(rgba, width, height)));
}

export function encodePNGBlob(rgba, width, height) {
  return encodePNG(rgba, width, height).then((bytes) => new Blob([bytes], { type: 'image/png' }));
}

export function pngDataURL(rgba, width, height) {
  const bytes = encodePNGSync(rgba, width, height);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:image/png;base64,${btoa(binary)}`;
}

/** Nearest-neighbour scale used by export. */
export function scaleRGBA(rgba, width, height, scale) {
  if (scale === 1) return rgba;
  const nw = width * scale, nh = height * scale;
  const out = new Uint8ClampedArray(nw * nh * 4);
  for (let y = 0; y < nh; y++) {
    const sy = (y / scale) | 0;
    for (let x = 0; x < nw; x++) {
      const sx = (x / scale) | 0;
      const si = (sy * width + sx) * 4, di = (y * nw + x) * 4;
      out[di] = rgba[si]; out[di + 1] = rgba[si + 1]; out[di + 2] = rgba[si + 2]; out[di + 3] = rgba[si + 3];
    }
  }
  return out;
}
