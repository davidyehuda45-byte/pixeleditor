import React, { useEffect, useState } from 'react';
import { useStore, useI18n, useCursorInfo, useStoreEvent, useStoreEvents } from '../ui/hooks.jsx';
import { Icon } from './Icon.jsx';
import { shortcutFor, formatShortcut } from '../ui/shortcuts.js';
import { parseHex, toHex } from '../utils/color.js';

export function StatusBar() {
  const store = useStore();
  const { t, lang } = useI18n();
  const cursor = useCursorInfo();
  const [zoom, setZoom] = useState(store.activeSession?.view?.zoom || 1);
  const [hint, setHint] = useState('');
  const [viewTick, setViewTick] = useState(0);
  const doc = store.doc;
  const session = store.activeSession;

  useStoreEvent('viewport:zoom', (event) => setZoom(event.zoom));
  useStoreEvents('viewport', () => {
    setZoom(store.activeSession?.view?.zoom || 1);
    setViewTick((value) => value + 1);
  });
  useStoreEvent('tool:hint', (event) => setHint(event.text || ''));
  useEffect(() => { setZoom(session?.view?.zoom || 1); }, [session?.id, store.revision]);
  useEffect(() => { if (!doc) setHint(''); }, [doc]);

  if (!doc || !session) {
    return (
      <footer className="statusbar">
        <span className="status-left"><Icon name="shield" size={12} />{t('app.offline')}</span>
        <span className="toolbar-spacer" />
        <span className="status-chip"><Icon name="shield" size={12} />{t('status.offline')}</span>
      </footer>
    );
  }

  const selection = doc.selection && !doc.selection.empty ? doc.selection.bounds : null;
  const toolCombo = formatShortcut(shortcutFor(store, `tool.${store.ui.tool}`));
  const savedText = session.dirty
    ? t('app.unsaved')
    : session.savedAt ? t('status.savedAt', { time: new Date(session.savedAt).toLocaleTimeString(lang === 'en' ? 'en-US' : 'id-ID', { hour: '2-digit', minute: '2-digit' }) }) : t('app.saved');
  const autosaveText = store.ui.autoSave && session.autosaveAt
    ? t('app.autosaved', { time: new Date(session.autosaveAt).toLocaleTimeString(lang === 'en' ? 'en-US' : 'id-ID', { hour: '2-digit', minute: '2-digit' }) })
    : store.ui.autoSave ? null : t('status.autosaveOff');
  const hex = cursor.hex || null;
  const alpha = cursor.color ? cursor.color[3] : null;

  return (
    <footer className="statusbar" aria-label="Status">
      <div className="status-left">
        <button
          type="button"
          className="status-tool"
          onClick={() => store.setDialog({ type: 'guide' })}
          title={`${t('status.tool')} (${toolCombo}) — ${t('guide.title')}`}
          style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}
        >
          <Icon name="pencil" size={13} />
          {t(`tool.${store.ui.tool}`)}
          {toolCombo !== '—' ? <kbd>{toolCombo}</kbd> : null}
        </button>
        <span className="status-hint" title={hint || t(`hint.tool.${store.ui.tool}`) || t('status.toolHint')}>
          {hint || t(`hint.tool.${store.ui.tool}`) || (store.ui.language === 'en' ? 'Wheel zooms · Space/right-drag pans · right click picks secondary' : 'Scroll zoom · Spasi/klik kanan-seret geser · klik kanan warna sekunder')}
        </span>
      </div>
      <div className="status-right">
        <span className="status-chip" title={t('status.colorUnderCursor')}>
          {hex ? <span className="status-color" style={{ background: hex }} /> : <span className="status-color is-none" />}
          {hex ? <code>{hex.slice(0, 7)}</code> : <span className="muted">{t('status.noSelection')}</span>}
          {alpha != null ? <span className="status-alpha">A{alpha}</span> : null}
        </span>
        <span className="status-chip" title={t('status.position')}>
          <Icon name="target" size={11} />{cursor.inside ? `${cursor.x}, ${cursor.y}` : '—'}
        </span>
        <span className="status-chip" title={t('status.size')}>
          {t('status.canvasSize', { w: doc.width, h: doc.height })}
        </span>
        <span className="status-chip" title={t('status.selection')}>
          <Icon name="marquee" size={11} />{selection ? t('status.selectionSize', { w: selection.w, h: selection.h }) : t('status.noSelection')}
        </span>
        <span className="status-chip" title={t('status.frame')}>
          <Icon name="film" size={11} />{store.activeFrameIndex + 1}/{doc.frames.length}
        </span>
        <span className="status-chip layer-chip" title={t('layers.active')}>
          <Icon name={store.activeLayer?.type === 'group' ? 'folder' : 'layers'} size={11} />
          {store.activeLayer?.name || '—'}
        </span>
        <span className="status-chip" title={t('status.zoom')}>{Math.round(zoom * 100)}%</span>
        <span className={`status-chip save-chip ${session.dirty ? 'is-dirty' : ''}`} title={autosaveText || savedText}>
          <span className="status-save-dot" />{savedText}
        </span>
        {autosaveText ? <span className="status-autosave">{autosaveText}</span> : null}
        <span className="status-chip status-memory" title={t('status.memory')}>
          {t('status.memory')} {(session.history.memory / 1024 / 1024).toFixed(1)} MB
        </span>
        <span className="status-chip offline-chip" title={t('status.offline')}>
          <Icon name="shield" size={11} />{t('status.offline')}
        </span>
      </div>
    </footer>
  );
}

export default StatusBar;
