/**
 * Command registry shared by menus, the command palette and keyboard shortcuts.
 * Each command is a plain object so the UI can decide enablement and checks.
 */
import { translate } from '../i18n.js';
import { shortcutFor } from './shortcuts.js';
import { ALL_TOOLS } from './toolDefs.js';
import {
  addFrame, duplicateFrame, deleteFrame, setAllDurations,
  addLayer, duplicateLayer, deleteLayer, mergeLayerDown, flattenDocument, moveLayer, ungroupLayer,
  toggleLayerFlag, undo, redo, runStructural,
  selectionAll, selectionNone, selectionInvert, selectionGrow,
  setFrameTag, removeTag, setDocumentProps,
} from '../core/commands.js';
import {
  newDocument, saveProject, requestCloseSession, requestCloseAll, openProjectDialog,
  copySelection, cutSelection, pasteClipboard, deleteSelectionContent, nudgeContent,
  flipActive, rotateDocument, cropToSelection, trimToContent, selectLayerAlpha, selectByColor,
  importPalettePicked, getClipboard, addImageLayer,
} from './actions.js';
import { pickFiles } from '../io/file.js';
import { renderComposite } from '../core/compositor.js';
import { toHex } from '../utils/color.js';

/** Build the command list bound to the current app context. */
export function buildCommands({ store, engine, viewport, run }) {
  const t = (key, vars) => translate(store.ui.language || 'id', key, vars);
  const activeDoc = () => !!store.doc;
  const hasSelection = () => !!(store.doc?.selection && !store.doc.selection.empty);
  const activeLayerIsPaint = () => store.activeLayer?.type === 'layer';

  const zoom = (factor) => () => viewport.current?.zoomBy?.(factor);
  const toggleUI = (key) => () => store.setUI({ [key]: !store.ui[key] });

  const commands = [];

  const add = (id, labelKey, category, icon, runFn, opts = {}) => {
    commands.push({
      id,
      label: t(labelKey),
      category,
      icon,
      shortcut: shortcutFor(store, id),
      run: runFn,
      enabled: opts.enabled || (() => !!store.activeSession),
      checked: opts.checked || null,
    });
  };

  // ---- Tools -------------------------------------------------------------
  for (const tool of ALL_TOOLS) {
    add(`tool.${tool.id}`, tool.labelKey, 'tool', tool.icon, () => store.setTool(tool.id), {
      checked: () => store.ui.tool === tool.id,
      enabled: activeDoc,
    });
  }

  // ---- File --------------------------------------------------------------
  add('file.new', 'menu.new', 'file', 'file-plus', () => store.setDialog({ type: 'new', tab: 'blank' }), { enabled: () => true });
  add('file.newTemplate', 'menu.newTemplate', 'file', 'sparkles', () => store.setDialog({ type: 'new', tab: 'templates' }), { enabled: () => true });
  add('file.open', 'menu.open', 'file', 'folder-open', () => store.setDialog({ type: 'open' }), { enabled: () => true });
  add('file.save', 'menu.save', 'file', 'save', () => saveProject(store));
  add('file.saveAs', 'menu.saveAs', 'file', 'save-as', () => saveProject(store, { saveAs: true }));
  add('file.saveCopy', 'menu.saveCopy', 'file', 'copy', () => saveProject(store, { saveAs: true, copy: true }));
  add('file.export', 'menu.export', 'file', 'export', () => store.setDialog({ type: 'export' }));
  add('file.importImage', 'menu.importImage', 'file', 'image', () => store.setDialog({ type: 'importImage' }), { enabled: () => true });
  add('file.importPalette', 'menu.importPalette', 'file', 'palette', async () => {
    const files = await pickFiles(['palette'], { multiple: false });
    if (files[0]) await importPalettePicked(store, files[0]);
  }, { enabled: activeDoc });
  add('file.close', 'menu.closeTab', 'file', 'close', () => requestCloseSession(store), { enabled: activeDoc });
  add('file.closeAll', 'menu.closeAll', 'file', 'close', () => requestCloseAll(store), { enabled: () => store.sessions.length > 0 });

  // ---- Edit --------------------------------------------------------------
  add('edit.undo', 'menu.undo', 'edit', 'undo', () => {
    const entry = store.history?.entries[store.history.index - 1];
    if (undo(store)) store.toast(t('toast.undo', { label: entry?.label || '' }), 'info', 1400);
  }, { enabled: () => !!store.history?.canUndo });
  add('edit.redo', 'menu.redo', 'edit', 'redo', () => {
    const entry = store.history?.entries[store.history.index];
    if (redo(store)) store.toast(t('toast.redo', { label: entry?.label || '' }), 'info', 1400);
  }, { enabled: () => !!store.history?.canRedo });
  add('edit.cut', 'menu.cut', 'edit', 'cut', () => { cutSelection(store); }, { enabled: hasSelection });
  add('edit.copy', 'menu.copy', 'edit', 'copy', () => copySelection(store), { enabled: activeDoc });
  add('edit.paste', 'menu.paste', 'edit', 'paste', () => pasteClipboard(store), { enabled: activeDoc });
  add('edit.pasteNew', 'menu.pasteNewLayer', 'edit', 'paste', () => pasteClipboard(store, { asNewLayer: true }), { enabled: activeDoc });
  add('edit.delete', 'menu.deleteSelection', 'edit', 'trash', () => deleteSelectionContent(store), { enabled: hasSelection });
  add('edit.selectAlpha', 'menu.selectAlpha', 'select', 'target', () => selectLayerAlpha(store), { enabled: activeLayerIsPaint });
  add('edit.selectColor', 'menu.selectColor', 'select', 'wand', () => selectByColor(store, store.ui.primary, { tolerance: store.ui.tolerance }), { enabled: activeDoc });

  // ---- Selection ---------------------------------------------------------
  add('select.all', 'menu.selectAll', 'select', 'marquee', () => selectionAll(store));
  add('select.none', 'menu.deselect', 'select', 'close', () => selectionNone(store), { enabled: hasSelection });
  add('select.invert', 'menu.invertSelection', 'select', 'contrast', () => selectionInvert(store), { enabled: hasSelection });
  add('select.grow', 'menu.growSelection', 'select', 'plus', () => {
    selectionGrow(store, 1);
    store.toast(t('toast.selectionGrown'), 'info', 1400);
  }, { enabled: hasSelection });
  add('select.shrink', 'menu.shrinkSelection', 'select', 'minus', () => {
    selectionGrow(store, -1);
    store.toast(t('toast.selectionShrunk'), 'info', 1400);
  }, { enabled: hasSelection });

  // ---- Layers ------------------------------------------------------------
  add('layer.add', 'menu.addLayer', 'layer', 'plus', () => addLayer(store));
  add('layer.group', 'menu.addGroup', 'layer', 'folder-plus', () => addLayer(store, { type: 'group' }));
  add('layer.duplicate', 'menu.duplicateLayer', 'layer', 'copy', () => duplicateLayer(store), { enabled: activeLayerIsPaint });
  add('layer.delete', 'menu.deleteLayer', 'layer', 'trash', () => {
    const layer = store.activeLayer;
    if (!layer) return;
    store.askConfirm({
      title: t('confirm.deleteLayer.title'),
      message: t('confirm.deleteLayer.message', { name: layer.name }),
      confirmLabel: t('common.delete'),
      danger: true,
      onConfirm: () => deleteLayer(store, layer.id),
    });
  }, { enabled: () => !!store.activeLayer });
  add('layer.merge', 'menu.mergeDown', 'layer', 'merge', () => mergeLayerDown(store), { enabled: activeLayerIsPaint });
  add('layer.flatten', 'menu.flatten', 'layer', 'flatten', () => {
    store.askConfirm({
      title: t('confirm.flatten.title'),
      message: t('confirm.flatten.message'),
      confirmLabel: t('menu.flatten'),
      danger: true,
      onConfirm: () => flattenDocument(store),
    });
  });
  add('layer.ungroup', 'menu.ungroup', 'layer', 'folder', () => ungroupLayer(store, store.activeSession.activeLayerId), { enabled: () => store.activeLayer?.type === 'group' });
  add('layer.up', 'layers.moveUp', 'layer', 'arrow-up', () => moveLayer(store, store.activeSession.activeLayerId, 1), { enabled: activeLayerIsPaint });
  add('layer.down', 'layers.moveDown', 'layer', 'arrow-down', () => moveLayer(store, store.activeSession.activeLayerId, -1), { enabled: activeLayerIsPaint });
  add('layer.rename', 'layers.rename', 'layer', 'type', () => store.setDialog({ type: 'renameLayer', layerId: store.activeSession.activeLayerId }));
  add('layer.visible', 'menu.toggleVisible', 'layer', 'eye', () => { if (store.activeLayer) toggleLayerFlag(store, store.activeLayer.id, 'visible'); });
  add('layer.lock', 'menu.toggleLock', 'layer', 'lock', () => { if (store.activeLayer) toggleLayerFlag(store, store.activeLayer.id, 'locked'); });

  // ---- Frames ------------------------------------------------------------
  add('frame.add', 'menu.addFrame', 'frame', 'plus', () => addFrame(store));
  add('frame.duplicate', 'menu.duplicateFrame', 'frame', 'copy', () => duplicateFrame(store));
  add('frame.link', 'menu.linkFrame', 'frame', 'link', () => duplicateFrame(store, true));
  add('frame.delete', 'menu.deleteFrame', 'frame', 'trash', () => {
    store.askConfirm({
      title: t('confirm.deleteFrame.title'),
      message: t('confirm.deleteFrame.message', { index: store.activeFrameIndex + 1 }),
      confirmLabel: t('common.delete'),
      danger: true,
      onConfirm: () => deleteFrame(store),
    });
  }, { enabled: () => (store.doc?.frames.length || 0) > 1 });
  add('frame.prev', 'shortcut.prevFrame', 'frame', 'chevron-left', () => stepFrame(-1));
  add('frame.next', 'shortcut.nextFrame', 'frame', 'chevron-right', () => stepFrame(1));
  add('frame.play', 'shortcut.play', 'frame', 'play', () => store.emit('playback:toggle'));
  add('frame.onion', 'frames.onion', 'frame', 'layers', () => store.setUI({ showOnion: !store.ui.showOnion }), {
    checked: () => !!store.ui.showOnion,
  });
  add('frame.tags', 'menu.frameTags', 'frame', 'tag', () => store.setDialog({ type: 'tags' }));
  add('frame.duration', 'menu.frameDuration', 'frame', 'clock', () => store.setDialog({ type: 'frameDuration' }));
  add('frame.fps', 'frames.fps', 'frame', 'clock', () => store.setDialog({ type: 'fps' }));

  function stepFrame(delta) {
    if (!store.doc) return;
    const idx = Math.max(0, Math.min(store.doc.frames.length - 1, store.activeFrameIndex + delta));
    store.setActiveFrame(store.doc.frames[idx].id);
  }

  // ---- Canvas ------------------------------------------------------------
  add('canvas.resize', 'menu.resize', 'canvas', 'resize', () => store.setDialog({ type: 'resize' }));
  add('canvas.cropSelection', 'menu.cropSelection', 'canvas', 'crop', () => cropToSelection(store), { enabled: hasSelection });
  add('canvas.trim', 'menu.trimContent', 'canvas', 'crop', () => trimToContent(store));
  add('canvas.flipH', 'menu.flipH', 'canvas', 'flip-h', () => flipActive(store, 'h'));
  add('canvas.flipV', 'menu.flipV', 'canvas', 'flip-v', () => flipActive(store, 'v'));
  add('canvas.rotate90', 'menu.rotate90', 'canvas', 'rotate-cw', () => rotateDocument(store, 90));
  add('canvas.rotate180', 'menu.rotate180', 'canvas', 'refresh', () => rotateDocument(store, 180));
  add('canvas.rotate270', 'menu.rotate270', 'canvas', 'rotate-ccw', () => rotateDocument(store, 270));
  add('canvas.effects', 'menu.effects', 'canvas', 'sparkles', () => store.setDialog({ type: 'effects' }));
  add('canvas.biome', 'biome.title', 'canvas', 'sparkles', () => store.setDialog({ type: 'biome' }), { enabled: activeDoc });
  add('canvas.adjust', 'menu.adjust', 'canvas', 'droplet', () => store.setDialog({ type: 'effects', initial: 'adjust' }));
  add('canvas.grid', 'viewport.grid', 'canvas', 'grid', () => store.setDialog({ type: 'grid' }));
  add('canvas.metadata', 'dialog.metadata.title', 'canvas', 'box', () => store.setDialog({ type: 'metadata' }));
  add('canvas.guides', 'viewport.guides', 'canvas', 'anchor', () => store.setDialog({ type: 'guides' }));
  add('canvas.palette', 'dialog.palette.title', 'canvas', 'palette', () => store.setDialog({ type: 'palette' }), { enabled: activeDoc });
  add('canvas.rename', 'common.rename', 'canvas', 'type', () => store.setDialog({ type: 'renameDocument' }), { enabled: activeDoc });
  add('canvas.splitView', 'viewport.split', 'canvas', 'columns', () => store.toast(t('toast.unsupported'), 'warn'), { enabled: activeDoc });
  add('canvas.minimap', 'viewport.minimap', 'canvas', 'target', () => store.setUI({ showMinimap: !store.ui.showMinimap }), {
    checked: () => !!store.ui.showMinimap,
  });

  // ---- View --------------------------------------------------------------
  add('view.zoomIn', 'menu.zoomIn', 'view', 'zoom-in', zoom(2), { enabled: activeDoc });
  add('view.zoomOut', 'menu.zoomOut', 'view', 'zoom-out', zoom(0.5), { enabled: activeDoc });
  add('view.fit', 'menu.fit', 'view', 'fit', () => viewport.current?.fit?.(), { enabled: activeDoc });
  add('view.actual', 'menu.actual', 'view', 'target', () => viewport.current?.actual?.(), { enabled: activeDoc });
  add('view.center', 'viewport.center', 'view', 'target', () => viewport.current?.center?.(), { enabled: activeDoc });
  add('view.grid', 'menu.grid', 'view', 'grid', toggleUI('showGrid'), { checked: () => !!store.ui.showGrid });
  add('view.guides', 'viewport.guides', 'view', 'anchor', toggleUI('showGuides'), { checked: () => !!store.ui.showGuides });
  add('view.onion', 'menu.onion', 'view', 'layers', toggleUI('showOnion'), { checked: () => !!store.ui.showOnion });
  add('view.timeline', 'menu.timeline', 'view', 'panel-bottom', toggleUI('showTimeline'), { checked: () => !!store.ui.showTimeline });
  add('view.rightPanel', 'menu.rightPanel', 'view', 'panel-right', toggleUI('showRightPanel'), { checked: () => !!store.ui.showRightPanel });
  add('view.preview', 'menu.preview', 'view', 'eye', toggleUI('showPreview'), { checked: () => !!store.ui.showPreview });
  add('view.playtest', 'playtest.title', 'view', 'play', () => store.setDialog({ type: 'playtest' }), { enabled: activeDoc });
  add('view.zen', 'menu.zen', 'view', 'maximize', toggleUI('zen'), { checked: () => !!store.ui.zen });
  add('view.fullscreen', 'common.fullscreen', 'view', 'maximize', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      store.toast(t('toast.unsupported'), 'warn');
    }
  }, { enabled: () => true });
  add('view.theme', 'menu.theme', 'view', 'sun', () => {
    const order = ['dark', 'light', 'contrast'];
    const index = order.indexOf(store.ui.theme);
    store.setUI({ theme: order[(index + 1) % order.length] });
  }, { enabled: () => true });

  // ---- Palette / colors --------------------------------------------------
  add('palette.swap', 'shortcut.swapColors', 'tool', 'swap', () => store.swapColors(), { enabled: () => true });
  add('palette.manage', 'dialog.palette.title', 'view', 'palette', () => store.setDialog({ type: 'palette' }));
  add('palette.extract', 'colors.extract', 'view', 'wand', () => store.setDialog({ type: 'extractPalette' }));

  // ---- App / help --------------------------------------------------------
  add('app.commands', 'menu.commands', 'help', 'command', () => store.emit('palette:open'), { enabled: () => true });
  add('app.shortcuts', 'menu.shortcuts', 'help', 'keyboard', () => store.setDialog({ type: 'shortcuts' }), { enabled: () => true });
  add('app.settings', 'menu.preferences', 'help', 'settings', () => store.setDialog({ type: 'settings' }), { enabled: () => true });
  add('app.about', 'menu.about', 'help', 'info', () => store.setDialog({ type: 'about' }), { enabled: () => true });
  add('app.welcome', 'menu.welcome', 'help', 'onboarding', () => store.setDialog({ type: 'welcome' }), { enabled: () => true });
  add('app.history', 'menu.history', 'edit', 'history', () => store.setDialog({ type: 'history' }), { enabled: activeDoc });

  // Arrow nudge is special-cased so Shift applies an 8 px step.
  add('nudge.left', 'shortcut.nudge', 'edit', 'arrow-left', (opts = {}) => nudgeContent(store, opts.shift ? -8 : -1, 0));
  add('nudge.right', 'shortcut.nudge', 'edit', 'arrow-right', (opts = {}) => nudgeContent(store, opts.shift ? 8 : 1, 0));
  add('nudge.up', 'shortcut.nudge', 'edit', 'arrow-up', (opts = {}) => nudgeContent(store, 0, opts.shift ? -8 : -1));
  add('nudge.down', 'shortcut.nudge', 'edit', 'arrow-down', (opts = {}) => nudgeContent(store, 0, opts.shift ? 8 : 1));

  return commands;
}

export default buildCommands;
