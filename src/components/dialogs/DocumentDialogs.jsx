import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n, useStore } from '../../ui/hooks.jsx';
import { Modal, DialogSection, InfoNote, FormGrid } from './Modal.jsx';
import {
  Button, Field, NumberInput, Select, Slider, Toggle, Segmented, IconButton, EmptyState,
} from '../../ui/controls.jsx';
import { Icon } from '../Icon.jsx';
import {
  setFrameDuration, setAllDurations, runStructural, setLayerProps, resizeCanvas, cropCanvas,
  setDocumentProps, setGrid, jumpHistory, selectionGrow,
} from '../../core/commands.js';
import {
  renameDocument, cropToSelection, trimToContent, applyEffect,
} from '../../ui/actions.js';
import { Selection } from '../../core/selection.js';
import { parseHex, toHex } from '../../utils/color.js';

export function RenameDialog({ type, layerId, onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const layer = layerId ? store.doc?.getLayer(layerId) : null;
  const initial = type === 'renameLayer' ? (layer?.name || '') : (store.doc?.title || '');
  const [value, setValue] = useState(initial);
  const save = () => {
    const next = value.trim();
    if (!next) return;
    if (type === 'renameLayer') {
      if (layer) setLayerProps(store, layer.id, { name: next });
    } else {
      renameDocument(store, next);
    }
    onClose();
  };
  return (
    <Modal
      title={type === 'renameLayer' ? t('layers.rename') : t('dialog.rename.title')}
      icon="type"
      onClose={onClose}
      size="sm"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <span className="modal-footer-spacer" />
          <Button variant="primary" onClick={save} disabled={!value.trim()}>{t('common.save')}</Button>
        </>
      )}
    >
      <Field label={type === 'renameLayer' ? t('layers.rename') : t('dialog.new.titleField')}>
        <input
          className="text-input"
          autoFocus
          value={value}
          maxLength={80}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') save(); }}
        />
      </Field>
    </Modal>
  );
}

export function FrameDurationDialog({ onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const frame = store.activeFrame;
  const [duration, setDuration] = useState(frame?.duration || 100);
  const [applyAll, setApplyAll] = useState(false);
  const save = () => {
    if (!frame) return;
    const value = Math.max(10, Math.min(10000, Math.round(Number(duration) || 100)));
    if (applyAll) {
      runStructural(store, t('frames.duration'), (doc) => {
        for (const item of doc.frames) item.duration = value;
      });
    } else {
      setFrameDuration(store, frame.id, value);
    }
    onClose();
  };
  return (
    <Modal
      title={`${t('frames.duration')} — ${t('frames.frameOf', { index: store.activeFrameIndex + 1, total: store.doc?.frames.length || 1 })}`}
      icon="clock"
      onClose={onClose}
      size="sm"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <span className="modal-footer-spacer" />
          <Button variant="primary" icon="check" onClick={save}>{t('common.save')}</Button>
        </>
      )}
    >
      <FormGrid columns={1}>
        <Field label={t('frames.durationMs')} hint={`${Math.round(1000 / Math.max(1, duration))} FPS`}>
          <NumberInput value={duration} min={10} max={10000} step={10} onChange={setDuration} autoFocus />
        </Field>
        <Toggle checked={applyAll} onChange={setApplyAll} label={t('frames.applyAll')} />
      </FormGrid>
      <div className="duration-presets">
        {[50, 83, 100, 125, 167, 200, 250, 500].map((value) => (
          <Button key={value} size="sm" variant={duration === value ? 'primary' : 'ghost'} onClick={() => setDuration(value)}>
            {value} ms
          </Button>
        ))}
      </div>
    </Modal>
  );
}

