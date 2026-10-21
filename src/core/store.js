import { PixelDocument } from './document.js';
import { History } from './history.js';
import { uid } from '../utils/id.js';

const STORAGE_KEY = 'pixelforge:prefs:v1';

export const DEFAULT_UI = {
  tool: 'pencil',
  previousTool: 'pencil',
  primary: '#f4f4f4',
  secondary: '#1a1c2c',
  brushSize: 1,
  brushShape: 'round',
  brushOpacity: 255,
  symmetry: 'none',
  symmetrySlices: 4,
  symmetryAxisX: null,
  symmetryAxisY: null,
  tiled: false,
  pixelPerfect: true,
  lockAlpha: false,
  contiguous: true,
  tolerance: 0,
  fillSource: 'layer',
  dither: 'none',
  ditherDensity: 0.5,
  shapeFill: false,
  shapeThickness: 1,
  textFont: '5x7',
  textSize: 1,
  pressureSize: true,
  showGrid: true,
  gridOverlayColor: '#ffffff22',
  showGuides: true,
  showOnion: false,
  onionBefore: 1,
  onionAfter: 1,
  onionOpacity: 0.35,
  checkerSize: 8,
  checkerColorA: '#20222c',
  checkerColorB: '#2a2d3a',
  theme: 'dark',
  uiScale: 'normal',
  language: 'id',
  showPreview: true,
  previewBg: 'checker',
  previewScale: 2,
  showTimeline: true,
  showRightPanel: true,
  zen: false,
  autoSave: true,
  autoSaveInterval: 30,
  rightPanelWidth: 320,
  timelineHeight: 224,
  showColorPanel: true,
  showPalettePanel: true,
  showLayersPanel: true,
  selectionMode: 'replace',
  exportScale: 1,
  exportPadding: 0,
  exportExtrude: 0,
  exportLayout: 'horizontal',
  exportJsonVariant: 'array',
  snapToGrid: false,
  snapToGuides: true,
  recentColors: [],
  pickerSource: 'composite',
  eraserMode: 'transparent',
  fillMode: 'solid',
  gradientType: 'linear',
  gradientSnapPalette: true,
  curveType: 'cubic',
  sprayDensity: 6,
  textAlign: 'left',
  selectWandContiguous: true,
  selectWandConnectivity: 4,
};

const PERSIST_KEYS = [
  'primary', 'secondary', 'brushSize', 'brushShape', 'symmetry', 'symmetrySlices',
  'tiled', 'pixelPerfect', 'lockAlpha', 'dither', 'showGrid', 'theme', 'uiScale', 'language',
  'showPreview', 'previewBg', 'previewScale', 'autoSave', 'autoSaveInterval',
  'gridOverlayColor', 'checkerSize', 'checkerColorA', 'checkerColorB',
  'exportScale', 'exportPadding', 'exportExtrude', 'exportLayout', 'exportJsonVariant',
  'showTimeline', 'showRightPanel', 'recentColors', 'pickerSource', 'eraserMode',
  'fillMode', 'gradientType', 'gradientSnapPalette', 'curveType', 'sprayDensity',
  'textAlign', 'selectWandContiguous', 'selectWandConnectivity', 'pressureSize',
  'rightPanelWidth', 'timelineHeight', 'showColorPanel', 'showPalettePanel',
  'showLayersPanel', 'snapToGrid', 'snapToGuides', 'zen',
];

export class AppStore {
  constructor({ storage = null } = {}) {
    this.storage = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
    this.sessions = [];
    this.activeIndex = -1;
    this.ui = { ...DEFAULT_UI };
    this.toasts = [];
    this.dialog = null;
    this.confirmState = null;
    this.revision = 0;
    this.listeners = new Set();
    this.shortcuts = {};
    this._loadPrefs();
    this._lastSave = 0;
  }

  subscribe = (fn) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = () => this.revision;

  /** Ephemeral events (cursor/viewport) don't trigger React renders. */
  emit(type, data = {}) {
    const ephemeral = type === 'cursor' || type === 'viewport';
    if (!ephemeral) this.revision++;
    const event = { type, ...data };
    for (const fn of this.listeners) fn(event);
  }

  notify(type, data) { this.emit(type, data); }

  get activeSession() {
    return this.sessions[this.activeIndex] || null;
  }

  get doc() {
    return this.activeSession?.doc || null;
  }

  get history() {
    return this.activeSession?.history || null;
  }

  get activeLayer() {
    const s = this.activeSession;
    return s ? s.doc.getLayer(s.activeLayerId) || s.doc.layers[s.doc.layers.length - 1] : null;
  }

  get activeFrame() {
    const s = this.activeSession;
    return s ? s.doc.getFrame(s.activeFrameId) || s.doc.frames[0] : null;
  }

  get activeFrameIndex() {
    const s = this.activeSession;
    return s ? Math.max(0, s.doc.frameIndex(s.activeFrameId)) : 0;
  }

  get dirty() {
    return !!this.activeSession?.dirty;
  }

  createSession(doc, opts = {}) {
    const session = {
      id: uid('sess'),
      doc,
      history: new History(opts.historyLimit || 200 * 1024 * 1024),
      activeLayerId: doc.layers[doc.layers.length - 1]?.id || null,
      activeFrameId: doc.frames[0]?.id || null,
      view: { zoom: opts.zoom || 8, panX: 0, panY: 0, fitted: false },
      fileName: opts.fileName || `${doc.title || 'Untitled'}.pfx`,
      fileHandle: opts.fileHandle || null,
      dirty: opts.dirty ?? false,
      savedAt: opts.savedAt || null,
      autosaveAt: null,
    };
    this.sessions.push(session);
    this.activeIndex = this.sessions.length - 1;
    this.emit('session:open', { session });
    return session;
  }

