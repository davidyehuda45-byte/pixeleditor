/**
 * Minimal ZIP writer (store method, UTF-8 filenames). Enough for PNG-sequence
 * export and readable by every mainstream unzip implementation.
 */
import { crc32 } from './png.js';

const encoder = new TextEncoder();

function u16(n) { return [n & 255, (n >> 8) & 255]; }
function u32(n) { return [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255]; }

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

function concat(parts) {
  let len = 0;
  for (const p of parts) len += p.length;
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

/**
 * @param {{name:string, data:Uint8Array|string, date?:Date}[]} files
 * @returns {Uint8Array}
 */
export function createZip(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const now = new Date();
  for (const file of files) {
    const name = encoder.encode(file.name.replace(/\\/g, '/'));
    const raw = typeof file.data === 'string' ? encoder.encode(file.data) : file.data;
    const data = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
    const crc = crc32(data);
    const { time, day } = dosDateTime(file.date || now);
    const localHeader = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0),
      ...u16(time), ...u16(day), ...u32(crc), ...u32(data.length), ...u32(data.length),
      ...u16(name.length), ...u16(0),
    ]);
    localParts.push(localHeader, name, data);
    const central = new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0),
      ...u16(time), ...u16(day), ...u32(crc), ...u32(data.length), ...u32(data.length),
      ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(0), ...u32(offset), ...name,
    ]);
    centralParts.push(central);
    offset += localHeader.length + name.length + data.length;
  }
  const centralSize = centralParts.reduce((s, p) => s + p.length, 0);
  const eocd = new Uint8Array([
    ...u32(0x06054b50), ...u16(0), ...u16(0),
    ...u16(files.length), ...u16(files.length),
    ...u32(centralSize), ...u32(offset), ...u16(0),
  ]);
  return concat([...localParts, ...centralParts, eocd]);
}

export function zipBlob(files) {
  return new Blob([createZip(files)], { type: 'application/zip' });
}

/** Read central directory names + local offsets (used by tests). */
export function readZipEntries(bytes) {
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('EOCD not found');
  const count = bytes[eocd + 10] | (bytes[eocd + 11] << 8);
  const centralSize = bytes[eocd + 12] | (bytes[eocd + 13] << 8) | (bytes[eocd + 14] << 16) | (bytes[eocd + 15] << 24);
  const centralOffset = bytes[eocd + 16] | (bytes[eocd + 17] << 8) | (bytes[eocd + 18] << 16) | (bytes[eocd + 19] << 24);
  const entries = [];
  let p = centralOffset;
  for (let i = 0; i < count; i++) {
    if (bytes[p] !== 0x50 || bytes[p + 1] !== 0x4b || bytes[p + 2] !== 0x01 || bytes[p + 3] !== 0x02) throw new Error('Bad central header');
    const method = bytes[p + 10] | (bytes[p + 11] << 8);
    const crc = (bytes[p + 16] | (bytes[p + 17] << 8) | (bytes[p + 18] << 16) | (bytes[p + 19] << 24)) >>> 0;
    const compSize = bytes[p + 20] | (bytes[p + 21] << 8) | (bytes[p + 22] << 16) | (bytes[p + 23] << 24);
    const size = bytes[p + 24] | (bytes[p + 25] << 8) | (bytes[p + 26] << 16) | (bytes[p + 27] << 24);
    const nameLen = bytes[p + 28] | (bytes[p + 29] << 8);
    const extraLen = bytes[p + 30] | (bytes[p + 31] << 8);
    const commentLen = bytes[p + 32] | (bytes[p + 33] << 8);
    const localOffset = bytes[p + 42] | (bytes[p + 43] << 8) | (bytes[p + 44] << 16) | (bytes[p + 45] << 24);
    const name = new TextDecoder().decode(bytes.slice(p + 46, p + 46 + nameLen));
    entries.push({ name, method, crc, compSize, size, localOffset, centralSize });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return { count, centralSize, centralOffset, entries };
}

/** Extract stored (method 0) entry data. */
export function readZipFile(bytes, entry) {
  if (entry.method !== 0) throw new Error('Only stored entries are supported');
  const p = entry.localOffset;
  if (bytes[p] !== 0x50 || bytes[p + 1] !== 0x4b) throw new Error('Bad local header');
  const nameLen = bytes[p + 26] | (bytes[p + 27] << 8);
  const extraLen = bytes[p + 28] | (bytes[p + 29] << 8);
  const start = p + 30 + nameLen + extraLen;
  return bytes.slice(start, start + entry.size);
}
