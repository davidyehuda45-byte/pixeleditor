import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n, useStore } from '../../ui/hooks.jsx';
import { Modal, DialogSection, InfoNote, FormGrid } from './Modal.jsx';
import { Button, Field, Select, NumberInput, Toggle, Segmented, EmptyState, Spinner } from '../../ui/controls.jsx';
import { Icon } from '../Icon.jsx';
import {
  newDocument, openProjectPicked, importPickedFiles, restoreAutosave, discardAutosave,
  closeSessionNow, saveProject,
} from '../../ui/actions.js';
import { parseProject } from '../../io/project.js';
import { listAutosaves, deleteAutosave } from '../../io/autosave.js';
import { pickFiles, downloadSingle, downloadFiles } from '../../io/file.js';
import { EXAMPLES, loadExample, buildExample } from '../../examples.js';
import { renderComposite } from '../../core/compositor.js';
import { exportDocument, zipExportedFiles } from '../../io/export.js';

function formatWhen(timestamp, lang) {
  if (!timestamp) return '';
  try {
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', {
      dateStyle: 'medium', timeStyle: 'short',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleString();
  }
}

const NEW_PRESETS = [
  { id: 'icon', w: 16, h: 16 },
  { id: 'sprite', w: 32, h: 32 },
  { id: 'character', w: 32, h: 48 },
  { id: 'tile', w: 16, h: 16 },
  { id: 'ui', w: 48, h: 48 },
  { id: 'card', w: 64, h: 96 },
  { id: 'font', w: 8, h: 8 },
];

function MiniChecker({ width = 64, height = 64, color = '#7c6cf5' }) {
  const cells = [];
  const n = 4;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    cells.push(<span key={`${x}-${y}`} className={(x + y) % 2 ? 'b' : 'a'} />);
  }
  return (
    <div className="mini-doc-preview" style={{ aspectRatio: `${width} / ${height}` }}>
      {cells}
      <span className="mini-doc-art" style={{ background: color }} />
    </div>
  );
}

export function NewDialog({ onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const [preset, setPreset] = useState('sprite');
  const [width, setWidth] = useState(32);
  const [height, setHeight] = useState(32);
  const [title, setTitle] = useState('');
  const [background, setBackground] = useState('transparent');
  const [grid, setGrid] = useState(8);
  const [error, setError] = useState('');

  const choosePreset = (next) => {
    setPreset(next);
    const match = NEW_PRESETS.find((item) => item.id === next);
    if (match) { setWidth(match.w); setHeight(match.h); }
  };

  const create = () => {
    const w = Math.round(Number(width));
    const h = Math.round(Number(height));
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1 || w > 1024 || h > 1024) {
      setError(t('dialog.new.invalid'));
      return;
    }
    newDocument(store, {
      width: w,
      height: h,
      title: title.trim() || t('common.untitled'),
      background: background === 'solid' ? store.ui.primary : null,
      grid: grid ? { x: 0, y: 0, w: Number(grid), h: Number(grid) } : null,
    });
    onClose();
  };

  return (
    <Modal
      title={t('dialog.new.title')}
      subtitle={t('dialog.new.subtitle')}
      icon="file-plus"
      onClose={onClose}
      size="lg"
      footer={(
        <>
          <span className="modal-footer-note">{t('dialog.new.description')}</span>
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" icon="file-plus" onClick={create}>{t('dialog.new.create')}</Button>
        </>
      )}
    >
      <div className="new-doc-layout">
        <div className="new-doc-form">
          <DialogSection title={t('dialog.new.preset')}>
            <div className="preset-grid">
              {NEW_PRESETS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`preset-card ${preset === item.id ? 'is-active' : ''}`}
                  onClick={() => choosePreset(item.id)}
                >
                  <MiniChecker width={item.w} height={item.h} color={item.id === 'font' ? '#7c6cf5' : '#e4c36b'} />
                  <span>{t(`dialog.new.presets.${item.id}`)}</span>
                  <em>{item.w}×{item.h}</em>
                </button>
              ))}
              <button
                type="button"
                className={`preset-card preset-custom ${preset === 'custom' ? 'is-active' : ''}`}
                onClick={() => setPreset('custom')}
              >
                <span className="preset-plus">+</span>
                <span>{t('dialog.new.custom')}</span>
                <em>{t('common.custom')}</em>
              </button>
            </div>
          </DialogSection>
          <FormGrid>
            <Field label={t('dialog.new.width')}>
              <NumberInput value={width} min={1} max={1024} onChange={(value) => { setWidth(value); setPreset('custom'); }} />
            </Field>
            <Field label={t('dialog.new.height')}>
              <NumberInput value={height} min={1} max={1024} onChange={(value) => { setHeight(value); setPreset('custom'); }} />
            </Field>
            <Field label={t('dialog.new.titleField')} className="span-2">
              <input className="text-input" value={title} placeholder={t('common.untitled')} onChange={(event) => setTitle(event.target.value)} maxLength={80} />
            </Field>
            <Field label={t('dialog.new.background')}>
              <Segmented
                value={background}
                onChange={setBackground}
                options={[
                  { value: 'transparent', label: t('dialog.new.transparent') },
                  { value: 'solid', label: t('dialog.new.color') },
                ]}
              />
            </Field>
            <Field label={t('dialog.new.grid')} hint={t('dialog.new.max')}>
              <Select
                value={String(grid)}
                onChange={(value) => setGrid(Number(value))}
                options={[
                  { value: '0', label: t('common.off') },
                  { value: '1', label: '1×1' },
                  { value: '2', label: '2×2' },
                  { value: '4', label: '4×4' },
                  { value: '8', label: '8×8' },
                  { value: '16', label: '16×16' },
                ]}
              />
            </Field>
          </FormGrid>
          {error ? <InfoNote tone="error" icon="warning">{error}</InfoNote> : null}
        </div>
        <aside className="new-doc-aside">
          <div className="new-doc-preview-wrap">
            <MiniChecker width={width} height={height} color={background === 'solid' ? store.ui.primary : '#e4c36b'} />
          </div>
          <div className="new-doc-stats">
            <span><strong>{width} × {height}</strong> px</span>
            <span>{Math.max(1, Math.round(width * height / 1024))}K piksel</span>
            <span>{background === 'solid' ? t('dialog.new.color') : t('dialog.new.transparent')}</span>
          </div>
        </aside>
      </div>
    </Modal>
  );
}