  setActiveSession(index) {
    if (index < 0 || index >= this.sessions.length || index === this.activeIndex) return;
    this.activeIndex = index;
    this.emit('session:switch', { session: this.activeSession });
  }

  closeSession(id) {
    const index = this.sessions.findIndex((s) => s.id === id);
    if (index < 0) return;
    this.sessions.splice(index, 1);
    if (!this.sessions.length) {
      this.activeIndex = -1;
      this.emit('session:empty');
      return;
    }
    this.activeIndex = Math.min(this.activeIndex, this.sessions.length - 1);
    this.emit('session:close', { index });
  }

  closeAll() {
    this.sessions = [];
    this.activeIndex = -1;
    this.emit('session:empty');
  }

  setActiveLayer(id) {
    const s = this.activeSession;
    if (!s || !s.doc.getLayer(id)) return;
    s.activeLayerId = id;
    this.emit('layer:active', { layerId: id });
  }

  setActiveFrame(id) {
    const s = this.activeSession;
    if (!s || !s.doc.getFrame(id)) return;
    s.activeFrameId = id;
    this.emit('frame:active', { frameId: id });
  }

  setZoom(zoom) {
    const s = this.activeSession;
    if (!s) return;
    s.view.zoom = Math.max(0.5, Math.min(64, zoom));
    this.emit('viewport');
  }

  setView(view) {
    const s = this.activeSession;
    if (!s) return;
    Object.assign(s.view, view);
    this.emit('viewport');
  }

  markDirty() {
    const s = this.activeSession;
    if (!s) return;
    s.dirty = true;
    s.doc.modified = new Date().toISOString();
    this.emit('doc:dirty');
  }

  markSaved(fileName, handle = undefined) {
    const s = this.activeSession;
    if (!s) return;
    s.dirty = false;
    s.savedAt = Date.now();
    if (fileName) s.fileName = fileName;
    if (handle !== undefined) s.fileHandle = handle;
    this.emit('doc:saved', { fileName: s.fileName });
  }

  setUI(patch) {
    this.ui = { ...this.ui, ...patch };
    this._savePrefs();
    this.emit('ui:change', { ui: this.ui });
  }

  setTool(tool) {
    if (this.ui.tool === tool) return;
    const previousTool = this.ui.tool;
    this.ui = { ...this.ui, tool, previousTool };
    this.emit('tool:change', { tool });
  }

  addRecentColor(hex) {
    if (!hex) return;
    const recent = [hex, ...(this.ui.recentColors || []).filter((c) => c !== hex)].slice(0, 24);
    this.ui = { ...this.ui, recentColors: recent };
    this._savePrefs();
    this.emit('colors:recent');
  }

  swapColors() {
    this.ui = { ...this.ui, primary: this.ui.secondary, secondary: this.ui.primary };
    this.emit('ui:change', { ui: this.ui });
  }

  setDialog(dialog) {
    this.dialog = dialog;
    this.emit('dialog:change', { dialog });
  }

  askConfirm({ title = 'Konfirmasi', message = '', confirmLabel = 'Lanjutkan', cancelLabel = 'Batal', danger = false, onConfirm = null } = {}) {
    this.confirmState = { title, message, confirmLabel, cancelLabel, danger, onConfirm };
    this.emit('confirm:change', { confirm: this.confirmState });
  }

  resolveConfirm(ok) {
    const state = this.confirmState;
    this.confirmState = null;
    this.emit('confirm:change', { confirm: null });
    if (ok && state?.onConfirm) state.onConfirm();
  }

  toast(message, type = 'info', duration = 2800) {
    const id = uid('toast');
    this.toasts = [...this.toasts.slice(-3), { id, message, type }];
    this.emit('toast:add', { toast: { id, message, type } });
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
      this.emit('toast:remove', { id });
    }, duration);
    return id;
  }

  dismissToast(id) {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
    this.emit('toast:remove', { id });
  }

  _loadPrefs() {
    if (!this.storage) return;
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.ui) {
        for (const key of PERSIST_KEYS) if (key in data.ui) this.ui[key] = data.ui[key];
      }
      if (data.shortcuts && typeof data.shortcuts === 'object') this.shortcuts = data.shortcuts;
    } catch {
      // Corrupt preferences are ignored, never fatal.
    }
  }

  _savePrefs() {
    if (!this.storage) return;
    try {
      const ui = {};
      for (const key of PERSIST_KEYS) ui[key] = this.ui[key];
      this.storage.setItem(STORAGE_KEY, JSON.stringify({ ui, shortcuts: this.shortcuts }));
    } catch {
      // Quota/full private mode is non-fatal.
    }
  }

  setShortcuts(shortcuts) {
    this.shortcuts = { ...this.shortcuts, ...shortcuts };
    this._savePrefs();
    this.emit('shortcuts:change');
  }
}

/** Create the initial starter document. */
export function createStarterDocument() {
  const doc = PixelDocument.create({ width: 32, height: 32, title: 'hero', layerName: 'body' });
  doc.grid = { x: 0, y: 0, w: 8, h: 8 };
  return doc;
}
