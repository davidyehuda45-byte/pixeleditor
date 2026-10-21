import { floodFillMask, growMask, invertMask, maskBounds } from '../utils/raster.js';

/**
 * Pixel selection mask. A cleared selection has no active pixels; tools treat
 * it as "whole canvas" unless the active tool is a selection tool.
 */
export class Selection {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.mask = new Uint8Array(width * height);
    this.dirty = true;
  }

  get empty() {
    return !this.mask.some((v) => v);
  }

  get bounds() {
    return maskBounds(this.mask, this.width, this.height);
  }

  contains(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    return this.mask[y * this.width + x] === 1;
  }

  clear() {
    this.mask.fill(0);
    this.dirty = true;
    return this;
  }

  selectAll() {
    this.mask.fill(1);
    this.dirty = true;
    return this;
  }

  setMask(mask) {
    if (mask.length !== this.mask.length) throw new Error('Selection size mismatch');
    this.mask.set(mask);
    this.dirty = true;
    return this;
  }

  setRect(x, y, w, h) {
    this.clear();
    this.addRect(x, y, w, h);
    return this;
  }

  addRect(x, y, w, h) {
    const x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.width, Math.ceil(x + w)), y1 = Math.min(this.height, Math.ceil(y + h));
    for (let py = y0; py < y1; py++) for (let px = x0; px < x1; px++) {
      this.mask[py * this.width + px] = 1;
    }
    this.dirty = true;
    return this;
  }

  setEllipse(x, y, w, h) {
    this.clear();
    const cx = x + w / 2, cy = y + h / 2;
    const ax = Math.max(0.5, w / 2), ay = Math.max(0.5, h / 2);
    for (let py = Math.max(0, Math.floor(y)); py < Math.min(this.height, Math.ceil(y + h)); py++) {
      for (let px = Math.max(0, Math.floor(x)); px < Math.min(this.width, Math.ceil(x + w)); px++) {
        const nx = (px + 0.5 - cx) / ax, ny = (py + 0.5 - cy) / ay;
        if (nx * nx + ny * ny <= 1.02) this.mask[py * this.width + px] = 1;
      }
    }
    this.dirty = true;
    return this;
  }

  /** Combine a same-size mask. mode: replace|add|subtract|intersect */
  combine(mask, mode = 'replace') {
    if (mode === 'replace') this.mask = mask.slice();
    else if (mode === 'add') for (let i = 0; i < mask.length; i++) this.mask[i] ||= mask[i];
    else if (mode === 'subtract') for (let i = 0; i < mask.length; i++) if (mask[i]) this.mask[i] = 0;
    else if (mode === 'intersect') for (let i = 0; i < mask.length; i++) this.mask[i] &&= mask[i];
    this.dirty = true;
    return this;
  }

  invert() {
    this.mask = invertMask(this.mask);
    this.dirty = true;
    return this;
  }

  grow(amount) {
    this.mask = growMask(this.mask, this.width, this.height, amount);
    this.dirty = true;
    return this;
  }

  border() {
    const out = new Uint8Array(this.mask.length);
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) {
      const i = y * this.width + x;
      if (!this.mask[i]) continue;
      if (x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1 ||
          !this.mask[i - 1] || !this.mask[i + 1] || !this.mask[i - this.width] || !this.mask[i + this.width]) out[i] = 1;
    }
    this.mask = out;
    this.dirty = true;
    return this;
  }

  /** Magic wand against an RGBA buffer. */
  static magicWand(data, width, height, x, y, opts = {}) {
    return floodFillMask(data, width, height, x, y, opts);
  }

  /** Select all non-transparent pixels of a layer/composite. */
  static fromAlpha(data, width, height, threshold = 1) {
    const mask = new Uint8Array(width * height);
    for (let i = 0; i < mask.length; i++) if (data[i * 4 + 3] >= threshold) mask[i] = 1;
    return mask;
  }

  clone() {
    const s = new Selection(this.width, this.height);
    s.mask.set(this.mask);
    return s;
  }

  toJSON() {
    return { width: this.width, height: this.height, mask: this.mask };
  }
}