export function OpenDialog({ onClose }) {
  const store = useStore();
  const { t, lang } = useI18n();
  const [records, setRecords] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    listAutosaves().then((next) => setRecords(next || [])).finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const browse = async () => {
    setBusy(true);
    try {
      const files = await pickFiles(['pfx', 'image', 'palette'], { multiple: true });
      if (files?.length) {
        await importPickedFiles(store, files);
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  const restore = async (record) => {
    setBusy(true);
    try {
      const session = await restoreAutosave(store, record);
      if (session) {
        await deleteAutosave(record.id);
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (record) => {
    await deleteAutosave(record.id);
    setRecords((list) => list.filter((item) => item.id !== record.id));
  };

  const openNew = () => store.setDialog({ type: 'new' });

  return (
    <Modal
      title={t('dialog.open.title')}
      subtitle={t('dialog.open.local')}
      icon="folder-open"
      onClose={onClose}
      size="lg"
      footer={(
        <>
          <Button variant="ghost" icon="file-plus" onClick={openNew}>{t('dialog.open.newDoc')}</Button>
          <span className="modal-footer-spacer" />
          <Button variant="ghost" onClick={onClose}>{t('common.close')}</Button>
          <Button variant="primary" icon="upload" onClick={browse} disabled={busy}>{t('dialog.open.browse')}</Button>
        </>
      )}
    >
      <button type="button" className="file-dropzone" onClick={browse} disabled={busy}>
        {busy ? <Spinner /> : <Icon name="upload" size={26} />}
        <strong>{t('dialog.open.drop')}</strong>
        <span>{t('dialog.import.supported')}</span>
        <span className="file-dropzone-cta">{t('dialog.open.browse')}</span>
      </button>

      <DialogSection title={t('dialog.open.recent')}>
        {loading ? (
          <div className="inline-loading"><Spinner /> <span>{t('common.loading')}</span></div>
        ) : records.length === 0 ? (
          <EmptyState icon="folder-open" title={t('dialog.open.noRecent')} />
        ) : (
          <div className="recent-list">
            {records.map((record) => (
              <div key={record.id} className="recent-row">
                <span className={`recent-thumb ${record.dirty ? 'is-dirty' : ''}`}>
                  <Icon name={record.dirty ? 'file' : 'save'} size={17} />
                </span>
                <div className="recent-copy">
                  <strong>{record.title || t('common.untitled')}</strong>
                  <span>
                    {record.width}×{record.height} · {record.frames} {t('frames.short')} · {record.layers} {t('layers.short')}
                    {record.dirty ? ` · ${t('dialog.open.autosave')}` : ''}
                  </span>
                </div>
                <time>{formatWhen(record.updatedAt, lang)}</time>
                {record.dirty ? <span className="badge badge-warn">{t('dialog.open.autosave')}</span> : null}
                <div className="recent-actions">
                  <Button size="sm" variant="ghost" onClick={() => restore(record)} disabled={busy}>{t('dialog.open.restore')}</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(record)} disabled={busy} title={t('dialog.open.discard')}>
                    <Icon name="trash" size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogSection>
    </Modal>
  );
}

export function RecoveryDialog({ records = [], onClose }) {
  const store = useStore();
  const { t, lang } = useI18n();
  const [selected, setSelected] = useState(records[0]?.id || null);
  const [busy, setBusy] = useState(false);
  const record = records.find((item) => item.id === selected) || records[0];

  const restore = async () => {
    if (!record) return;
    setBusy(true);
    try {
      const session = await restoreAutosave(store, record);
      if (session) {
        await deleteAutosave(record.id);
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  const discard = async () => {
    if (!record) return;
    await discardAutosave(store, record);
    const next = records.filter((item) => item.id !== record.id);
    if (next.length) {
      setSelected(next[0].id);
      store.setDialog({ type: 'recovery', records: next });
    } else {
      onClose();
    }
  };

  return (
    <Modal
      title={t('dialog.open.recovery')}
      subtitle={t('dialog.open.recoveryDescription')}
      icon="history"
      onClose={onClose}
      size="md"
      busy={busy}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>{t('common.later')}</Button>
          <span className="modal-footer-spacer" />
          <Button variant="ghost" onClick={discard} disabled={busy}>{t('dialog.open.discard')}</Button>
          <Button variant="primary" icon="undo" onClick={restore} disabled={busy || !record}>{t('dialog.open.restore')}</Button>
        </>
      )}
    >
      <div className="recovery-list">
        {records.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`recovery-item ${item.id === selected ? 'is-active' : ''}`}
            onClick={() => setSelected(item.id)}
          >
            <span className="recovery-icon"><Icon name="file" size={18} /></span>
            <span className="recovery-copy">
              <strong>{item.title || item.fileName || t('common.untitled')}</strong>
              <span>{item.width}×{item.height} · {item.frames} {t('frames.short')} · {item.layers} {t('layers.short')}</span>
            </span>
            <time>{formatWhen(item.updatedAt, lang)}</time>
          </button>
        ))}
      </div>
      {record ? (
        <InfoNote icon="warning" tone="warn">
          {t('dialog.open.recoveryDescription')} {formatWhen(record.updatedAt, lang)}
        </InfoNote>
      ) : null}
    </Modal>
  );
}

export function ExportDialog({ onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const doc = store.doc;
  const controllerRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [opts, setOpts] = useState({
    format: 'sheet',
    scope: 'all',
    rangeFrom: 0,
    rangeTo: Math.max(0, (doc?.frames.length || 1) - 1),
    tagName: doc?.tags?.[0]?.name || '',
    scale: 1,
    padding: 0,
    extrude: 0,
    trim: false,
    dedupe: false,
    powerOfTwo: false,
    columns: 8,
    layout: 'horizontal',
    fileNameTemplate: '{title}_{frame:3}',
    includeHidden: false,
    includeReference: false,
    baseName: (doc?.title || 'sprite').replace(/\s+/g, '_'),
  });
  const set = (patch) => { setResult(null); setError(''); setOpts((value) => ({ ...value, ...patch })); };

  const scopeOptions = [
    { value: 'all', label: t('dialog.export.scopeAll') },
    { value: 'current', label: t('dialog.export.scopeCurrent') },
    { value: 'range', label: t('dialog.export.scopeRange') },
    ...(doc?.tags?.length ? [{ value: 'tag', label: t('dialog.export.scopeTag') }] : []),
    ...(doc?.selection && !doc.selection.empty ? [{ value: 'selection', label: t('dialog.export.scopeSelection') }] : []),
  ];

  const run = async () => {
    if (!doc) return;
    setBusy(true);
    setError('');
    setResult(null);
    setProgress(2);
    setProgressText(t('dialog.export.running'));
    controllerRef.current = new AbortController();
    try {
      const output = await exportDocument(doc, {
        ...opts,
        frameIndex: store.activeFrameIndex,
        range: { from: opts.rangeFrom, to: opts.rangeTo },
        signal: controllerRef.current.signal,
      }, {
        signal: controllerRef.current.signal,
        onProgress: (percent, message) => { setProgress(Math.max(2, percent)); setProgressText(message || ''); },
      });
      setResult(output);
      setProgress(100);
      store.toast(t('dialog.export.success', { n: output.files.length }), 'success');
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setError(t('dialog.export.failed', { message: err?.message || String(err) }));
      }
    } finally {
      setBusy(false);
      controllerRef.current = null;
    }
  };

  const downloadAll = () => {
    if (!result?.files?.length) return;
    if (result.files.length === 1) {
      downloadSingle(result.files[0]);
    } else {
      const zip = zipExportedFiles(result.files, `${opts.baseName || 'sprite'}_export.zip`);
      downloadSingle(zip);
    }
  };

  const previewData = useMemo(() => {
    if (!result?.sheet?.data) return null;
    return { data: result.sheet.data, width: result.sheet.width, height: result.sheet.height };
  }, [result]);

  return (
    <Modal
      title={t('dialog.export.title')}
      subtitle={t('dialog.export.subtitle')}
      icon="export"
      onClose={onClose}
      size="xl"
      busy={busy}
      className="export-modal"
      footer={(
        <>
          <span className="modal-footer-note">{t('dialog.export.notePfx')}</span>
          <span className="modal-footer-spacer" />
          <Button variant="ghost" onClick={onClose} disabled={busy}>{t('common.close')}</Button>
          {busy ? (
            <Button variant="danger" icon="close" onClick={() => controllerRef.current?.abort()}>{t('dialog.export.cancel')}</Button>
          ) : result ? (
            <Button variant="primary" icon="download" onClick={downloadAll}>
              {result.files.length > 1 ? t('dialog.export.downloadAll') : t('dialog.export.downloadFile')}
            </Button>
          ) : (
            <Button variant="primary" icon="export" onClick={run} disabled={!doc}>{t('dialog.export.start')}</Button>
          )}
        </>
      )}
    >
      <div className="export-layout">
        <div className="export-options">
          <DialogSection title={t('dialog.export.format')}>
            <div className="format-grid">
              {[
                ['png', 'image', t('dialog.export.formatPng')],
                ['sheet', 'grid', t('dialog.export.formatSheet')],
                ['gif', 'play', t('dialog.export.formatGif')],
                ['godot', 'box', t('dialog.export.formatGodot')],
                ['zip', 'file', t('dialog.export.formatZip')],
              ].map(([value, icon, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`format-card ${opts.format === value ? 'is-active' : ''}`}
                  onClick={() => set({ format: value })}
                >
                  <Icon name={icon} size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </DialogSection>

          <FormGrid>
            <Field label={t('dialog.export.scope')}>
              <Select value={opts.scope} onChange={(value) => set({ scope: value })} options={scopeOptions} />
            </Field>
            {opts.scope === 'tag' ? (
              <Field label={t('dialog.export.tag')}>
                <Select
                  value={opts.tagName}
                  onChange={(value) => set({ tagName: value })}
                  options={(doc?.tags || []).map((tag) => ({ value: tag.name, label: tag.name }))}
                />
              </Field>
            ) : null}
            {opts.scope === 'range' ? (
              <>
                <Field label={t('dialog.export.rangeFrom')}>
                  <NumberInput value={opts.rangeFrom} min={0} max={Math.max(0, doc.frames.length - 1)} onChange={(value) => set({ rangeFrom: value })} />
                </Field>
                <Field label={t('dialog.export.rangeTo')}>
                  <NumberInput value={opts.rangeTo} min={0} max={Math.max(0, doc.frames.length - 1)} onChange={(value) => set({ rangeTo: value })} />
                </Field>
              </>
            ) : null}
            <Field label={t('dialog.export.scale')} hint={t('dialog.export.noteScale')}>
              <NumberInput value={opts.scale} min={1} max={16} onChange={(value) => set({ scale: value })} />
            </Field>
            <Field label={t('dialog.export.nameTemplate')}>
              <input className="text-input mono" value={opts.baseName} onChange={(event) => set({ baseName: event.target.value })} />
            </Field>
            <Field label={t('dialog.export.columns')}>
              <NumberInput value={opts.columns} min={1} max={64} onChange={(value) => set({ columns: value })} />
            </Field>
            <Field label={t('dialog.export.layout')}>
              <Select
                value={opts.layout}
                onChange={(value) => set({ layout: value })}
                options={[
                  { value: 'horizontal', label: t('dialog.export.layoutHorizontal') },
                  { value: 'vertical', label: t('dialog.export.layoutVertical') },
                  { value: 'grid', label: t('dialog.export.layoutGrid') },
                ]}
              />
            </Field>
            <Field label={t('dialog.export.padding')}>
              <NumberInput value={opts.padding} min={0} max={16} onChange={(value) => set({ padding: value })} />
            </Field>
            <Field label={t('dialog.export.extrude')}>
              <NumberInput value={opts.extrude} min={0} max={4} onChange={(value) => set({ extrude: value })} />
            </Field>
            <Field label={t('dialog.export.nameTemplate')} className="span-2" hint="{title} {frame:3} {tag}">
              <input className="text-input mono" value={opts.fileNameTemplate} onChange={(event) => set({ fileNameTemplate: event.target.value })} />
            </Field>
          </FormGrid>

          <div className="toggle-grid">
            <Toggle checked={opts.trim} onChange={(value) => set({ trim: value })} label={t('dialog.export.trim')} />
            <Toggle checked={opts.dedupe} onChange={(value) => set({ dedupe: value })} label={t('dialog.export.dedupe')} />
            <Toggle checked={opts.powerOfTwo} onChange={(value) => set({ powerOfTwo: value })} label={t('dialog.export.powerOfTwo')} />
            <Toggle checked={opts.includeHidden} onChange={(value) => set({ includeHidden: value })} label={t('dialog.export.includeHidden')} />
            <Toggle checked={opts.includeReference} onChange={(value) => set({ includeReference: value })} label={t('dialog.export.includeReference')} />
          </div>

          {error ? <InfoNote tone="error" icon="warning">{error}</InfoNote> : null}
        </div>

        <aside className="export-preview-pane">
          <DialogSection title={t('dialog.export.sheetPreview')}>
            {previewData ? (
              <SheetPreview data={previewData.data} width={previewData.width} height={previewData.height} />
            ) : (
              <div className="export-preview-empty">
                <Icon name="image" size={28} />
                <span>{t('dialog.export.previewHint')}</span>
              </div>
            )}
          </DialogSection>
          <div className="export-progress">
            <div className="progress-label">
              <span>{busy ? progressText : result ? t('dialog.export.filesReady', { n: result.files.length }) : t('dialog.export.estimate')}</span>
              <strong>{busy || result ? `${progress}%` : '—'}</strong>
            </div>
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
            {result ? (
              <>
                <div className="export-dimensions">{t('dialog.export.dimensions', { w: result.width, h: result.height })}</div>
                <div className="export-files">
                  {result.files.map((file) => (
                    <div key={file.name} className="export-file">
                      <Icon name="file" size={14} />
                      <span title={file.name}>{file.name}</span>
                      <em>{file.data?.length ? `${Math.max(1, Math.round(file.data.length / 1024))} KB` : ''}</em>
                      <Button size="sm" variant="ghost" icon="download" onClick={() => downloadSingle(file)} title={t('dialog.export.downloadFile')} />
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </aside>
      </div>
    </Modal>
  );
}

function SheetPreview({ data, width, height }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const image = ctx.createImageData(width, height);
    image.data.set(data);
    ctx.putImageData(image, 0, 0);
  }, [data, width, height]);
  return <canvas ref={ref} className="sheet-preview-canvas" />;
}

export function WelcomeDialog({ onClose }) {
  const store = useStore();
  const { t } = useI18n();

  const load = (id) => {
    const previous = store.activeSession;
    loadExample(store, id);
    if (previous && !previous.dirty && previous.doc?.title === 'hero' && previous.doc?.frames.length === 1 && store.sessions.length > 1) {
      store.closeSession(previous.id);
    }
    onClose();
  };

  const open = () => store.setDialog({ type: 'open' });

  return (
    <Modal
      title={t('welcome.title')}
      subtitle={t('welcome.body')}
      icon="onboarding"
      onClose={onClose}
      size="xl"
      className="welcome-modal"
      footer={(
        <>
          <span className="welcome-local"><Icon name="lock" size={13} /> {t('welcome.local')}</span>
          <span className="modal-footer-spacer" />
          <Button variant="ghost" icon="folder-open" onClick={open}>{t('welcome.open')}</Button>
          <Button variant="primary" icon="pencil" onClick={onClose}>{t('welcome.start')}</Button>
        </>
      )}
    >
      <div className="welcome-hero">
        <div className="welcome-art" aria-hidden="true">
          <span className="wa wa-1" /><span className="wa wa-2" /><span className="wa wa-3" />
          <span className="wa wa-4" /><span className="wa wa-5" /><span className="wa wa-6" />
        </div>
        <div className="welcome-tips">
          <div><kbd>Scroll</kbd><span>{t('welcome.tip1')}</span></div>
          <div><kbd>Ctrl K</kbd><span>{t('welcome.tip2')}</span></div>
          <div><kbd>Ctrl S</kbd><span>{t('welcome.tip3')}</span></div>
        </div>
      </div>
      <DialogSection title={t('welcome.example')}>
        <div className="example-grid">
          {EXAMPLES.map((example) => (
            <button key={example.id} type="button" className="example-card" onClick={() => load(example.id)}>
              <ExampleThumb id={example.id} />
              <span className="example-copy">
                <strong>{t(example.titleKey)}</strong>
                <span>{t(example.descKey)}</span>
              </span>
              <span className="example-open"><Icon name="arrow-right" size={14} /></span>
            </button>
          ))}
        </div>
      </DialogSection>
    </Modal>
  );
}

function ExampleThumb({ id }) {
  const ref = useRef(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const doc = buildExample(id);
        if (!doc || cancelled) return;
        const frame = doc.frames[0];
        const composite = renderComposite(doc, frame.id);
        const canvas = ref.current;
        if (!canvas) return;
        const temp = document.createElement('canvas');
        temp.width = composite.width;
        temp.height = composite.height;
        const tctx = temp.getContext('2d');
        const image = tctx.createImageData(composite.width, composite.height);
        image.data.set(composite.data);
        tctx.putImageData(image, 0, 0);
        canvas.width = 72;
        canvas.height = 72;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        const scale = Math.max(1, Math.floor(Math.min(72 / composite.width, 72 / composite.height)));
        const dw = composite.width * scale, dh = composite.height * scale;
        ctx.clearRect(0, 0, 72, 72);
        ctx.drawImage(temp, Math.floor((72 - dw) / 2), Math.floor((72 - dh) / 2), dw, dh);
      } catch {
        // A broken example should never prevent the welcome screen from showing.
      }
    })();
    return () => { cancelled = true; };
  }, [id]);
  return <canvas ref={ref} className="example-thumb" />;
}

export function AboutDialog({ onClose }) {
  const { t } = useI18n();
  return (
    <Modal
      title={t('dialog.about.title')}
      subtitle={t('dialog.about.version')}
      icon="info"
      onClose={onClose}
      size="md"
      footer={<Button variant="primary" onClick={onClose}>{t('common.close')}</Button>}
    >
      <div className="about-hero">
        <div className="about-logo"><Icon name="pencil" size={30} /></div>
        <div>
          <h3>PixelForge</h3>
          <p>{t('dialog.about.body')}</p>
        </div>
      </div>
      <div className="about-grid">
        <InfoNote icon="lock" tone="success">{t('dialog.about.privacy')}</InfoNote>
        <InfoNote icon="info" tone="info">{t('dialog.about.credits')}</InfoNote>
        <InfoNote icon="download" tone="info">{t('dialog.about.offline')}</InfoNote>
      </div>
      <dl className="about-meta">
        <div><dt>{t('dialog.about.build')}</dt><dd>React 19 · Vite 6 · ES modules</dd></div>
        <div><dt>{t('dialog.about.license')}</dt><dd>MIT</dd></div>
        <div><dt>{t('common.offline')}</dt><dd>{t('dialog.about.checkUpdates')}</dd></div>
        <div><dt>{t('dialog.about.test')}</dt><dd><code>npm test</code></dd></div>
      </dl>
    </Modal>
  );
}

export function UnsavedDialog({ sessionId, title, onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const session = store.sessions.find((item) => item.id === sessionId);

  const save = async () => {
    if (!session) return;
    setBusy(true);
    const index = store.sessions.indexOf(session);
    if (index >= 0) store.setActiveSession(index);
    const result = await saveProject(store);
    setBusy(false);
    if (result && !result.cancelled) {
      closeSessionNow(store, session.id);
      onClose();
    }
  };

  const discard = () => {
    if (session) closeSessionNow(store, session.id);
    onClose();
  };

  return (
    <Modal
      title={t('unsaved.title')}
      subtitle={t('unsaved.body', { title: title || session?.doc?.title || '' })}
      icon="warning"
      onClose={onClose}
      size="sm"
      busy={busy}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>{t('common.cancel')}</Button>
          <span className="modal-footer-spacer" />
          <Button variant="danger" onClick={discard} disabled={busy}>{t('unsaved.discard')}</Button>
          <Button variant="primary" icon="save" onClick={save} disabled={busy || !session}>{t('unsaved.save')}</Button>
        </>
      )}
    >
      <InfoNote icon="warning" tone="warn">{t('unsaved.hint')}</InfoNote>
    </Modal>
  );
}

export function ImportDialog({ onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('document');
  const [sheet, setSheet] = useState(false);
  const [frameWidth, setFrameWidth] = useState(16);
  const [frameHeight, setFrameHeight] = useState(16);

  const choose = async () => {
    const picked = await pickFiles(['image', 'pfx', 'palette'], { multiple: true });
    if (picked?.length) setFiles(picked);
  };

  const run = async () => {
    if (!files.length) {
      store.toast(t('dialog.import.empty'), 'warn');
      return;
    }
    setBusy(true);
    try {
      if (files.length === 1 && sheet && ['.png', '.webp', '.jpg', '.jpeg'].includes(
        files[0].name.slice(files[0].name.lastIndexOf('.')).toLowerCase(),
      )) {
        const { importImagePicked } = await import('../../ui/actions.js');
        await importImagePicked(store, files[0], { mode: 'document', frameWidth, frameHeight });
      } else {
        await importPickedFiles(store, files);
      }
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={t('dialog.import.title')}
      subtitle={t('dialog.import.supported')}
      icon="upload"
      onClose={onClose}
      size="md"
      busy={busy}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>{t('common.cancel')}</Button>
          <span className="modal-footer-spacer" />
          <Button variant="primary" icon="upload" onClick={run} disabled={busy || !files.length}>{t('dialog.import.start')}</Button>
        </>
      )}
    >
      <button type="button" className={`file-dropzone compact ${files.length ? 'has-file' : ''}`} onClick={choose} disabled={busy}>
        <Icon name={files.length ? 'file' : 'image'} size={22} />
        <strong>{files.length ? files.map((file) => file.name).join(', ') : t('dialog.open.drop')}</strong>
        <span>{t('dialog.import.supported')}</span>
      </button>
      <FormGrid>
        <Field label={t('dialog.import.image')}>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: 'document', label: t('dialog.import.asNew') },
              { value: 'layer', label: t('dialog.import.asLayer') },
            ]}
          />
        </Field>
        <Field label={t('dialog.open.importAs')}>
          <Toggle checked={sheet} onChange={setSheet} label={t('dialog.open.importAs')} hint={t('dialog.import.asFrames')} />
        </Field>
        {sheet ? (
          <>
            <Field label={t('dialog.open.sheetFrameW')}>
              <NumberInput value={frameWidth} min={1} max={512} onChange={setFrameWidth} />
            </Field>
            <Field label={t('dialog.open.sheetFrameH')}>
              <NumberInput value={frameHeight} min={1} max={512} onChange={setFrameHeight} />
            </Field>
          </>
        ) : null}
      </FormGrid>
      <InfoNote icon="lock" tone="success">{t('dialog.about.privacy')}</InfoNote>
    </Modal>
  );
}