export function FpsDialog({ onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const initial = Math.max(1, Math.min(60, Math.round(1000 / (store.activeFrame?.duration || 100))));
  const [fps, setFps] = useState(initial);
  const save = () => {
    setAllDurations(store, Math.max(1, Math.min(60, Math.round(Number(fps) || 12))));
    onClose();
  };
  return (
    <Modal
      title={t('frames.fps')}
      icon="clock"
      onClose={onClose}
      size="sm"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <span className="modal-footer-spacer" />
          <Button variant="primary" icon="check" onClick={save}>{t('common.save')}</Button>
        </>
      )}
    >
      <Field label={t('frames.fps')} hint={`${Math.round(1000 / Math.max(1, fps))} ms / ${t('frames.short')}`}>
        <NumberInput value={fps} min={1} max={60} onChange={setFps} autoFocus />
      </Field>
      <div className="duration-presets">
        {[6, 8, 10, 12, 15, 24, 30, 60].map((value) => (
          <Button key={value} size="sm" variant={fps === value ? 'primary' : 'ghost'} onClick={() => setFps(value)}>{value}</Button>
        ))}
      </div>
    </Modal>
  );
}

export function TagsDialog({ onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const doc = store.doc;
  const [tags, setTags] = useState(() => (doc?.tags || []).map((tag) => ({ ...tag })));
  const [error, setError] = useState('');

  const setTag = (index, patch) => setTags((list) => list.map((tag, i) => (i === index ? { ...tag, ...patch } : tag)));
  const addTag = () => {
    const from = store.activeFrameIndex;
    setTags((list) => [...list, {
      name: `anim_${list.length + 1}`,
      from,
      to: Math.max(from, (doc?.frames.length || 1) - 1),
      direction: 'forward',
      repeat: 0,
      color: store.ui.primary || '#7c6cf5',
    }]);
  };
  const remove = (index) => {
    const tag = tags[index];
    store.askConfirm({
      title: t('frames.deleteTag'),
      message: t('dialog.tag.deleteConfirm', { name: tag.name }),
      danger: true,
      onConfirm: () => setTags((list) => list.filter((_, i) => i !== index)),
    });
  };
  const save = () => {
    const clean = [];
    const names = new Set();
    for (const tag of tags) {
      const name = String(tag.name || '').trim();
      if (!name) { setError(t('dialog.tag.nameRequired')); return; }
      if (names.has(name)) { setError(t('settings.duplicateName')); return; }
      names.add(name);
      const from = Math.max(0, Math.min((doc?.frames.length || 1) - 1, Math.round(Number(tag.from) || 0)));
      const to = Math.max(from, Math.min((doc?.frames.length || 1) - 1, Math.round(Number(tag.to) || 0)));
      if (to < from) { setError(t('dialog.tag.invalid')); return; }
      clean.push({
        name, from, to,
        direction: tag.direction || 'forward',
        repeat: Math.max(0, Math.round(Number(tag.repeat) || 0)),
        color: tag.color || '#7c6cf5',
        userData: tag.userData ?? undefined,
      });
    }
    runStructural(store, t('dialog.tag.save'), (document) => {
      document.tags = clean;
    });
    onClose();
  };

  return (
    <Modal
      title={t('dialog.tag.title')}
      subtitle={t('dialog.tag.subtitle')}
      icon="tag"
      onClose={onClose}
      size="lg"
      footer={(
        <>
          <Button variant="ghost" icon="plus" onClick={addTag}>{t('dialog.tag.add')}</Button>
          <span className="modal-footer-note">{t('dialog.tag.overlap')}</span>
          <span className="modal-footer-spacer" />
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" icon="save" onClick={save}>{t('dialog.tag.save')}</Button>
        </>
      )}
    >
      {tags.length === 0 ? (
        <EmptyState icon="tag" title={t('dialog.tag.none')}>
          <Button size="sm" variant="primary" icon="plus" onClick={addTag}>{t('dialog.tag.add')}</Button>
        </EmptyState>
      ) : (
        <div className="tag-editor-list">
          <div className="tag-editor-head">
            <span>{t('frames.tagName')}</span>
            <span>{t('frames.tagFrom')}</span>
            <span>{t('frames.tagTo')}</span>
            <span>{t('frames.tagDirection')}</span>
            <span>{t('frames.tagRepeat')}</span>
            <span>{t('frames.tagColor')}</span>
            <span />
          </div>
          {tags.map((tag, index) => (
            <div key={index} className="tag-editor-row">
              <input className="text-input" value={tag.name} maxLength={40} onChange={(event) => setTag(index, { name: event.target.value })} />
              <NumberInput value={tag.from} min={0} max={Math.max(0, doc.frames.length - 1)} onChange={(value) => setTag(index, { from: value })} />
              <NumberInput value={tag.to} min={0} max={Math.max(0, doc.frames.length - 1)} onChange={(value) => setTag(index, { to: value })} />
              <Select
                value={tag.direction || 'forward'}
                onChange={(value) => setTag(index, { direction: value })}
                options={[
                  { value: 'forward', label: t('frames.forward') },
                  { value: 'reverse', label: t('frames.reverse') },
                  { value: 'pingpong', label: t('frames.pingpong') },
                ]}
              />
              <NumberInput value={tag.repeat || 0} min={0} max={999} onChange={(value) => setTag(index, { repeat: value })} />
              <input type="color" className="color-input small" value={tag.color || '#7c6cf5'} onChange={(event) => setTag(index, { color: event.target.value })} />
              <IconButton icon="trash" label={t('frames.deleteTag')} onClick={() => remove(index)} />
            </div>
          ))}
        </div>
      )}
      {error ? <InfoNote icon="warning" tone="error">{error}</InfoNote> : null}
      <InfoNote icon="info">{t('frames.tags')} · {tags.length} / {doc?.frames.length || 0} {t('frames.short')}</InfoNote>
    </Modal>
  );
}

export function ResizeDialog({ onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const doc = store.doc;
  const [width, setWidth] = useState(doc?.width || 32);
  const [height, setHeight] = useState(doc?.height || 32);
  const [anchor, setAnchor] = useState(4);
  const [scaleArt, setScaleArt] = useState(false);
  const [error, setError] = useState('');
  if (!doc) return null;

  const apply = () => {
    const w = Math.round(Number(width));
    const h = Math.round(Number(height));
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1 || w > 1024 || h > 1024) {
      setError(t('dialog.resize.invalid'));
      return;
    }
    if (scaleArt) {
      runStructural(store, t('dialog.resize.scaleArt'), (document) => {
        const oldW = document.width, oldH = document.height;
        const seen = new Set();
        for (const cel of document.cels.values()) {
          if (!cel.pixels || seen.has(cel)) continue;
          seen.add(cel);
          const sw = cel.width || oldW;
          const sh = cel.height || oldH;
          cel.pixels = nearestScale(cel.pixels, sw, sh, w, h);
          cel.width = w;
          cel.height = h;
          cel.x = 0;
          cel.y = 0;
        }
        document.width = w;
        document.height = h;
        document.selection = new Selection(w, h);
        document.grid = {
          x: 0, y: 0,
          w: Math.max(1, Math.round((document.grid?.w || 16) * w / oldW)),
          h: Math.max(1, Math.round((document.grid?.h || 16) * h / oldH)),
        };
        document.guides = (document.guides || []).map((guide) => ({
          ...guide,
          position: (guide.position || 0) * ((guide.orientation === 'vertical' || guide.axis === 'x') ? w / oldW : h / oldH),
        }));
      });
    } else {
      const col = anchor % 3, row = Math.floor(anchor / 3);
      const offsetX = col === 0 ? 0 : col === 1 ? Math.round((w - doc.width) / 2) : w - doc.width;
      const offsetY = row === 0 ? 0 : row === 1 ? Math.round((h - doc.height) / 2) : h - doc.height;
      resizeCanvas(store, w, h, offsetX, offsetY);
    }
    onClose();
  };

  return (
    <Modal
      title={t('dialog.resize.title')}
      icon="resize"
      onClose={onClose}
      size="md"
      footer={(
        <>
          <span className="modal-footer-note">{t('dialog.resize.warning')}</span>
          <span className="modal-footer-spacer" />
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" icon="resize" onClick={apply}>{t('dialog.resize.apply')}</Button>
        </>
      )}
    >
      <FormGrid>
        <Field label={t('dialog.resize.width')}>
          <NumberInput value={width} min={1} max={1024} onChange={setWidth} autoFocus />
        </Field>
        <Field label={t('dialog.resize.height')}>
          <NumberInput value={height} min={1} max={1024} onChange={setHeight} />
        </Field>
        <Field label={t('dialog.resize.anchor')} className="span-2">
          <div className="anchor-grid" role="group">
            {Array.from({ length: 9 }, (_, index) => (
              <button
                key={index}
                type="button"
                className={anchor === index ? 'is-active' : ''}
                onClick={() => setAnchor(index)}
                aria-label={`anchor ${index + 1}`}
              >
                <span className="anchor-dot" />
              </button>
            ))}
          </div>
        </Field>
      </FormGrid>
      <Toggle checked={scaleArt} onChange={setScaleArt} label={t('dialog.resize.scaleArt')} hint={t('dialog.resize.scaleWarning')} />
      {error ? <InfoNote icon="warning" tone="error">{error}</InfoNote> : null}
      <div className="resize-actions">
        <Button variant="ghost" icon="crop" onClick={() => { cropToSelection(store); onClose(); }} disabled={!doc.selection || doc.selection.empty}>{t('dialog.resize.cropSelection')}</Button>
        <Button variant="ghost" icon="crop" onClick={() => { trimToContent(store); onClose(); }}>{t('dialog.resize.trim')}</Button>
      </div>
    </Modal>
  );
}

function nearestScale(data, sw, sh, dw, dh) {
  const out = new Uint8ClampedArray(dw * dh * 4);
  for (let y = 0; y < dh; y++) {
    const sy = Math.min(sh - 1, Math.floor((y * sh) / dh));
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(sw - 1, Math.floor((x * sw) / dw));
      const si = (sy * sw + sx) * 4, di = (y * dw + x) * 4;
      out[di] = data[si]; out[di + 1] = data[si + 1];
      out[di + 2] = data[si + 2]; out[di + 3] = data[si + 3];
    }
  }
  return out;
}

