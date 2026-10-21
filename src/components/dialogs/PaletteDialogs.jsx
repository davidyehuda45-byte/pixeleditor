import React, { useMemo, useState } from 'react';
import { useI18n, useStore } from '../../ui/hooks.jsx';
import { Modal, DialogSection, InfoNote, FormGrid, DialogTabs } from './Modal.jsx';
import {
  Button, Field, NumberInput, Select, Toggle, IconButton, EmptyState, Swatch, Slider, Segmented,
} from '../../ui/controls.jsx';
import { Icon } from '../Icon.jsx';
import {
  setPalette, setPaletteColor, addPaletteColor, removePaletteColor, addPaletteSet,
  selectPaletteSet, setIndexedMode, runStructural, setDocumentProps,
} from '../../core/commands.js';
import {
  duplicatePalette, extractPaletteFromFrame, exportPaletteFile, importPalettePicked,
} from '../../ui/actions.js';
import { BUILTIN_PALETTES, Palette } from '../../core/palette.js';
import { pickFiles, downloadSingle } from '../../io/file.js';

export function PaletteDialog({ onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const doc = store.doc;
  const paletteSet = doc?.palette;
  const [selectedColor, setSelectedColor] = useState(null);
  const [builtin, setBuiltin] = useState(Object.keys(BUILTIN_PALETTES)[0] || 'Sweetie 16');
  const [exportFormat, setExportFormat] = useState('gpl');
  const [newName, setNewName] = useState('Palette baru');
  if (!doc || !paletteSet) return null;
  const palette = paletteSet.current;
  const activeIndex = paletteSet.active;
  const colors = palette?.colors || [];

  const select = (index) => {
    setSelectedColor(null);
    selectPaletteSet(store, index);
  };
  const rename = (value, commit = false) => {
    const name = value;
    if (!commit) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setPalette(store, (set) => { set.current.name = trimmed; }, t('dialog.palette.rename'));
  };
  const addBuiltin = () => {
    const colorsList = BUILTIN_PALETTES[builtin] || [];
    addPaletteSet(store, builtin, colorsList);
    store.setDialog({ type: 'palette' });
    setSelectedColor(null);
  };
  const addEmpty = () => {
    addPaletteSet(store, newName.trim() || 'Palette', [store.ui.primary].filter(Boolean));
    setSelectedColor(null);
  };
  const remove = () => {
    if (paletteSet.palettes.length <= 1) {
      store.toast(t('dialog.palette.lastPalette'), 'warn');
      return;
    }
    store.askConfirm({
      title: t('dialog.palette.delete'),
      message: t('dialog.palette.deleteConfirm', { name: palette?.name || '' }),
      danger: true,
      onConfirm: () => setPalette(store, (set) => {
        set.palettes.splice(activeIndex, 1);
        set.active = Math.max(0, Math.min(set.palettes.length - 1, activeIndex));
      }, t('dialog.palette.delete')),
    });
  };
  const toggleLock = () => setPalette(store, (set) => { set.current.locked = !set.current.locked; }, t('dialog.palette.lock'));
  const toggleIndexed = (value) => setIndexedMode(store, value);
  const importPalette = async () => {
    const files = await pickFiles(['palette'], { multiple: false });
    if (files.length) await importPalettePicked(store, files[0]);
  };
  const exportPalette = async () => {
    await exportPaletteFile(store, exportFormat);
  };
  const addColor = () => addPaletteColor(store, store.ui.primary);
  const changeColor = (index, value) => {
    setPaletteColor(store, index, value);
    store.setUI({ primary: value });
  };

  return (
    <Modal
      title={t('dialog.palette.title')}
      icon="palette"
      onClose={onClose}
      size="xl"
      footer={(
        <>
          <Button variant="ghost" icon="upload" onClick={importPalette}>{t('dialog.palette.import')}</Button>
          <div className="inline-select">
            <Select value={exportFormat} onChange={setExportFormat} options={[
              { value: 'gpl', label: 'GPL' },
              { value: 'hex', label: 'HEX' },
              { value: 'jasc', label: 'JASC PAL' },
            ]} />
            <Button variant="ghost" icon="download" onClick={exportPalette}>{t('dialog.palette.export')}</Button>
          </div>
          <span className="modal-footer-spacer" />
          <Button variant="primary" onClick={onClose}>{t('common.close')}</Button>
        </>
      )}
    >
      <div className="palette-layout">
        <aside className="palette-sets">
          <div className="dialog-section-head">
            <h3>{t('dialog.palette.select')}</h3>
            <span>{paletteSet.palettes.length}</span>
          </div>
          <div className="palette-set-list">
            {paletteSet.palettes.map((item, index) => (
              <button key={index} type="button" className={`palette-set-row ${index === activeIndex ? 'is-active' : ''}`} onClick={() => select(index)}>
                <span className="palette-set-swatch">
                  {(item.colors || []).slice(0, 4).map((color, ci) => <i key={ci} style={{ background: color }} />)}
                </span>
                <span className="palette-set-copy">
                  <strong>{item.name || `${t('dialog.palette.rename')} ${index + 1}`}</strong>
                  <span>{(item.colors || []).length} {t('dialog.palette.colors').toLowerCase()}</span>
                </span>
                {item.locked ? <Icon name="lock" size={12} /> : null}
              </button>
            ))}
          </div>
          <DialogSection title={t('dialog.palette.addTitle')}>
            <Field label={t('dialog.palette.addBuiltin')}>
              <Select value={builtin} onChange={setBuiltin} options={Object.keys(BUILTIN_PALETTES).map((name) => ({ value: name, label: name }))} />
            </Field>
            <Button variant="ghost" size="sm" icon="plus" onClick={addBuiltin}>{t('dialog.palette.create')}</Button>
            <Field label={t('dialog.palette.name')}>
              <input className="text-input" value={newName} maxLength={40} onChange={(event) => setNewName(event.target.value)} />
            </Field>
            <Button variant="ghost" size="sm" icon="plus" onClick={addEmpty}>{t('dialog.palette.addEmpty')}</Button>
          </DialogSection>
        </aside>

        <section className="palette-main">
          <div className="palette-main-head">
            <div className="palette-title">
              <Icon name="palette" size={18} />
              <input
                className="inline-title-input"
                key={`${activeIndex}-${palette?.name}`}
                defaultValue={palette?.name || ''}
                maxLength={40}
                onBlur={(event) => rename(event.target.value, true)}
                onKeyDown={(event) => { if (event.key === 'Enter') { event.currentTarget.blur(); } }}
              />
            </div>
            <div className="palette-main-actions">
              <Button size="sm" variant="ghost" icon="copy" onClick={() => duplicatePalette(store)}>{t('dialog.palette.duplicate')}</Button>
              <Button size="sm" variant="ghost" icon={palette?.locked ? 'unlock' : 'lock'} onClick={toggleLock}>
                {palette?.locked ? t('dialog.palette.unlock') : t('dialog.palette.lock')}
              </Button>
              <Button size="sm" variant="ghost" icon="trash" onClick={remove}>{t('dialog.palette.delete')}</Button>
            </div>
          </div>

          <div className="palette-toolbar">
            <Toggle checked={!!paletteSet.indexed} onChange={toggleIndexed} label={t('palette.indexed')} />
            <span className="palette-count">{colors.length} / 256</span>
            <span className="modal-footer-spacer" />
            <Button size="sm" variant="ghost" icon="eyedropper" onClick={() => store.setUI({ primary: selectedColor != null ? colors[selectedColor] : store.ui.primary })} disabled={selectedColor == null}>
              {t('dialog.palette.use')}
            </Button>
            <Button size="sm" variant="primary" icon="plus" onClick={addColor}>{t('common.add')}</Button>
          </div>

          {colors.length === 0 ? (
            <EmptyState icon="palette" title={t('dialog.palette.empty')}>
              <Button size="sm" variant="primary" icon="plus" onClick={addColor}>{t('common.add')}</Button>
            </EmptyState>
          ) : (
            <div className="palette-color-grid">
              {colors.map((color, index) => (
                <div key={`${index}-${color}`} className={`palette-color-cell ${selectedColor === index ? 'is-active' : ''}`}>
                  <button
                    type="button"
                    className="palette-color-main"
                    style={{ background: color }}
                    title={color}
                    onClick={() => { setSelectedColor(index); store.setUI({ primary: color }); }}
                  />
                  <label className="palette-color-edit" title={color}>
                    <input type="color" value={color.length > 7 ? color.slice(0, 7) : color} onChange={(event) => changeColor(index, event.target.value)} />
                    <Icon name="pencil" size={9} />
                  </label>
                  <span className="palette-color-hex">{color}</span>
                  {selectedColor === index ? (
                    <button
                      type="button"
                      className="palette-color-remove"
                      title={t('common.delete')}
                      onClick={() => { removePaletteColor(store, index); setSelectedColor(null); }}
                    >
                      <Icon name="close" size={9} />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          <div className="palette-bottom">
            <Button variant="ghost" icon="wand" onClick={() => store.setDialog({ type: 'extractPalette' })}>{t('dialog.palette.extract')}</Button>
            <span className="modal-footer-spacer" />
            <span className="muted">{t('dialog.palette.current')}: {palette?.name || ''}</span>
          </div>
        </section>
      </div>
    </Modal>
  );
}

export function ExtractPaletteDialog({ onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const [maxColors, setMaxColors] = useState(32);
  const [median, setMedian] = useState(true);
  const [error, setError] = useState('');
  const run = () => {
    const colors = extractPaletteFromFrame(store, { maxColors, median });
    if (!colors?.length) {
      setError(t('colors.noPixels'));
      return;
    }
    store.toast(t('dialog.palette.extracted', { n: colors.length }), 'success', 2200);
    onClose();
  };
  return (
    <Modal
      title={t('dialog.palette.extract')}
      subtitle={t('colors.extractHint')}
      icon="wand"
      onClose={onClose}
      size="sm"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <span className="modal-footer-spacer" />
          <Button variant="primary" icon="wand" onClick={run}>{t('colors.extract')}</Button>
        </>
      )}
    >
      <Slider label={t('dialog.palette.extractN')} value={maxColors} min={2} max={256} onChange={setMaxColors} />
      <Toggle checked={median} onChange={setMedian} label={t('colors.medianCut')} hint={t('colors.medianHint')} />
      {error ? <InfoNote icon="warning" tone="error">{error}</InfoNote> : null}
    </Modal>
  );
}

export function MetadataDialog({ onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const doc = store.doc;
  const [tab, setTab] = useState('slices');
  const [slices, setSlices] = useState(() => cloneJson(doc?.slices || []));
  const [hitboxes, setHitboxes] = useState(() => cloneJson(doc?.hitboxes || []));
  const [anchors, setAnchors] = useState(() => cloneJson(doc?.anchors || []));
  const [userData, setUserData] = useState(() => JSON.stringify(doc?.userData || {}, null, 2));
  const [pivots, setPivots] = useState(() => Object.fromEntries((doc?.frames || []).map((frame) => [
    frame.id, { x: frame.userData?.pivot?.x ?? Math.round((doc.width || 1) / 2), y: frame.userData?.pivot?.y ?? (doc.height || 1) },
  ])));
  const [error, setError] = useState('');
  if (!doc) return null;
  const selection = doc.selection && !doc.selection.empty ? doc.selection.bounds : null;

  const addSlice = () => {
    if (!selection) { store.toast(t('dialog.metadata.noSelection'), 'warn'); return; }
    setSlices((list) => [...list, {
      name: `slice_${list.length + 1}`,
      color: store.ui.primary || '#7c6cf5',
      frames: [{
        frame: store.activeFrameIndex,
        rect: [selection.x, selection.y, selection.w, selection.h],
        pivot: [0.5, 1],
      }],
    }]);
  };
  const addHitbox = () => {
    if (!selection) { store.toast(t('dialog.metadata.noSelection'), 'warn'); return; }
    setHitboxes((list) => [...list, {
      name: `hitbox_${list.length + 1}`,
      frame: store.activeFrameIndex,
      shape: 'rect',
      rect: [selection.x, selection.y, selection.w, selection.h],
    }]);
  };
  const addAnchor = () => setAnchors((list) => [...list, {
    name: `anchor_${list.length + 1}`,
    x: Math.round(doc.width / 2),
    y: doc.height,
  }]);

  const updateSlice = (index, patch) => setSlices((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const updateSliceKey = (index, keyIndex, patch) => setSlices((list) => list.map((item, i) => {
    if (i !== index) return item;
    const frames = item.frames.map((key, ki) => (ki === keyIndex ? { ...key, ...patch } : key));
    return { ...item, frames };
  }));
  const addSliceKey = (index) => {
    if (!selection) { store.toast(t('dialog.metadata.noSelection'), 'warn'); return; }
    setSlices((list) => list.map((item, i) => {
      if (i !== index) return item;
      return { ...item, frames: [...item.frames, { frame: store.activeFrameIndex, rect: [selection.x, selection.y, selection.w, selection.h], pivot: [0.5, 1] }] };
    }));
  };
  const updateHitbox = (index, patch) => setHitboxes((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const updateAnchor = (index, patch) => setAnchors((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const save = () => {
    let parsed = {};
    try {
      parsed = userData.trim() ? JSON.parse(userData) : {};
    } catch (err) {
      setError(t('dialog.metadata.invalidJson', { message: err.message }));
      setTab('userData');
      return;
    }
    runStructural(store, t('dialog.metadata.title'), (document) => {
      document.slices = cloneJson(slices);
      document.hitboxes = cloneJson(hitboxes);
      document.anchors = cloneJson(anchors);
      document.userData = parsed;
      for (const frame of document.frames) {
        const pivot = pivots[frame.id];
        if (!pivot) continue;
        frame.userData = { ...(frame.userData || {}), pivot: { x: Number(pivot.x) || 0, y: Number(pivot.y) || 0 } };
      }
    });
    store.toast(t('dialog.metadata.saved'), 'success');
    onClose();
  };

  const tabs = [
    { value: 'slices', label: t('dialog.metadata.tabSlices'), icon: 'crop', badge: slices.length },
    { value: 'hitboxes', label: t('dialog.metadata.tabHitboxes'), icon: 'target', badge: hitboxes.length },
    { value: 'anchors', label: t('dialog.metadata.tabAnchors'), icon: 'anchor', badge: anchors.length },
    { value: 'pivots', label: t('dialog.metadata.tabPivots'), icon: 'circle-dot', badge: doc.frames.length },
    { value: 'userData', label: t('dialog.metadata.tabUserData'), icon: 'code' },
  ];

  return (
    <Modal
      title={t('dialog.metadata.title')}
      subtitle={t('dialog.metadata.subtitle')}
      icon="box"
      onClose={onClose}
      size="xl"
      footer={(
        <>
          <span className="modal-footer-note">{t('dialog.metadata.subtitle')}</span>
          <span className="modal-footer-spacer" />
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" icon="save" onClick={save}>{t('common.save')}</Button>
        </>
      )}
    >
      <DialogTabs tabs={tabs} value={tab} onChange={setTab} />
      <div className="metadata-content">
        {tab === 'slices' ? (
          <DialogSection
            title={t('dialog.metadata.tabSlices')}
            actions={<Button size="sm" variant="ghost" icon="plus" onClick={addSlice}>{t('dialog.metadata.addSlice')}</Button>}
          >
            {slices.length === 0 ? <EmptyState icon="crop" title={t('dialog.metadata.noSlices')} /> : (
              <div className="metadata-list">
                {slices.map((slice, index) => (
                  <div key={index} className="metadata-card">
                    <div className="metadata-card-head">
                      <input className="text-input" value={slice.name || ''} onChange={(event) => updateSlice(index, { name: event.target.value })} />
                      <input type="color" className="color-input small" value={normalizeColor(slice.color || '#7c6cf5')} onChange={(event) => updateSlice(index, { color: event.target.value })} />
                      <Button size="sm" variant="ghost" icon="plus" onClick={() => addSliceKey(index)}>{t('dialog.metadata.addKey')}</Button>
                      <IconButton icon="trash" label={t('common.delete')} onClick={() => setSlices((list) => list.filter((_, i) => i !== index))} />
                    </div>
                    <div className="slice-keys">
                      {(slice.frames || []).map((key, keyIndex) => (
                        <div key={keyIndex} className="slice-key">
                          <Field label={t('dialog.metadata.frame')}>
                            <NumberInput value={key.frame || 0} min={0} max={doc.frames.length - 1} onChange={(value) => updateSliceKey(index, keyIndex, { frame: value })} />
                          </Field>
                          {['x', 'y', 'w', 'h'].map((field, fi) => (
                            <Field key={field} label={['X', 'Y', 'W', 'H'][fi]}>
                              <NumberInput
                                value={key.rect?.[fi] ?? 0}
                                min={0}
                                max={1024}
                                onChange={(value) => {
                                  const rect = [...(key.rect || [0, 0, 1, 1])];
                                  rect[fi] = value;
                                  updateSliceKey(index, keyIndex, { rect });
                                }}
                              />
                            </Field>
                          ))}
                          <Field label="Pivot X">
                            <NumberInput value={key.pivot?.[0] ?? 0.5} min={0} max={1} step={0.1} onChange={(value) => updateSliceKey(index, keyIndex, { pivot: [value, key.pivot?.[1] ?? 1] })} />
                          </Field>
                          <Field label="Pivot Y">
                            <NumberInput value={key.pivot?.[1] ?? 1} min={0} max={1} step={0.1} onChange={(value) => updateSliceKey(index, keyIndex, { pivot: [key.pivot?.[0] ?? 0.5, value] })} />
                          </Field>
                          {slice.frames.length > 1 ? (
                            <IconButton icon="trash" label={t('common.delete')} onClick={() => updateSlice(index, { frames: slice.frames.filter((_, i) => i !== keyIndex) })} />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogSection>
        ) : null}

        {tab === 'hitboxes' ? (
          <DialogSection
            title={t('dialog.metadata.tabHitboxes')}
            actions={<Button size="sm" variant="ghost" icon="plus" onClick={addHitbox}>{t('dialog.metadata.addHitbox')}</Button>}
          >
            {hitboxes.length === 0 ? <EmptyState icon="target" title={t('dialog.metadata.noHitboxes')} /> : (
              <div className="metadata-table">
                <div className="metadata-table-head"><span>{t('dialog.metadata.name')}</span><span>{t('dialog.metadata.frame')}</span><span>{t('dialog.metadata.shape')}</span><span>X</span><span>Y</span><span>W</span><span>H</span><span /></div>
                {hitboxes.map((hitbox, index) => (
                  <div key={index} className="metadata-table-row">
                    <input className="text-input" value={hitbox.name || ''} onChange={(event) => updateHitbox(index, { name: event.target.value })} />
                    <NumberInput value={hitbox.frame || 0} min={0} max={doc.frames.length - 1} onChange={(value) => updateHitbox(index, { frame: value })} />
                    <Select value={hitbox.shape || 'rect'} onChange={(value) => updateHitbox(index, { shape: value })} options={[
                      { value: 'rect', label: t('dialog.metadata.rect') },
                      { value: 'circle', label: t('dialog.metadata.circle') },
                      { value: 'polygon', label: t('dialog.metadata.polygon') },
                    ]} />
                    {[0, 1, 2, 3].map((fi) => (
                      <NumberInput
                        key={fi}
                        value={hitbox.rect?.[fi] ?? 0}
                        min={0}
                        max={1024}
                        onChange={(value) => {
                          const rect = [...(hitbox.rect || [0, 0, 1, 1])];
                          rect[fi] = value;
                          updateHitbox(index, { rect });
                        }}
                      />
                    ))}
                    <IconButton icon="trash" label={t('common.delete')} onClick={() => setHitboxes((list) => list.filter((_, i) => i !== index))} />
                  </div>
                ))}
              </div>
            )}
          </DialogSection>
        ) : null}

        {tab === 'anchors' ? (
          <DialogSection
            title={t('dialog.metadata.tabAnchors')}
            actions={<Button size="sm" variant="ghost" icon="plus" onClick={addAnchor}>{t('dialog.metadata.addAnchor')}</Button>}
          >
            {anchors.length === 0 ? <EmptyState icon="anchor" title={t('dialog.metadata.noAnchors')} /> : (
              <div className="metadata-table narrow">
                <div className="metadata-table-head"><span>{t('dialog.metadata.name')}</span><span>X</span><span>Y</span><span /></div>
                {anchors.map((anchor, index) => (
                  <div key={index} className="metadata-table-row">
                    <input className="text-input" value={anchor.name || ''} onChange={(event) => updateAnchor(index, { name: event.target.value })} />
                    <NumberInput value={anchor.x || 0} min={-1024} max={1024} onChange={(value) => updateAnchor(index, { x: value })} />
                    <NumberInput value={anchor.y || 0} min={-1024} max={1024} onChange={(value) => updateAnchor(index, { y: value })} />
                    <IconButton icon="trash" label={t('common.delete')} onClick={() => setAnchors((list) => list.filter((_, i) => i !== index))} />
                  </div>
                ))}
              </div>
            )}
          </DialogSection>
        ) : null}

        {tab === 'pivots' ? (
          <DialogSection title={t('dialog.metadata.tabPivots')}>
            <div className="pivot-grid">
              {doc.frames.map((frame, index) => (
                <div key={frame.id} className="pivot-card">
                  <strong>{t('dialog.metadata.frameIndex', { index: index + 1 })}</strong>
                  <Field label="X">
                    <NumberInput value={pivots[frame.id]?.x ?? 0} min={0} max={doc.width} onChange={(value) => setPivots((state) => ({ ...state, [frame.id]: { ...state[frame.id], x: value } }))} />
                  </Field>
                  <Field label="Y">
                    <NumberInput value={pivots[frame.id]?.y ?? 0} min={0} max={doc.height} onChange={(value) => setPivots((state) => ({ ...state, [frame.id]: { ...state[frame.id], y: value } }))} />
                  </Field>
                  <Button size="sm" variant="ghost" onClick={() => setPivots((state) => ({ ...state, [frame.id]: { x: Math.round(doc.width / 2), y: doc.height } }))}>
                    {t('dialog.metadata.autoBottom')}
                  </Button>
                </div>
              ))}
            </div>
          </DialogSection>
        ) : null}

        {tab === 'userData' ? (
          <DialogSection title={t('dialog.metadata.userData')}>
            <textarea className="code-textarea" rows={16} value={userData} onChange={(event) => setUserData(event.target.value)} spellCheck={false} />
            {error ? <InfoNote icon="warning" tone="error">{error}</InfoNote> : <InfoNote icon="info">{t('dialog.metadata.subtitle')}</InfoNote>}
          </DialogSection>
        ) : null}
      </div>
    </Modal>
  );
}

function cloneJson(value) {
  try { return JSON.parse(JSON.stringify(value)); } catch { return []; }
}

function normalizeColor(value) {
  const match = String(value || '#7c6cf5').match(/^#([0-9a-f]{6})/i);
  return match ? `#${match[1]}` : '#7c6cf5';
}
