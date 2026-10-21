import { uid } from '../utils/id.js';

export const BLEND_MODES = [
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'add', 'subtract', 'difference',
];

/** A paint layer or a group (folder). Groups use parentId to form a tree. */
export class Layer {
  constructor(opts = {}) {
    this.id = opts.id || uid('layer');
    this.type = opts.type || 'layer';
    this.name = opts.name || (this.type === 'group' ? 'Group' : 'Layer');
    this.parentId = opts.parentId ?? null;
    this.visible = opts.visible ?? true;
    this.locked = opts.locked ?? false;
    this.lockAlpha = opts.lockAlpha ?? false;
    this.opacity = opts.opacity ?? 255;
    this.blend = opts.blend || 'normal';
    this.reference = opts.reference ?? false;
    this.clipping = opts.clipping ?? false;
    this.expanded = opts.expanded ?? true;
    this.color = opts.color || '#7c6cf5';
    this.userData = opts.userData ?? null;
  }

  clone(remapParent = false) {
    return new Layer({
      ...this,
      parentId: remapParent ? null : this.parentId,
    });
  }
}
