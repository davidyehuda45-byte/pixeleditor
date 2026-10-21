/**
 * Bounded undo/redo stack. Entries are small objects with undo/redo callbacks
 * and an approximate memory size, created by core/commands.js.
 */
export class History {
  constructor(limitBytes = 200 * 1024 * 1024) {
    this.entries = [];
    this.index = 0; // number of applied entries
    this.limitBytes = limitBytes;
    this.memory = 0;
  }

  get canUndo() { return this.index > 0; }
  get canRedo() { return this.index < this.entries.length; }

  push(entry) {
    // Drop redo branch.
    for (const dropped of this.entries.slice(this.index)) this.memory -= dropped.size || 0;
    this.entries = this.entries.slice(0, this.index);
    this.entries.push(entry);
    this.index = this.entries.length;
    this.memory += entry.size || 0;
    this.trim();
  }

  trim() {
    while (this.memory > this.limitBytes && this.entries.length > 1) {
      const removed = this.entries.shift();
      this.memory -= removed.size || 0;
      this.index = Math.max(0, this.index - 1);
    }
  }

  undo() {
    if (!this.canUndo) return null;
    const entry = this.entries[this.index - 1];
    entry.undo();
    this.index--;
    return entry;
  }

  redo() {
    if (!this.canRedo) return null;
    const entry = this.entries[this.index];
    entry.redo();
    this.index++;
    return entry;
  }

  /** Move to an absolute history index (0 = initial state). */
  jumpTo(target) {
    target = Math.max(0, Math.min(this.entries.length, target));
    while (this.index > target) { this.entries[this.index - 1].undo(); this.index--; }
    while (this.index < target) { this.entries[this.index].redo(); this.index++; }
  }

  clear() {
    this.entries = [];
    this.index = 0;
    this.memory = 0;
  }

  describe() {
    return this.entries.map((entry, i) => ({
      label: entry.label,
      index: i,
      applied: i < this.index,
      icon: entry.icon || null,
      size: entry.size || 0,
    }));
  }
}
