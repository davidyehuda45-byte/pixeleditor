import React, { useEffect, useRef, useState } from 'react';
import { useStore, useI18n } from '../ui/hooks.jsx';
import { Icon } from './Icon.jsx';
import { Button, IconButton, Select, Swatch } from '../ui/controls.jsx';
import { ColorPicker } from './ColorPicker.jsx';
import { LayersPanel } from './LayersPanel.jsx';
import { renderComposite } from '../core/compositor.js';
import { setPalette } from '../core/commands.js';
import { pickFiles } from '../io/file.js';
import { exportPaletteFile, importPalettePicked } from '../ui/actions.js';
import { toHex, parseHex } from '../utils/color.js';

function Section({ id, title, icon, actions, children, defaultOpen = true, open: controlledOpen, onToggle }) {
  const [internal, setInternal] = useState(defaultOpen);
  const open = controlledOpen ?? internal;
  const toggle = () => (onToggle ? onToggle(!open) : setInternal(!open));
  return (
    <section className={`panel-card ${open ? 'is-open' : ''}`} aria-labelledby={`panel-${id}`}>
      <div className="panel-head">
        <button type="button" className="panel-head-toggle" onClick={toggle} aria-expanded={open} id={`panel-${id}`}>
          <Icon name={open ? 'chevron-down' : 'chevron-right'} size={12} />
          {icon ? <Icon name={icon} size={15} /> : null}
          <span>{title}</span>
        </button>
        {actions ? <div className="panel-actions">{actions}</div> : null}
      </div>
      {open ? <div className="panel-body">{children}</div> : null}
    </section>
  );
}

function hexNoAlpha(hex) {
  const parsed = parseHex(hex);
  return parsed ? toHex([parsed[0], parsed[1], parsed[2], 255], true) : '#000000ff';
}

function PreviewPanel({ playing, onTogglePlay }) {
  const store = useStore();
  const { t } = useI18n();
  const canvasRef = useRef(null);
  const doc = store.doc;
  const session = store.activeSession;
  const scale = store.ui.previewScale || 2;
  const bg = store.ui.previewBg || 'checker';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !doc || !session) return;
    const source = renderComposite(doc, session.activeFrameId);
    const sw = doc.width * scale;
    const sh = doc.height * scale;
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, sw, sh);
    if (bg === 'checker') {
      const cell = Math.max(2, Math.round(4 * scale));
      for (let y = 0; y < sh; y += cell) for (let x = 0; x < sw; x += cell) {
        ctx.fillStyle = ((x / cell) + (y / cell)) % 2 === 0 ? '#20222c' : '#2c2f3b';
        ctx.fillRect(x, y, cell, cell);
      }
    } else if (bg === 'light') {
      ctx.fillStyle = '#e4e6ef';
      ctx.fillRect(0, 0, sw, sh);
    } else if (bg === 'dark') {
      ctx.fillStyle = '#11121a';
      ctx.fillRect(0, 0, sw, sh);
    }
    const temp = document.createElement('canvas');
    temp.width = doc.width;
    temp.height = doc.height;
    temp.getContext('2d').putImageData(new ImageData(source.data, doc.width, doc.height), 0, 0);
    ctx.drawImage(temp, 0, 0, sw, sh);
    if (bg === 'checker') {
      // A subtle grid at high scale makes transparency legible without softening pixels.
      if (scale >= 4) {
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        for (let x = scale; x < sw; x += scale) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, sh); ctx.stroke(); }
        for (let y = scale; y < sh; y += scale) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(sw, y + 0.5); ctx.stroke(); }
      }
    }
  }, [doc, session?.activeFrameId, scale, bg, store.revision]);

  if (!doc || !session) return null;

  return (
    <div className="preview-panel">
      <div className="preview-toolbar">
        <button type="button" className="preview-play" onClick={onTogglePlay} title={t('shortcut.play')}>
          <Icon name={playing ? 'pause' : 'play'} size={13} />
        </button>
        <span className="preview-frame">{store.activeFrameIndex + 1} / {doc.frames.length}</span>
        <span className="toolbar-spacer" />
        <Select
          value={scale}
          onChange={(value) => store.setUI({ previewScale: Number(value) })}
          options={[1, 2, 3, 4, 6, 8].map((value) => ({ value, label: `${value}×` }))}
          aria-label={t('preview.scale')}
          className="select-mini"
        />
        <Select
          value={bg}
          onChange={(value) => store.setUI({ previewBg: value })}
          options={[
            { value: 'checker', label: t('preview.checker') },
            { value: 'dark', label: t('preview.dark') },
            { value: 'light', label: t('preview.light') },
            { value: 'transparent', label: t('preview.transparent') },
          ]}
          aria-label={t('preview.background')}
          className="select-mini"
        />
      </div>
      <div className="preview-canvas-wrap">
        <canvas ref={canvasRef} className="preview-canvas" style={{ imageRendering: 'pixelated' }} />
      </div>
    </div>
  );
}

