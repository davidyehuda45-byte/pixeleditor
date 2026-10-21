import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppStore, createStarterDocument } from './core/store.js';
import { ToolEngine } from './tools/engine.js';
import { buildCommands } from './ui/appCommands.js';
import { StoreProvider, useStore, useStoreEvent } from './ui/hooks.jsx';
import { eventCombo, shortcutMap, isEditableTarget, GLOBAL_IN_INPUT } from './ui/shortcuts.js';
import { CanvasViewport } from './components/CanvasViewport.jsx';
import { MenuBar } from './components/MenuBar.jsx';
import { TabStrip } from './components/TabStrip.jsx';
import { ToolRail } from './components/ToolRail.jsx';
import { ToolOptions } from './components/ToolOptions.jsx';
import { Timeline } from './components/Timeline.jsx';
import { RightPanel } from './components/RightPanel.jsx';
import { StatusBar } from './components/StatusBar.jsx';
import { MobileDock } from './components/MobileDock.jsx';
import { CommandPalette } from './components/CommandPalette.jsx';
import { ToastHost, ConfirmHost } from './components/Overlays.jsx';
import { DialogHost } from './components/Dialogs.jsx';
import { autosaveSession } from './ui/actions.js';
import { listAutosaves } from './io/autosave.js';
import { importDropped } from './ui/actions.js';

function Resizer({ orientation, onStart, onMove, onEnd, label }) {
  const dragRef = useRef(null);
  const onPointerDown = (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      value: onStart?.(),
    };
  };
  const onPointerMove = (event) => {
    if (!dragRef.current) return;
    const delta = orientation === 'vertical'
      ? dragRef.current.startX - event.clientX
      : dragRef.current.startY - event.clientY;
    onMove?.(dragRef.current.value + delta);
  };
  const finish = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    onEnd?.();
  };
  return (
    <div
      className={`panel-resizer ${orientation}`}
      role="separator"
      aria-label={label}
      aria-orientation={orientation}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      onDoubleClick={() => {
        if (orientation === 'vertical') window.dispatchEvent(new CustomEvent('pixelforge:reset-right-width'));
      }}
    >
      <span />
    </div>
  );
}

