import { uid } from '../utils/id.js';

/**
 * A cel is the pixel storage for one layer × frame pair.
 * Empty cels are lazy (pixels = null) to keep large projects small.
 */
export class Cel {
  /**
   * @param {object} opts
   * @param {string} opts.layerId
   * @param {string} opts.frameId
   * @param {number} opts.width
   * @param {number} opts.height
   * @param {Uint8ClampedArray|null} [opts.pixels]
   */
  constructor({ layerId, frameId, width, height, x = 0, y = 0, pixels = null, opacity = 255 }) {
    this.id = uid('cel');
    this.layerId = layerId;
    this.frameId = frameId;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.pixels = pixels;
    this.opacity = opacity;
  }

  get empty() {
    return !this.pixels;
  }

  /** Allocate a transparent canvas-sized buffer if needed. */
  ensurePixels() {
    if (!this.pixels) this.pixels = new Uint8ClampedArray(this.width * this.height * 4);
    return this.pixels;
  }

  clone(sharePixels = false) {
    const copy = new Cel({
      layerId: this.layerId,
      frameId: this.frameId,
      width: this.width,
      height: this.height,
      x: this.x,
      y: this.y,
      opacity: this.opacity,
      pixels: sharePixels ? this.pixels : this.pixels ? this.pixels.slice() : null,
    });
    copy.id = this.id;
    return copy;
  }
}

export function createCel(layerId, frameId, width, height, opacity = 255) {
  return new Cel({ layerId, frameId, width, height, opacity });
}
