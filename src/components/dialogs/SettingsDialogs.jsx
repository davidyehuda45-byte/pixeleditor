import React, { useEffect, useMemo, useState } from 'react';
import { useI18n, useStore } from '../../ui/hooks.jsx';
import { Modal, DialogSection, InfoNote, FormGrid, DialogTabs } from './Modal.jsx';
import {
  Button, Field, Select, NumberInput, Toggle, Segmented, IconButton, EmptyState,
} from '../../ui/controls.jsx';
import { Icon } from '../Icon.jsx';
import { LANGUAGES } from '../../i18n.js';
import { clearAutosaves } from '../../io/autosave.js';
import { supportsFileSystemAccess } from '../../io/file.js';
import { renameDocument } from '../../ui/actions.js';
import {
  SHORTCUT_ACTIONS, SHORTCUT_CATEGORY, shortcutFor, setShortcut, resetShortcut,
  resetShortcuts, findConflict, formatShortcut, eventCombo, isCustomShortcut, normalizeCombo,
} from '../../ui/shortcuts.js';

export function SettingsDialog({ onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const [tab, setTab] = useState('appearance');
  const [draft, setDraft] = useState(() => ({
    theme: store.ui.theme || 'dark',
    language: store.ui.language || 'id',
    autoSave: !!store.ui.autoSave,
    autoSaveInterval: store.ui.autoSaveInterval || 30,
    showGrid: !!store.ui.showGrid,
    gridOverlayColor: store.ui.gridOverlayColor || '#ffffff22',
    checkerSize: store.ui.checkerSize || 8,
    checkerColorA: store.ui.checkerColorA || '#20222c',
    checkerColorB: store.ui.checkerColorB || '#2a2d3a',
    showPixelGrid: store.ui.showPixelGrid !== false,
    showMinimap: !!store.ui.showMinimap,
    historyLimitMB: Math.round((store.activeSession?.history?.limitBytes || 200 * 1024 * 1024) / (1024 * 1024)),
  }));
  const set = (patch) => setDraft((value) => ({ ...value, ...patch }));

  const save = () => {
    store.setUI({
      theme: draft.theme,
      language: draft.language,
      autoSave: draft.autoSave,
      autoSaveInterval: Math.max(5, Math.min(3600, Number(draft.autoSaveInterval) || 30)),
      showGrid: draft.showGrid,
      gridOverlayColor: draft.gridOverlayColor,
      checkerSize: Math.max(1, Math.min(64, Number(draft.checkerSize) || 8)),
      checkerColorA: draft.checkerColorA,
      checkerColorB: draft.checkerColorB,
      showPixelGrid: draft.showPixelGrid,
      showMinimap: draft.showMinimap,
      historyLimitMB: Math.max(1, Math.min(4096, Number(draft.historyLimitMB) || 200)),
    });
    const limit = Math.max(1, Math.min(4096, Number(draft.historyLimitMB) || 200)) * 1024 * 1024;
    for (const session of store.sessions) {
      if (session.history) {
        session.history.limitBytes = limit;
        session.history.trim?.();
      }
    }
    store.emit('preferences:change');
    store.toast(t('dialog.settings.saved'), 'success');
    onClose();
  };

  const clearAll = () => {
    store.askConfirm({
      title: t('dialog.settings.clearAutosaves'),
      message: t('dialog.settings.clearAutosavesHint'),
      confirmLabel: t('dialog.settings.clearAutosaves'),
      danger: true,
      onConfirm: async () => {
        await clearAutosaves();
        store.toast(t('dialog.settings.autosavesCleared'), 'success');
      },
    });
  };

  const resetPrefs = () => {
    store.askConfirm({
      title: t('dialog.settings.resetPrefs'),
      message: t('dialog.settings.historyHint'),
      danger: true,
      onConfirm: () => {
        try { localStorage.removeItem('pixelforge:prefs:v1'); } catch { /* ignore */ }
        window.location.reload();
      },
    });
  };

  const tabs = [
    { value: 'appearance', label: t('dialog.settings.appearance'), icon: 'sun' },
    { value: 'editor', label: t('dialog.settings.editor'), icon: 'pencil' },
    { value: 'performance', label: t('dialog.settings.performance'), icon: 'sparkles' },
    { value: 'storage', label: t('dialog.settings.storage'), icon: 'save' },
    ...(store.doc ? [{ value: 'document', label: t('dialog.settings.document'), icon: 'image' }] : []),
  ];

  return (
    <Modal
      title={t('dialog.settings.title')}
      icon="settings"
      onClose={onClose}
      size="lg"
      footer={(
        <>
          <span className="modal-footer-note"><Icon name="lock" size={12} /> {t('dialog.settings.localOnly')}</span>
          <span className="modal-footer-spacer" />
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" icon="save" onClick={save}>{t('dialog.settings.save')}</Button>
        </>
      )}
    >
      <div className="settings-layout">
        <nav className="settings-nav">
          {tabs.map((item) => (
            <button key={item.value} type="button" className={tab === item.value ? 'is-active' : ''} onClick={() => setTab(item.value)}>
              <Icon name={item.icon} size={15} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="settings-content">
          {tab === 'appearance' ? (
            <>
              <DialogSection title={t('dialog.settings.theme')}>
                <Segmented
                  value={draft.theme}
                  onChange={(value) => set({ theme: value })}
                  options={[
                    { value: 'dark', icon: 'moon', label: t('dialog.settings.themeDark') },
                    { value: 'light', icon: 'sun', label: t('dialog.settings.themeLight') },
                    { value: 'contrast', icon: 'contrast', label: t('dialog.settings.themeContrast') },
                  ]}
                />
              </DialogSection>
              <FormGrid>
                <Field label={t('dialog.settings.language')} hint={t('dialog.settings.languageHint')}>
                  <Select
                    value={draft.language}
                    onChange={(value) => set({ language: value })}
                    options={LANGUAGES.map((language) => ({ value: language.id, label: language.label }))}
                  />
                </Field>
                <Field label={t('dialog.settings.checkerSize')}>
                  <NumberInput value={draft.checkerSize} min={1} max={64} onChange={(value) => set({ checkerSize: value })} />
                </Field>
                <Field label={t('dialog.settings.checkerA')}>
                  <input type="color" className="color-input" value={draft.checkerColorA} onChange={(event) => set({ checkerColorA: event.target.value })} />
                </Field>
                <Field label={t('dialog.settings.checkerB')}>
                  <input type="color" className="color-input" value={draft.checkerColorB} onChange={(event) => set({ checkerColorB: event.target.value })} />
                </Field>
              </FormGrid>
              <div className="toggle-grid">
                <Toggle checked={draft.showPixelGrid} onChange={(value) => set({ showPixelGrid: value })} label={t('viewport.pixelGrid')} />
                <Toggle checked={draft.showMinimap} onChange={(value) => set({ showMinimap: value })} label={t('viewport.minimap')} />
              </div>
            </>
          ) : null}

          {tab === 'editor' ? (
            <>
              <DialogSection title={t('dialog.settings.grid')}>
                <Toggle checked={draft.showGrid} onChange={(value) => set({ showGrid: value })} label={t('dialog.settings.showGrid')} />
                <Field label={t('dialog.settings.gridColor')}>
                  <div className="color-with-alpha">
                    <input type="color" value={normalizeHex(draft.gridOverlayColor)} onChange={(event) => set({ gridOverlayColor: event.target.value })} />
                    <input className="text-input mono" value={draft.gridOverlayColor} onChange={(event) => set({ gridOverlayColor: event.target.value })} />
                  </div>
                </Field>
              </DialogSection>
              <DialogSection title={t('dialog.settings.autosave')}>
                <Toggle checked={draft.autoSave} onChange={(value) => set({ autoSave: value })} label={t('dialog.settings.autosave')} hint={t('dialog.settings.autosaveHint')} />
                <Field label={t('dialog.settings.interval')}>
                  <NumberInput value={draft.autoSaveInterval} min={5} max={3600} onChange={(value) => set({ autoSaveInterval: value })} />
                </Field>
              </DialogSection>
              <DialogSection title={t('dialog.settings.shortcuts')}>
                <div className="settings-action-row">
                  <span>{t('dialog.shortcuts.hint')}</span>
                  <Button variant="ghost" icon="keyboard" onClick={() => store.setDialog({ type: 'shortcuts' })}>{t('dialog.settings.shortcuts')}</Button>
                </div>
              </DialogSection>
            </>
          ) : null}

          {tab === 'performance' ? (
            <>
              <DialogSection title={t('dialog.settings.performance')}>
                <Field label={t('dialog.settings.historyLimit')} hint={t('dialog.settings.historyHint')}>
                  <NumberInput value={draft.historyLimitMB} min={1} max={4096} onChange={(value) => set({ historyLimitMB: value })} />
                </Field>
                <InfoNote icon="info">{t('dialog.settings.historyHint')}</InfoNote>
              </DialogSection>
              <DialogSection title={t('settings.render')}>
                <InfoNote icon="sparkles" tone="info">{t('settings.renderHint')}</InfoNote>
              </DialogSection>
            </>
          ) : null}

          {tab === 'storage' ? (
            <>
              <DialogSection title={t('dialog.settings.storage')}>
                <p className="muted">{t('dialog.settings.localOnly')}</p>
                {!supportsFileSystemAccess() ? <InfoNote icon="warning" tone="warn">{t('dialog.settings.unsupportedFsa')}</InfoNote> : null}
                <div className="settings-action-row">
                  <span>{t('dialog.settings.clearAutosavesHint')}</span>
                  <Button variant="danger" icon="trash" onClick={clearAll}>{t('dialog.settings.clearAutosaves')}</Button>
                </div>
                <div className="settings-action-row">
                  <span>{t('dialog.settings.resetPrefs')}</span>
                  <Button variant="ghost" icon="refresh" onClick={resetPrefs}>{t('dialog.settings.resetPrefs')}</Button>
                </div>
              </DialogSection>
            </>
          ) : null}

          {tab === 'document' && store.doc ? (
            <>
              <DialogSection title={t('dialog.metadata.title')}>
                <FormGrid>
                  <Field label={t('dialog.metadata.name')}>
                    <input
                      className="text-input"
                      defaultValue={store.doc.title}
                      onBlur={(event) => {
                        const value = event.target.value.trim();
                        if (value && value !== store.doc.title) {
                          renameDocument(store, value);
                        }
                      }}
                    />
                  </Field>
                  <Field label={t('dialog.new.width')}>
                    <input className="text-input" value={store.doc.width} readOnly />
                  </Field>
                  <Field label={t('dialog.new.height')}>
                    <input className="text-input" value={store.doc.height} readOnly />
                  </Field>
                </FormGrid>
              </DialogSection>
            </>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

function normalizeHex(value) {
  const text = String(value || '#ffffff');
  const match = text.match(/^#([0-9a-f]{6})/i);
  return match ? `#${match[1]}` : '#ffffff';
}

export function ShortcutsDialog({ onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [capturing, setCapturing] = useState(null);

  const groups = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const list = SHORTCUT_ACTIONS.filter((action) => {
      if (!normalized) return true;
      const label = t(action.labelKey).toLowerCase();
      return label.includes(normalized) || action.id.toLowerCase().includes(normalized);
    });
    const result = [];
    for (const [category, categoryKey] of Object.entries(SHORTCUT_CATEGORY)) {
      const actions = list.filter((action) => action.category === category);
      if (actions.length) result.push({ category, title: t(categoryKey), actions });
    }
    return result;
  }, [query, t, store.revision]);

  useEffect(() => {
    if (!capturing) return undefined;
    const onKey = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === 'Escape') {
        setCapturing(null);
        return;
      }
      if (event.key === 'Backspace' || event.key === 'Delete') {
        setShortcut(store, capturing, '');
        setCapturing(null);
        return;
      }
      const combo = eventCombo(event);
      if (!combo) return;
      const normalized = normalizeCombo(combo);
      if (!normalized) return;
      const conflict = findConflict(store, capturing, normalized);
      if (conflict) {
        store.toast(t('dialog.shortcuts.conflict', { action: t(conflict.labelKey) }), 'warn', 3500);
        return;
      }
      setShortcut(store, capturing, normalized);
      setCapturing(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [capturing, store, t]);

  const resetAll = () => {
    resetShortcuts(store);
    store.toast(t('dialog.shortcuts.reset'), 'info', 1600);
  };

  return (
    <Modal
      title={t('dialog.shortcuts.title')}
      icon="keyboard"
      onClose={onClose}
      size="lg"
      className="shortcuts-modal"
      headerExtra={(
        <div className="shortcut-search">
          <Icon name="search" size={14} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('dialog.shortcuts.search')} />
        </div>
      )}
      footer={(
        <>
          <span className="modal-footer-note">{t('dialog.shortcuts.hint')}</span>
          <span className="modal-footer-spacer" />
          <Button variant="ghost" icon="refresh" onClick={resetAll}>{t('dialog.shortcuts.reset')}</Button>
          <Button variant="primary" onClick={onClose}>{t('common.close')}</Button>
        </>
      )}
    >
      <div className="shortcut-list">
        {groups.length === 0 ? <EmptyState icon="search" title={t('command.noResults')} /> : null}
        {groups.map((group) => (
          <section key={group.category} className="shortcut-group">
            <h3>{group.title}</h3>
            {group.actions.map((action) => {
              const combo = shortcutFor(store, action.id);
              const isCapturing = capturing === action.id;
              return (
                <div key={action.id} className={`shortcut-row ${isCapturing ? 'is-capturing' : ''}`}>
                  <span className="shortcut-name">{t(action.labelKey)}</span>
                  {isCustomShortcut(store, action.id) ? <em className="badge">{t('dialog.shortcuts.custom')}</em> : null}
                  <button
                    type="button"
                    className={`shortcut-key ${isCapturing ? 'capturing' : ''}`}
                    onClick={() => setCapturing(isCapturing ? null : action.id)}
                  >
                    {isCapturing ? t('dialog.shortcuts.press') : (combo ? formatShortcut(combo) : '—')}
                  </button>
                  {isCustomShortcut(store, action.id) ? (
                    <IconButton
                      icon="refresh"
                      label={t('dialog.shortcuts.resetOne')}
                      onClick={() => resetShortcut(store, action.id)}
                    />
                  ) : <span className="shortcut-spacer" />}
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </Modal>
  );
}
