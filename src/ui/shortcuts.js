/**
 * Keyboard shortcuts: defaults, custom overrides, matching and display.
 * A combo is normalized as `Ctrl+Shift+Z`, `Enter`, or `[`.
 */
import { ALL_TOOLS } from './toolDefs.js';

export const SHORTCUT_CATEGORY = {
  tools: 'dialog.shortcuts.tool',
  file: 'menu.file',
  edit: 'menu.edit',
  select: 'menu.select',
  layer: 'menu.layer',
  frame: 'menu.frame',
  view: 'menu.view',
  help: 'common.help',
};

const toolActions = ALL_TOOLS.map((tool) => ({
  id: `tool.${tool.id}`,
  labelKey: tool.labelKey,
  category: 'tools',
  default: tool.shortcut || '',
}));

const actionActions = [
  { id: 'file.new', labelKey: 'menu.new', category: 'file', default: 'Ctrl+N' },
  { id: 'file.open', labelKey: 'menu.open', category: 'file', default: 'Ctrl+O' },
  { id: 'file.save', labelKey: 'menu.save', category: 'file', default: 'Ctrl+S' },
  { id: 'file.saveAs', labelKey: 'menu.saveAs', category: 'file', default: 'Ctrl+Shift+S' },
  { id: 'file.export', labelKey: 'menu.export', category: 'file', default: 'Ctrl+E' },
  { id: 'file.close', labelKey: 'menu.closeTab', category: 'file', default: 'Ctrl+W' },
  { id: 'edit.undo', labelKey: 'menu.undo', category: 'edit', default: 'Ctrl+Z' },
  { id: 'edit.redo', labelKey: 'menu.redo', category: 'edit', default: 'Ctrl+Y' },
  { id: 'edit.copy', labelKey: 'menu.copy', category: 'edit', default: 'Ctrl+C' },
  { id: 'edit.cut', labelKey: 'menu.cut', category: 'edit', default: 'Ctrl+X' },
  { id: 'edit.paste', labelKey: 'menu.paste', category: 'edit', default: 'Ctrl+V' },
  { id: 'edit.pasteNew', labelKey: 'menu.pasteNewLayer', category: 'edit', default: 'Ctrl+Shift+V' },
  { id: 'edit.delete', labelKey: 'menu.deleteSelection', category: 'edit', default: 'Delete' },
  { id: 'select.all', labelKey: 'menu.selectAll', category: 'select', default: 'Ctrl+A' },
  { id: 'select.none', labelKey: 'menu.deselect', category: 'select', default: 'Ctrl+D' },
  { id: 'select.invert', labelKey: 'menu.invertSelection', category: 'select', default: 'Ctrl+Shift+I' },
  { id: 'select.grow', labelKey: 'menu.growSelection', category: 'select', default: '' },
  { id: 'select.shrink', labelKey: 'menu.shrinkSelection', category: 'select', default: '' },
  { id: 'layer.add', labelKey: 'menu.addLayer', category: 'layer', default: 'Ctrl+Shift+N' },
  { id: 'layer.group', labelKey: 'menu.addGroup', category: 'layer', default: '' },
  { id: 'layer.duplicate', labelKey: 'menu.duplicateLayer', category: 'layer', default: 'Ctrl+J' },
  { id: 'layer.delete', labelKey: 'menu.deleteLayer', category: 'layer', default: '' },
  { id: 'layer.merge', labelKey: 'menu.mergeDown', category: 'layer', default: 'Ctrl+M' },
  { id: 'frame.add', labelKey: 'menu.addFrame', category: 'frame', default: '' },
  { id: 'frame.duplicate', labelKey: 'menu.duplicateFrame', category: 'frame', default: '' },
  { id: 'frame.delete', labelKey: 'menu.deleteFrame', category: 'frame', default: '' },
  { id: 'frame.prev', labelKey: 'shortcut.prevFrame', category: 'frame', default: ',' },
  { id: 'frame.next', labelKey: 'shortcut.nextFrame', category: 'frame', default: '.' },
  { id: 'frame.play', labelKey: 'shortcut.play', category: 'frame', default: 'Enter' },
  { id: 'frame.onion', labelKey: 'frames.onion', category: 'frame', default: 'Alt+O' },
  { id: 'view.zoomIn', labelKey: 'shortcut.zoomIn', category: 'view', default: 'Ctrl+=' },
  { id: 'view.zoomOut', labelKey: 'shortcut.zoomOut', category: 'view', default: 'Ctrl+-' },
  { id: 'view.fit', labelKey: 'shortcut.fit', category: 'view', default: 'Ctrl+0' },
  { id: 'view.actual', labelKey: 'viewport.actual', category: 'view', default: 'Ctrl+1' },
  { id: 'view.grid', labelKey: 'shortcut.grid', category: 'view', default: "Ctrl+'" },
  { id: 'view.timeline', labelKey: 'menu.timeline', category: 'view', default: '' },
  { id: 'view.rightPanel', labelKey: 'menu.rightPanel', category: 'view', default: '' },
  { id: 'view.preview', labelKey: 'menu.preview', category: 'view', default: '' },
  { id: 'view.zen', labelKey: 'menu.zen', category: 'view', default: '' },
  { id: 'view.fullscreen', labelKey: 'common.fullscreen', category: 'view', default: 'F11' },
  { id: 'palette.swap', labelKey: 'shortcut.swapColors', category: 'tools', default: 'X' },
  { id: 'brush.decrease', labelKey: 'shortcut.brushDown', category: 'tools', default: '[' },
  { id: 'brush.increase', labelKey: 'shortcut.brushUp', category: 'tools', default: ']' },
  { id: 'nudge.left', labelKey: 'shortcut.nudge', category: 'edit', default: 'ArrowLeft' },
  { id: 'nudge.right', labelKey: 'shortcut.nudge', category: 'edit', default: 'ArrowRight' },
  { id: 'nudge.up', labelKey: 'shortcut.nudge', category: 'edit', default: 'ArrowUp' },
  { id: 'nudge.down', labelKey: 'shortcut.nudge', category: 'edit', default: 'ArrowDown' },
  { id: 'app.commands', labelKey: 'menu.commands', category: 'view', default: 'Ctrl+K' },
  { id: 'app.shortcuts', labelKey: 'menu.shortcuts', category: 'help', default: 'F1' },
  { id: 'app.settings', labelKey: 'menu.preferences', category: 'help', default: 'Ctrl+,' },
  { id: 'app.about', labelKey: 'menu.about', category: 'help', default: '' },
  { id: 'app.welcome', labelKey: 'menu.welcome', category: 'help', default: '' },
];