export function EffectsDialog({ initial = null, onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const [type, setType] = useState(initial || 'outline');
  const [color, setColor] = useState(store.ui.primary || '#f4f4f4');
  const [outside, setOutside] = useState(true);
  const [connectivity, setConnectivity] = useState('8');
  const [opacity, setOpacity] = useState(255);
  const [dx, setDx] = useState(1);
  const [dy, setDy] = useState(1);
  const [from, setFrom] = useState(store.ui.secondary || '#1a1c2c');
  const [to, setTo] = useState(store.ui.primary || '#f4f4f4');
  const [tolerance, setTolerance] = useState(0);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(1);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(1);
  const [selectionOnly, setSelectionOnly] = useState(true);
  const hasSelection = store.doc?.selection && !store.doc.selection.empty;

  const apply = () => {
    const opts = selectionOnly ? {} : { selectionOnly: false };
    let effect = type;
    let options = {};
    if (type === 'outline') options = { color, outside, connectivity: Number(connectivity), opacity };
    else if (type === 'shadow') options = { color, dx, dy, opacity };
    else if (type === 'replace') options = { from, to, tolerance };
    else if (type === 'adjust') options = { hue, saturation, brightness, contrast };
    applyEffect(store, effect, { ...options, ...opts });
    store.toast(t('dialog.effects.done'), 'success');
    onClose();
  };

  return (
    <Modal
      title={t('dialog.effects.title')}
      subtitle={t('dialog.effects.previewHint')}
      icon="sparkles"
      onClose={onClose}
      size="md"
      footer={(
        <>
          <span className="modal-footer-note">{hasSelection ? t('dialog.effects.selectionOnly') : t('dialog.effects.noSelection')}</span>
          <span className="modal-footer-spacer" />
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" icon="sparkles" onClick={apply}>{t('dialog.effects.apply')}</Button>
        </>
      )}
    >
      <Field label={t('dialog.effects.type')}>
        <Select
          value={type}
          onChange={setType}
          options={[
            { value: 'outline', label: t('dialog.effects.outline') },
            { value: 'shadow', label: t('dialog.effects.shadow') },
            { value: 'isolated', label: t('dialog.effects.removeIsolated') },
            { value: 'replace', label: t('dialog.effects.replaceColor') },
            { value: 'invert', label: t('dialog.effects.invert') },
            { value: 'grayscale', label: t('dialog.effects.grayscale') },
            { value: 'adjust', label: t('dialog.effects.adjust') },
          ]}
        />
      </Field>
      {type === 'outline' ? (
        <FormGrid>
          <Field label={t('dialog.effects.color')}>
            <input type="color" className="color-input" value={color} onChange={(event) => setColor(event.target.value)} />
          </Field>
          <Field label={t('dialog.effects.position')}>
            <Segmented value={outside ? 'outside' : 'inside'} onChange={(value) => setOutside(value === 'outside')} options={[
              { value: 'outside', label: t('dialog.effects.outside') },
              { value: 'inside', label: t('dialog.effects.inside') },
            ]} />
          </Field>
          <Field label={t('dialog.effects.directions')}>
            <Segmented value={connectivity} onChange={setConnectivity} options={[
              { value: '4', label: t('dialog.effects.directions4') },
              { value: '8', label: t('dialog.effects.directions8') },
            ]} />
          </Field>
          <Field label="Opacity">
            <Slider value={opacity} min={0} max={255} onChange={setOpacity} />
          </Field>
        </FormGrid>
      ) : null}
      {type === 'shadow' ? (
        <FormGrid>
          <Field label={t('dialog.effects.color')}>
            <input type="color" className="color-input" value={color} onChange={(event) => setColor(event.target.value)} />
          </Field>
          <Field label="Opacity"><Slider value={opacity} min={0} max={255} onChange={setOpacity} /></Field>
          <Field label={t('dialog.effects.offsetX')}><NumberInput value={dx} min={-64} max={64} onChange={setDx} /></Field>
          <Field label={t('dialog.effects.offsetY')}><NumberInput value={dy} min={-64} max={64} onChange={setDy} /></Field>
        </FormGrid>
      ) : null}
      {type === 'replace' ? (
        <FormGrid>
          <Field label={t('dialog.effects.replaceFrom')}>
            <input type="color" className="color-input" value={from} onChange={(event) => setFrom(event.target.value)} />
          </Field>
          <Field label={t('dialog.effects.replaceTo')}>
            <input type="color" className="color-input" value={to} onChange={(event) => setTo(event.target.value)} />
          </Field>
          <Field label={t('dialog.effects.tolerance')} className="span-2">
            <Slider value={tolerance} min={0} max={255} onChange={setTolerance} />
          </Field>
        </FormGrid>
      ) : null}
      {type === 'adjust' ? (
        <>
          <Slider label={t('dialog.effects.hue')} value={hue} min={-180} max={180} onChange={setHue} />
          <Slider label={t('dialog.effects.saturation')} value={saturation} min={0} max={2} step={0.05} onChange={setSaturation} />
          <Slider label={t('dialog.effects.brightness')} value={brightness} min={-1} max={1} step={0.01} onChange={setBrightness} />
          <Slider label={t('dialog.effects.contrast')} value={contrast} min={0.2} max={3} step={0.05} onChange={setContrast} />
        </>
      ) : null}
      <Toggle
        checked={selectionOnly}
        onChange={setSelectionOnly}
        label={t('dialog.effects.selectionOnly')}
        hint={hasSelection ? t('dialog.effects.selectionOnly') : t('dialog.effects.noSelection')}
        disabled={!hasSelection}
      />
    </Modal>
  );
}

export function GridDialog({ onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const doc = store.doc;
  const [grid, setLocalGrid] = useState(() => ({ x: doc?.grid?.x || 0, y: doc?.grid?.y || 0, w: doc?.grid?.w || 16, h: doc?.grid?.h || 16 }));
  const [showGrid, setShowGrid] = useState(!!store.ui.showGrid);
  const [snap, setSnap] = useState(!!store.ui.snapToGrid);
  const [showPixelGrid, setShowPixelGrid] = useState(store.ui.showPixelGrid !== false);
  const [color, setColor] = useState(store.ui.gridOverlayColor || '#ffffff22');
  const set = (patch) => setLocalGrid((value) => ({ ...value, ...patch }));
  const save = () => {
    setGrid(store, {
      x: Math.round(grid.x), y: Math.round(grid.y),
      w: Math.max(1, Math.round(grid.w)), h: Math.max(1, Math.round(grid.h)),
    });
    store.setUI({ showGrid, snapToGrid: snap, showPixelGrid, gridOverlayColor: color });
    onClose();
  };
  return (
    <Modal
      title={t('dialog.grid.title')}
      icon="grid"
      onClose={onClose}
      size="sm"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <span className="modal-footer-spacer" />
          <Button variant="primary" icon="check" onClick={save}>{t('common.save')}</Button>
        </>
      )}
    >
      <FormGrid>
        <Field label={t('dialog.grid.cellW')}><NumberInput value={grid.w} min={1} max={512} onChange={(value) => set({ w: value })} autoFocus /></Field>
        <Field label={t('dialog.grid.cellH')}><NumberInput value={grid.h} min={1} max={512} onChange={(value) => set({ h: value })} /></Field>
        <Field label={t('dialog.grid.offsetX')}><NumberInput value={grid.x} min={0} max={512} onChange={(value) => set({ x: value })} /></Field>
        <Field label={t('dialog.grid.offsetY')}><NumberInput value={grid.y} min={0} max={512} onChange={(value) => set({ y: value })} /></Field>
        <Field label={t('dialog.settings.gridColor')} className="span-2">
          <div className="color-with-alpha">
            <input type="color" value={normalizeColor(color)} onChange={(event) => setColor(event.target.value)} />
            <input className="text-input mono" value={color} onChange={(event) => setColor(event.target.value)} />
          </div>
        </Field>
      </FormGrid>
      <div className="toggle-grid">
        <Toggle checked={showGrid} onChange={setShowGrid} label={t('dialog.settings.showGrid')} />
        <Toggle checked={showPixelGrid} onChange={setShowPixelGrid} label={t('viewport.pixelGrid')} />
        <Toggle checked={snap} onChange={setSnap} label={t('dialog.grid.snap')} />
      </div>
    </Modal>
  );
}