export function RightPanel({ playing, onTogglePlay, onCloseMobile, isMobileOpen }) {
  const store = useStore();
  const { t } = useI18n();
  const [editing, setEditing] = useState('primary');
  const [selectedSwatch, setSelectedSwatch] = useState(-1);
  const recentTimer = useRef(null);
  const doc = store.doc;
  const ui = store.ui;
  const paletteSet = doc?.palette;
  const palette = paletteSet?.current;

  useEffect(() => {
    const onFocus = (event) => {
      setEditing(event.detail === 'secondary' ? 'secondary' : 'primary');
      document.getElementById('color-panel-card')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    window.addEventListener('pixelforge:focus-color', onFocus);
    return () => window.removeEventListener('pixelforge:focus-color', onFocus);
  }, []);

  const choose = (hex, target = editing, recent = true) => {
    const value = String(hex || '').startsWith('#') ? hex : `#${hex}`;
    store.setUI({ [target]: value });
    if (recent) {
      clearTimeout(recentTimer.current);
      recentTimer.current = setTimeout(() => store.addRecentColor(value), 350);
    }
  };

  const addPaletteColor = () => {
    if (!palette || palette.locked) return;
    const hex = hexNoAlpha(ui[editing]).slice(0, 7);
    setPalette(store, (set) => { set.current.add(hex); }, t('colors.addColor'));
  };
  const removePaletteColor = () => {
    if (!palette || palette.locked) return;
    const index = selectedSwatch >= 0 ? selectedSwatch : palette.indexOf(hexNoAlpha(ui[editing]).slice(0, 7));
    if (index < 0) return;
    setPalette(store, (set) => { set.current.remove(index); }, t('colors.removeColor'));
    setSelectedSwatch(-1);
  };
  const importPalette = async () => {
    const files = await pickFiles(['palette'], { multiple: false });
    if (files[0]) await importPalettePicked(store, files[0]);
  };

  return (
    <aside className={`right-panel ${isMobileOpen ? 'is-mobile-open' : ''}`} aria-label={t('menu.rightPanel')}>
      <div className="mobile-drawer-header">
        <div className="mobile-drawer-pill" />
        <span className="mobile-drawer-title">{t('menu.rightPanel')}</span>
        <button type="button" className="btn btn-sm btn-ghost mobile-drawer-close" onClick={onCloseMobile} aria-label={t('common.close')}>
          <Icon name="x" size={16} />
        </button>
      </div>
      {doc ? (
        <div className="doc-info-strip">
          <button type="button" className="doc-title-button" onClick={() => store.setDialog({ type: 'renameDocument' })} title={t('common.rename')}>
            <span className="doc-title-text">{doc.title}</span>
            <Icon name="type" size={11} />
          </button>
          <span className="doc-meta">{doc.width}×{doc.height} · {doc.frames.length} {t('frames.short')} · {doc.layers.length} {t('layers.short')}</span>
        </div>
      ) : null}

      <div className="right-panel-scroll">
        <div id="color-panel-card">
          <Section id="color" title={t('colors.primary')} icon="swatch" defaultOpen actions={
            <IconButton icon="swap" label={t('colors.swap')} className="mini" onClick={() => store.swapColors()} />
          }>
            <div className="color-stack-row">
              <div className="color-stack">
                <button
                  type="button"
                  className={`big-swatch primary ${editing === 'primary' ? 'is-active' : ''}`}
                  style={{ background: ui.primary }}
                  onClick={() => setEditing('primary')}
                  title={t('colors.primary')}
                  aria-label={t('colors.primary')}
                />
                <button
                  type="button"
                  className={`big-swatch secondary ${editing === 'secondary' ? 'is-active' : ''}`}
                  style={{ background: ui.secondary }}
                  onClick={() => setEditing('secondary')}
                  title={t('colors.secondary')}
                  aria-label={t('colors.secondary')}
                />
              </div>
              <div className="color-readout">
                <span className="color-role">{editing === 'primary' ? t('colors.primary') : t('colors.secondary')}</span>
                <code>{hexNoAlpha(ui[editing])}</code>
                <span className="alpha-readout">A {parseHex(ui[editing])?.[3] ?? 255}</span>
              </div>
            </div>
            <ColorPicker value={ui[editing]} onChange={(value) => choose(value, editing)} />
            {ui.recentColors?.length ? (
              <div className="recent-colors">
                <div className="mini-label">{t('colors.recent')}</div>
                <div className="recent-strip">
                  {ui.recentColors.slice(0, 18).map((color) => (
                    <Swatch key={color} color={color} size={18} title={color} onClick={() => choose(color)} onContextMenu={(event) => { event.preventDefault(); choose(color, 'secondary'); }} />
                  ))}
                </div>
              </div>
            ) : null}
          </Section>
        </div>

        {palette && (
          <Section id="palette" title={palette.name || t('colors.palette')} icon="palette" defaultOpen actions={
            <>
              <IconButton icon="plus" label={t('colors.addColor')} className="mini" onClick={addPaletteColor} disabled={palette.locked} />
              <IconButton icon="trash" label={t('colors.removeColor')} className="mini" onClick={removePaletteColor} disabled={palette.locked || !palette.colors.length} />
              <IconButton icon="settings" label={t('dialog.palette.title')} className="mini" onClick={() => store.setDialog({ type: 'palette' })} />
            </>
          }>
            <div className="palette-head">
              <Select
                value={String(paletteSet.active)}
                onChange={(value) => setPalette(store, (set) => { set.active = Number(value); }, t('dialog.palette.select'))}
                options={paletteSet.palettes.map((entry, index) => ({ value: String(index), label: `${entry.name}${entry.locked ? ' 🔒' : ''}` }))}
                className="palette-select"
                aria-label={t('colors.palette')}
              />
              <span className="palette-count">{palette.colors.length}/256</span>
            </div>
            <div className="palette-grid" role="listbox" aria-label={palette.name}>
              {palette.colors.map((color, index) => (
                <button
                  key={`${color}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={selectedSwatch === index}
                  className={`palette-swatch ${selectedSwatch === index ? 'is-selected' : ''} ${hexNoAlpha(ui.primary).toLowerCase() === color ? 'is-primary' : ''} ${hexNoAlpha(ui.secondary).toLowerCase() === color ? 'is-secondary' : ''}`}
                  style={{ background: color }}
                  title={`${color} · ${index}`}
                  onClick={() => { setSelectedSwatch(index); choose(color, editing, true); }}
                  onContextMenu={(event) => { event.preventDefault(); setSelectedSwatch(index); choose(color, 'secondary', true); }}
                />
              ))}
              {!palette.colors.length ? <span className="palette-empty">{t('colors.noColors')}</span> : null}
            </div>
            <div className="palette-footer">
              <Button variant="ghost" size="sm" icon="upload" onClick={importPalette}>{t('colors.importPalette')}</Button>
              <Button variant="ghost" size="sm" icon="download" onClick={() => exportPaletteFile(store, 'gpl')}>{t('colors.exportPalette')}</Button>
            </div>
          </Section>
        )}

        <Section id="layers" title={t('layers.title')} icon="layers" defaultOpen>
          <LayersPanel compact />
        </Section>

        {ui.showPreview && (
          <Section id="preview" title={t('common.preview')} icon="eye" defaultOpen>
            <PreviewPanel playing={playing} onTogglePlay={onTogglePlay} />
          </Section>
        )}
      </div>
    </aside>
  );
}

export default RightPanel;
