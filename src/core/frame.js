import { uid } from '../utils/id.js';

export class Frame {
  constructor(opts = {}) {
    this.id = opts.id || uid('f');
    this.duration = opts.duration ?? 100;
    this.userData = opts.userData ?? null;
  }

  clone() {
    return new Frame({ id: this.id, duration: this.duration, userData: this.userData });
  }
}

export function createFrame(duration = 100) {
  return new Frame({ duration });
}