function normalizeColor(value) {
  const match = String(value || '#ffffff').match(/^#([0-9a-f]{6})/i);
  return match ? `#${match[1]}` : '#ffffff';
}

export function GuidesDialog({ onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const doc = store.doc;
  const [guides, setGuides] = useState(() => (doc?.guides || []).map((guide) => ({ ...guide })));
  const [position, setPosition] = useState(Math.round((doc?.width || 32) / 2));
  const [orientation, setOrientation] = useState('vertical');
  const [showGuides, setShowGuides] = useState(store.ui.showGuides !== false);
  const [snap, setSnap] = useState(store.ui.snapToGuides !== false);

  const add = () => {
    const max = orientation === 'vertical' ? doc.width : doc.height;
    setGuides((list) => [...list, {
      id: `guide_${Date.now().toString(36)}_${list.length}`,
      orientation,
      position: Math.max(0, Math.min(max, Math.round(Number(position) || 0))),
    }]);
  };
  const update = (index, patch) => setGuides((list) => list.map((guide, i) => (i === index ? { ...guide, ...patch } : guide)));
  const remove = (index) => setGuides((list) => list.filter((_, i) => i !== index));
  const save = () => {
    setDocumentProps(store, { guides }, t('viewport.guides'));
    store.setUI({ showGuides, snapToGuides: snap });
    onClose();
  };

  return (
    <Modal
      title={t('dialog.guides.title')}
      icon="anchor"
      onClose={onClose}
      size="md"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <span className="modal-footer-spacer" />
          <Button variant="primary" icon="check" onClick={save}>{t('common.save')}</Button>
        </>
      )}
    >
      <div className="guide-add-row">
        <Select value={orientation} onChange={setOrientation} options={[
          { value: 'vertical', label: t('dialog.guides.vertical') },
          { value: 'horizontal', label: t('dialog.guides.horizontal') },
        ]} />
        <NumberInput value={position} min={0} max={Math.max(doc?.width || 1, doc?.height || 1)} onChange={setPosition} />
        <Button variant="primary" icon="plus" onClick={add}>{t('dialog.guides.add')}</Button>
      </div>
      {guides.length === 0 ? (
        <EmptyState icon="anchor" title={t('dialog.guides.none')}>
          <span>{t('viewport.addGuide')}</span>
        </EmptyState>
      ) : (
        <div className="guide-list">
          {guides.map((guide, index) => (
            <div key={guide.id || index} className="guide-row">
              <Select
                value={guide.orientation || (guide.axis === 'y' ? 'horizontal' : 'vertical')}
                onChange={(value) => update(index, { orientation: value, axis: undefined, type: undefined })}
                options={[
                  { value: 'vertical', label: t('dialog.guides.vertical') },
                  { value: 'horizontal', label: t('dialog.guides.horizontal') },
                ]}
              />
              <NumberInput
                value={guide.position ?? guide.pos ?? guide.x ?? 0}
                min={0}
                max={Math.max(doc?.width || 1, doc?.height || 1)}
                onChange={(value) => update(index, { position: value, pos: undefined, x: undefined, y: undefined })}
              />
              <span className="guide-unit">px</span>
              <IconButton icon="trash" label={t('common.delete')} onClick={() => remove(index)} />
            </div>
          ))}
        </div>
      )}
      <div className="toggle-grid">
        <Toggle checked={showGuides} onChange={setShowGuides} label={t('viewport.guides')} />
        <Toggle checked={snap} onChange={setSnap} label={t('dialog.guides.snap')} />
      </div>
    </Modal>
  );
}

