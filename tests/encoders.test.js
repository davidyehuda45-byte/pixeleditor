import assert from 'node:assert/strict';
import { encodePNG, encodePNGSync, crc32, zlibStore, scaleRGBA } from '../src/io/png.js';
import { encodeGIF, decodeGIF, lzwEncode, lzwDecode } from '../src/io/gif.js';
import { createZip, readZipEntries, readZipFile } from '../src/io/zip.js';

async function inflate(bytes) {
  const ds = new DecompressionStream('deflate');
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();
  return new Uint8Array(await new Response(ds.readable).arrayBuffer());
}

async function decodePNG(bytes) {
  assert.deepEqual([...bytes.slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  let p = 8;
  let width = 0, height = 0;
  const idat = [];
  while (p < bytes.length) {
    const len = (bytes[p] << 24) | (bytes[p + 1] << 16) | (bytes[p + 2] << 8) | bytes[p + 3];
    const type = String.fromCharCode(...bytes.slice(p + 4, p + 8));
    const data = bytes.slice(p + 8, p + 8 + len);
    const expected = (bytes[p + 8 + len] << 24) | (bytes[p + 9 + len] << 16) | (bytes[p + 10 + len] << 8) | bytes[p + 11 + len];
    assert.equal(crc32(bytes.slice(p + 4, p + 8 + len)) >>> 0, expected >>> 0, `CRC ${type}`);
    if (type === 'IHDR') {
      width = (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3];
      height = (data[4] << 24) | (data[5] << 16) | (data[6] << 8) | data[7];
    }
    if (type === 'IDAT') idat.push(data);
    p += 12 + len;
  }
  const raw = await inflate(Buffer.concat(idat));
  const stride = width * 4;
  const out = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    assert.equal(raw[y * (stride + 1)], 0, 'filter 0');
    out.set(raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride), y * stride);
  }
  return { width, height, data: out };
}

function makeImage(w, h) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = (i * 37) & 255;
    data[i * 4 + 1] = (i * 11) & 255;
    data[i * 4 + 2] = (i * 71) & 255;
    data[i * 4 + 3] = i % 3 === 0 ? 0 : 255;
  }
  return data;
}

export const encoderTests = [
  {
    name: 'PNG encoder decodes to identical RGBA (CompressionStream)',
    async fn() {
      const w = 17, h = 9;
      const data = makeImage(w, h);
      const png = await encodePNG(data, w, h);
      const decoded = await decodePNG(png);
      assert.equal(decoded.width, w);
      assert.equal(decoded.height, h);
      assert.deepEqual([...decoded.data], [...data]);
    },
  },
  {
    name: 'PNG stored-block fallback is valid zlib',
    async fn() {
      const w = 3, h = 2;
      const data = makeImage(w, h);
      const png = encodePNGSync(data, w, h);
      const decoded = await decodePNG(png);
      assert.deepEqual([...decoded.data], [...data]);
      const z = zlibStore(new Uint8Array([1, 2, 3]));
      assert.deepEqual([...(await inflate(z))], [1, 2, 3]);
    },
  },
  {
    name: 'LZW round trip with random indices',
    fn() {
      const indices = new Uint8Array(4096);
      let seed = 123456;
      for (let i = 0; i < indices.length; i++) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        indices[i] = seed % 7;
      }
      const blocks = lzwEncode(3, indices);
      const parts = [];
      for (const b of blocks) {
        if (b.length <= 1) continue;
        parts.push(b.slice(1));
      }
      const merged = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
      let offset = 0;
      for (const p of parts) { merged.set(p, offset); offset += p.length; }
      const decoded = lzwDecode(3, merged);
      assert.deepEqual([...decoded], [...indices]);
    },
  },
  {
    name: 'animated GIF encodes with transparency and decodes',
    fn() {
      const w = 4, h = 4;
      const red = new Uint8ClampedArray(w * h * 4);
      const blue = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < w * h; i++) {
        red.set([255, 0, 0, 255], i * 4);
        blue.set([0, 0, 255, i === 0 ? 0 : 255], i * 4);
      }
      const gif = encodeGIF([red, blue], w, h, { delay: 100, loop: 0 });
      const decoded = decodeGIF(gif);
      assert.equal(decoded.width, w);
      assert.equal(decoded.height, h);
      assert.equal(decoded.frames.length, 2);
      assert.equal(decoded.frames[0].indices.length, w * h);
      assert.equal(decoded.frames[1].indices.length, w * h);
      const palette = decoded.frames[0].palette;
      for (let i = 0; i < w * h; i++) {
        const idx = decoded.frames[0].indices[i];
        assert.deepEqual(palette[idx], [255, 0, 0]);
      }
      assert.equal(decoded.frames[1].indices[0], decoded.frames[1].transparent);
      assert.notEqual(decoded.frames[1].indices[1], decoded.frames[1].transparent);
      assert.equal(decoded.frames[0].delay, 10);
    },
  },
  {
    name: 'ZIP has valid central directory and CRCs',
    fn() {
      const a = new TextEncoder().encode('hello');
      const b = new Uint8Array([1, 2, 3, 4, 5]);
      const zip = createZip([
        { name: 'hello.txt', data: a },
        { name: 'binary.bin', data: b },
      ]);
      const listing = readZipEntries(zip);
      assert.equal(listing.count, 2);
      const hello = readZipFile(zip, listing.entries[0]);
      assert.deepEqual([...hello], [...a]);
      assert.equal(listing.entries[0].crc, crc32(a));
      const binary = readZipFile(zip, listing.entries[1]);
      assert.deepEqual([...binary], [...b]);
      assert.equal(listing.entries[1].crc, crc32(b));
    },
  },
  {
    name: 'nearest scale duplicates pixels',
    fn() {
      const data = new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 255]);
      const out = scaleRGBA(data, 2, 1, 2);
      assert.deepEqual([...out], [
        1, 2, 3, 255, 1, 2, 3, 255, 4, 5, 6, 255, 4, 5, 6, 255,
        1, 2, 3, 255, 1, 2, 3, 255, 4, 5, 6, 255, 4, 5, 6, 255,
      ]);
    },
  },
];