function AppShell({ store, engine }) {
  const commandStore = useStore();
  const viewportRef = useRef(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [draggingFiles, setDraggingFiles] = useState(false);
  const rootRef = useRef(null);
  const runRef = useRef(null);
  const [rightWidth, setRightWidth] = useState(store.ui.rightPanelWidth || 320);
  const [timelineHeight, setTimelineHeight] = useState(store.ui.timelineHeight || 224);
  const [mobileDrawer, setMobileDrawer] = useState(null); // 'tools' | 'panel' | 'timeline' | null

  useEffect(() => {
    const onFocusColor = () => {
      if (window.innerWidth <= 768) setMobileDrawer('panel');
    };
    const onOpenTools = () => { if (window.innerWidth <= 768) setMobileDrawer('tools'); };
    window.addEventListener('pixelforge:focus-color', onFocusColor);
    window.addEventListener('pixelforge:open-tools-drawer', onOpenTools);
    return () => { window.removeEventListener('pixelforge:focus-color', onFocusColor); window.removeEventListener('pixelforge:open-tools-drawer', onOpenTools); };
  }, []);

  const commands = useMemo(() => buildCommands({
    store,
    engine,
    viewport: viewportRef,
    run: (id, opts) => runRef.current?.(id, opts),
  }), [store, engine, store.revision, store.ui.language]);
  const commandMap = useMemo(() => new Map(commands.map((command) => [command.id, command])), [commands]);

  useEffect(() => {
    engine.cb.onChange = () => viewportRef.current?.refresh?.();
    engine.cb.getCompositePixels = () => viewportRef.current?.getCompositePixels?.();
    return () => {
      engine.cb.onChange = null;
      engine.cb.getCompositePixels = null;
    };
  }, [engine]);

  const runCommand = useCallback(async (id, opts = {}) => {
    const command = commandMap.get(id);
    if (!command) return false;
    if (command.enabled && command.enabled() === false) return false;
    try {
      await command.run(opts);
      return true;
    } catch (error) {
      console.error(`[PixelForge] Command ${id} failed:`, error);
      store.toast(error?.message || String(error), 'error', 4500);
      return false;
    }
  }, [commandMap, store]);
  runRef.current = runCommand;

  useEffect(() => { setPlaying(false); }, [store.activeSession?.id]);

  const togglePlay = useCallback(() => {
    if (!store.doc) return;
    setPlaying((value) => !value);
  }, [store]);

  useStoreEvent('playback:toggle', () => togglePlay());
  useStoreEvent('palette:open', () => setPaletteOpen((value) => !value));
  useEffect(() => {
    const onCommand = (event) => {
      const detail = event.detail || {};
      if (detail.command) runRef.current?.(detail.command, detail.opts || {});
    };
    window.addEventListener('pixelforge:command', onCommand);
    return () => window.removeEventListener('pixelforge:command', onCommand);
  }, []);

  // Theme, language and document metadata.
  useEffect(() => {
    document.documentElement.dataset.theme = store.ui.theme || 'dark';
    document.documentElement.lang = store.ui.language || 'id';
    document.documentElement.setAttribute('data-ui-scale', store.ui.uiScale || 'normal');
  }, [store.ui.theme, store.ui.language, store.ui.uiScale]);

  useEffect(() => {
    const title = store.doc?.title || 'PixelForge';
    document.title = `${store.activeSession?.dirty ? '● ' : ''}${title} — PixelForge`;
  }, [store.doc?.title, store.activeSession?.dirty, store.revision]);

  useEffect(() => {
    const ready = () => {
      listAutosaves().then((records) => {
        const dirty = records.filter((record) => record.dirty);
        if (dirty.length) {
          store.setDialog({ type: 'recovery', records: dirty });
          return;
        }
        try {
          if (!localStorage.getItem('pixelforge:welcomeSeen')) {
            localStorage.setItem('pixelforge:welcomeSeen', '1');
            store.setDialog({ type: 'welcome' });
          }
        } catch { /* storage can be unavailable */ }
      }).catch(() => {
        try {
          if (!localStorage.getItem('pixelforge:welcomeSeen')) {
            localStorage.setItem('pixelforge:welcomeSeen', '1');
            store.setDialog({ type: 'welcome' });
          }
        } catch { /* ignore */ }
      });
    };
    const id = setTimeout(ready, 450);
    return () => clearTimeout(id);
  }, [store]);

  // Playback follows frame durations and, when the current frame is inside a
  // tag, respects that tag's range and direction.
  const playStateRef = useRef({ dir: 1, tagKey: null, laps: 0 });
  useEffect(() => {
    if (!playing || !store.doc || !store.activeSession) return undefined;
    const frames = store.doc.frames;
    if (frames.length < 2) return undefined;
    const current = Math.max(0, store.activeFrameIndex);
    const tag = store.doc.tagAt?.(current) || null;
    const tagKey = tag ? `${tag.name}:${tag.from}:${tag.to}:${tag.direction}:${tag.repeat}` : null;
    if (playStateRef.current.tagKey !== tagKey) {
      playStateRef.current = { dir: 1, tagKey, laps: 0 };
    }
    const duration = Math.max(10, store.activeFrame?.duration || 100);
    const timer = setTimeout(() => {
      const state = playStateRef.current;
      const from = tag ? Math.max(0, tag.from) : 0;
      const to = tag ? Math.min(frames.length - 1, tag.to) : frames.length - 1;
      const direction = tag?.direction || 'forward';
      let next;
      if (direction === 'reverse') {
        next = current - 1 < from ? to : current - 1;
      } else if (direction === 'pingpong') {
        next = current + state.dir;
        if (next > to) { state.dir = -1; next = Math.max(from, to - 1); }
        else if (next < from) { state.dir = 1; next = Math.min(to, from + 1); }
      } else {
        next = current + 1;
        if (next > to) {
          next = from;
          state.laps += 1;
          if (tag?.repeat > 0 && state.laps >= tag.repeat) {
            setPlaying(false);
            return;
          }
        }
      }
      if (!Number.isFinite(next) || !frames[next]) return;
      store.setActiveFrame(frames[next].id);
    }, duration);
    return () => clearTimeout(timer);
  }, [playing, store, store.activeSession?.id, store.activeFrameId, store.activeFrame?.duration, store.doc?.tags?.length, store.revision]);

  // Autosave periodically, and immediately when the tab is hidden.
  useEffect(() => {
    if (!store.ui.autoSave) return undefined;
    const interval = Math.max(5, Number(store.ui.autoSaveInterval) || 30) * 1000;
    const save = () => {
      if (store.activeSession?.dirty) autosaveSession(store).catch(() => {});
    };
    const id = setInterval(save, interval);
    const onVisibility = () => { if (document.visibilityState === 'hidden') save(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisibility); };
  }, [store, store.ui.autoSave, store.ui.autoSaveInterval]);

  useEffect(() => {
    const beforeUnload = (event) => {
      if (!store.sessions.some((session) => session.dirty)) return undefined;
      autosaveSession(store).catch(() => {});
      event.preventDefault();
      event.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [store]);

  // Keyboard shortcuts: one global router for every command.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (paletteOpen || store.dialog || store.confirmState) return;
      if (event.defaultPrevented) return;
      const combo = eventCombo(event);
      if (!combo) return;
      let actionId = shortcutMap(store).get(combo) || null;
      if (!actionId && combo === 'Ctrl+Shift+Z') actionId = 'edit.redo';
      if (!actionId) {
        if (combo === 'Escape') {
          if (store.ui.zen) store.setUI({ zen: false });
          else if (store.doc?.selection && !store.doc.selection.empty) runRef.current?.('select.none');
        }
        return;
      }
      const editable = isEditableTarget(event.target);
      if (editable && !GLOBAL_IN_INPUT.has(actionId)) return;
      const targetTag = event.target?.tagName;
      if ((event.key === 'Enter' || event.key === ' ') && ['BUTTON', 'A'].includes(targetTag)) return;
      if (event.repeat && (actionId.startsWith('tool.') || actionId === 'frame.play' || actionId === 'file.new')) return;
      event.preventDefault();
      event.stopPropagation();
      if (actionId === 'brush.decrease' || actionId === 'brush.increase') {
        const delta = actionId === 'brush.increase' ? 1 : -1;
        store.setUI({ brushSize: Math.max(1, Math.min(64, (store.ui.brushSize || 1) + delta)) });
        store.emit('tool:hint', { text: `Kuas ${Math.max(1, Math.min(64, (store.ui.brushSize || 1) + delta))} px` });
        return;
      }
      runRef.current?.(actionId, { shift: event.shiftKey, alt: event.altKey, ctrl: event.ctrlKey || event.metaKey });
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [store, paletteOpen]);

  // Local, fully client-side drag and drop import.
  useEffect(() => {
    let depth = 0;
    const hasFiles = (event) => Array.from(event.dataTransfer?.types || []).includes('Files');
    const onDragEnter = (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth++;
      setDraggingFiles(true);
    };
    const onDragOver = (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    };
    const onDragLeave = (event) => {
      if (!hasFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDraggingFiles(false);
    };
    const onDrop = async (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth = 0;
      setDraggingFiles(false);
      await importDropped(store, event.dataTransfer);
    };
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [store]);

  useEffect(() => {
    const reset = () => {
      setRightWidth(320);
      store.setUI({ rightPanelWidth: 320 });
    };
    window.addEventListener('pixelforge:reset-right-width', reset);
    return () => window.removeEventListener('pixelforge:reset-right-width', reset);
  }, [store]);

  const ui = store.ui;
  const layoutStyle = {
    '--right-panel-width': `${rightWidth}px`,
    '--timeline-height': `${timelineHeight}px`,
  };

  return (
    <div className={`app-shell ${ui.zen ? 'is-zen' : ''} ${ui.showRightPanel ? '' : 'no-right-panel'} ${store.sessions.length <= 1 ? 'has-single-tab' : ''}`} style={layoutStyle} ref={rootRef}>
      <MenuBar commands={commands} commandMap={commandMap} runCommand={runCommand} viewport={viewportRef} />
      {!ui.zen ? <TabStrip /> : null}
      <div className="workspace">
        {!ui.zen ? (
          <ToolRail
            viewport={viewportRef}
            onCloseMobile={() => setMobileDrawer(null)}
            isMobileOpen={mobileDrawer === 'tools'}
          />
        ) : null}
        <main className="editor-column">
          <ToolOptions engine={engine} />
          <div className="canvas-area">
            {ui.zen ? (
              <div className="zen-mode-pill">
                <span>Mode Zen Aktif</span>
                <button
                  type="button"
                  className="btn btn-xs btn-primary"
                  onClick={() => store.setUI({ zen: false, showRightPanel: true, showTimeline: true })}
                >
                  Tampilkan Semua Menu (Esc)
                </button>
              </div>
            ) : null}
            <CanvasViewport engine={engine} apiRef={viewportRef} />
          </div>
          {ui.showTimeline && !ui.zen ? (
            <>
              <Resizer
                orientation="horizontal"
                label="Timeline height"
                onStart={() => timelineHeight}
                onMove={(value) => setTimelineHeight(Math.max(148, Math.min(480, value)))}
                onEnd={() => store.setUI({ timelineHeight: Math.max(148, Math.min(480, timelineHeight)) })}
              />
              <Timeline
                playing={playing}
                onTogglePlay={togglePlay}
                onCloseMobile={() => setMobileDrawer(null)}
                isMobileOpen={mobileDrawer === 'timeline'}
              />
            </>
          ) : null}
        </main>
        {ui.showRightPanel && !ui.zen ? (
          <>
            <Resizer
              orientation="vertical"
              label="Right panel width"
              onStart={() => rightWidth}
              onMove={(value) => setRightWidth(Math.max(260, Math.min(520, value)))}
              onEnd={() => store.setUI({ rightPanelWidth: Math.max(260, Math.min(520, rightWidth)) })}
            />
            <RightPanel
              playing={playing}
              onTogglePlay={togglePlay}
              onCloseMobile={() => setMobileDrawer(null)}
              isMobileOpen={mobileDrawer === 'panel'}
            />
          </>
        ) : null}
      </div>
      <StatusBar />
      <MobileDock
        activeDrawer={mobileDrawer}
        onToggleDrawer={(id) => setMobileDrawer((prev) => (prev === id ? null : id))}
        runCommand={runCommand}
        viewport={viewportRef}
      />
      {mobileDrawer ? (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMobileDrawer(null)}
          aria-hidden="true"
        />
      ) : null}
      <DialogHost />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} runCommand={runCommand} />
      <ToastHost />
      <ConfirmHost />
      {draggingFiles ? (
        <div className="drop-overlay" aria-hidden="true">
          <div className="drop-card">
            <div className="drop-icon">{'\u2b07'}</div>
            <strong>Lepaskan untuk mengimpor</strong>
            <span>.pfx, PNG, JPG, WebP, GIF, .gpl, .hex, .pal, .act</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function App() {
  const [store] = useState(() => {
    const instance = new AppStore();
    if (!instance.sessions.length) {
      const doc = createStarterDocument();
      instance.createSession(doc, { fileName: 'hero.pfx', dirty: false });
    }
    return instance;
  });
  const [engine] = useState(() => new ToolEngine(store));

  return (
    <StoreProvider store={store}>
      <AppShell store={store} engine={engine} />
    </StoreProvider>
  );
}