export function HistoryDialog({ onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const history = store.history;
  if (!history) return null;
  const entries = history.describe();
  const current = history.index;
  const jump = (index) => {
    jumpHistory(store, index);
  };
  const clear = () => {
    store.askConfirm({
      title: t('dialog.history.clear'),
      message: t('dialog.history.clearHint'),
      danger: true,
      onConfirm: () => {
        history.clear();
        store.emit('history:change');
        store.emit('doc:change');
      },
    });
  };
  const rows = [...entries].reverse();
  return (
    <Modal
      title={t('dialog.history.title')}
      subtitle={`${entries.length} ${t('dialog.history.actions')} · ${formatBytes(history.memory)} / ${formatBytes(history.limitBytes)}`}
      icon="history"
      onClose={onClose}
      size="md"
      footer={(
        <>
          <Button variant="ghost" icon="trash" onClick={clear} disabled={!entries.length}>{t('dialog.history.clear')}</Button>
          <span className="modal-footer-spacer" />
          <Button variant="primary" onClick={onClose}>{t('common.close')}</Button>
        </>
      )}
    >
      <div className="history-list">
        <button type="button" className={`history-row initial ${current === 0 ? 'is-current' : ''}`} onClick={() => jump(0)}>
          <span className="history-icon"><Icon name="file" size={14} /></span>
          <span className="history-name">{t('dialog.history.initial')}</span>
          <span className="history-state">{current === 0 ? t('dialog.history.current') : ''}</span>
        </button>
        {rows.map((entry) => {
          const stateIndex = entry.index + 1;
          return (
            <button
              key={`${entry.index}-${entry.label}`}
              type="button"
              className={`history-row ${stateIndex === current ? 'is-current' : ''} ${stateIndex > current ? 'is-future' : ''}`}
              onClick={() => jump(stateIndex)}
            >
              <span className="history-icon"><Icon name={entry.icon || 'pencil'} size={14} /></span>
              <span className="history-name">{entry.label || t('dialog.history.action')}</span>
              <span className="history-size">{entry.size ? formatBytes(entry.size) : ''}</span>
              <span className="history-state">{stateIndex === current ? t('dialog.history.current') : ''}</span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function GrowSelectionDialog({ onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const [amount, setAmount] = useState(1);
  const [mode, setMode] = useState('grow');
  const apply = () => {
    const value = Math.max(1, Math.min(32, Math.round(Number(amount) || 1)));
    selectionGrow(store, mode === 'grow' ? value : -value);
    store.toast(t(mode === 'grow' ? 'toast.selectionGrown' : 'toast.selectionShrunk'), 'info', 1600);
    onClose();
  };
  return (
    <Modal
      title={t('dialog.grow.title')}
      icon="target"
      onClose={onClose}
      size="sm"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <span className="modal-footer-spacer" />
          <Button variant="primary" icon="check" onClick={apply}>{t('common.apply')}</Button>
        </>
      )}
    >
      <Segmented value={mode} onChange={setMode} options={[
        { value: 'grow', label: t('dialog.grow.grow'), icon: 'plus' },
        { value: 'shrink', label: t('dialog.grow.shrink'), icon: 'minus' },
      ]} />
      <Field label={t('dialog.grow.amount')}>
        <NumberInput value={amount} min={1} max={32} onChange={setAmount} autoFocus />
      </Field>
      <InfoNote icon="info">{t('dialog.grow.hint')}</InfoNote>
    </Modal>
  );
}