export const SHORTCUT_ACTIONS = [...toolActions, ...actionActions];
export const SHORTCUT_ACTION_MAP = Object.fromEntries(SHORTCUT_ACTIONS.map((a) => [a.id, a]));
export const DEFAULT_SHORTCUTS = Object.fromEntries(SHORTCUT_ACTIONS.map((a) => [a.id, a.default]));

function normalizeKeyPart(key) {
  if (!key) return '';
  if (key === ' ') return 'Space';
  if (key === 'Esc') return 'Escape';
  if (key === 'Del') return 'Delete';
  if (key === 'Left' || key === 'Right' || key === 'Up' || key === 'Down') return `Arrow${key}`;
  if (key.length === 1) return key.toUpperCase();
  return key;
}

/** Convert a keyboard event into a normalized combo. */
export function eventCombo(event) {
  const key = normalizeKeyPart(event.key);
  if (!key || ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Dead'].includes(key)) return '';
  const parts = [];
  if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');
  parts.push(key);
  return parts.join('+');
}

export function normalizeCombo(combo) {
  if (!combo) return '';
  const parts = String(combo).split('+').map((p) => p.trim()).filter(Boolean);
  const mods = [];
  let key = '';
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower === 'ctrl' || lower === 'control' || lower === 'cmd' || lower === 'command' || lower === 'meta') mods.push('Ctrl');
    else if (lower === 'shift') mods.push('Shift');
    else if (lower === 'alt' || lower === 'option') mods.push('Alt');
    else key = part.length === 1 ? part.toUpperCase() : part;
  }
  const ordered = ['Ctrl', 'Alt', 'Shift'].filter((m) => mods.includes(m));
  return [...ordered, key].filter(Boolean).join('+');
}

export function shortcutFor(store, actionId) {
  if (Object.prototype.hasOwnProperty.call(store.shortcuts || {}, actionId)) {
    return store.shortcuts[actionId] || '';
  }
  return DEFAULT_SHORTCUTS[actionId] || '';
}

export function shortcutMap(store) {
  const map = new Map();
  for (const action of SHORTCUT_ACTIONS) {
    const combo = normalizeCombo(shortcutFor(store, action.id));
    if (combo && !map.has(combo)) map.set(combo, action.id);
  }
  return map;
}

export function findConflict(store, actionId, combo) {
  const normalized = normalizeCombo(combo);
  if (!normalized) return null;
  for (const action of SHORTCUT_ACTIONS) {
    if (action.id === actionId) continue;
    if (normalizeCombo(shortcutFor(store, action.id)) === normalized) return action;
  }
  return null;
}

export function setShortcut(store, actionId, combo) {
  store.setShortcuts({ [actionId]: normalizeCombo(combo) });
}

export function resetShortcuts(store) {
  store.shortcuts = {};
  store._savePrefs?.();
  store.emit('shortcuts:change');
}

export function resetShortcut(store, actionId) {
  const next = { ...(store.shortcuts || {}) };
  delete next[actionId];
  store.shortcuts = next;
  store._savePrefs?.();
  store.emit('shortcuts:change');
}

export function isCustomShortcut(store, actionId) {
  return Object.prototype.hasOwnProperty.call(store.shortcuts || {}, actionId);
}

export function formatShortcut(combo, platform = null) {
  if (!combo) return '—';
  const mac = platform ? platform === 'mac' : (typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform));
  return normalizeCombo(combo)
    .replace('Ctrl', mac ? '⌘' : 'Ctrl')
    .replace('Alt', mac ? '⌥' : 'Alt')
    .replace('Shift', mac ? '⇧' : 'Shift')
    .replace('ArrowLeft', '←')
    .replace('ArrowRight', '→')
    .replace('ArrowUp', '↑')
    .replace('ArrowDown', '↓')
    .replace('Escape', 'Esc')
    .replace(/\+/g, mac ? '' : ' + ');
}

/** Should the shortcut fire while an input is focused? */
export function isEditableTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

/** Shortcuts that remain global inside text fields. */
export const GLOBAL_IN_INPUT = new Set([
  'file.save', 'file.saveAs', 'file.export', 'app.commands', 'app.settings', 'app.shortcuts',
  'edit.undo', 'edit.redo', 'file.open',
]);
