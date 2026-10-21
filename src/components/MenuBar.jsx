import React, { useEffect, useRef, useState } from 'react';
import { useStore, useI18n, useStoreEvent } from '../ui/hooks.jsx';
import { Icon, LogoMark } from './Icon.jsx';
import { IconButton } from '../ui/controls.jsx';
import { formatShortcut } from '../ui/shortcuts.js';
import { LANGUAGES } from '../i18n.js';

const MENUS = [
  {
    id: 'file', labelKey: 'menu.file', items: [
      'file.new', 'file.newTemplate', 'file.open', '-', 'file.save', 'file.saveAs', 'file.saveCopy', '-',
      'file.importImage', 'file.importPalette', '-', 'file.export', '-', 'file.close', 'file.closeAll',
    ],
  },
  {
    id: 'edit', labelKey: 'menu.edit', items: [
      'edit.undo', 'edit.redo', '-', 'edit.cut', 'edit.copy', 'edit.paste', 'edit.pasteNew', 'edit.delete', '-',
      'edit.selectAlpha', 'edit.selectColor', '-', 'canvas.effects', 'canvas.adjust', '-', 'app.history',
    ],
  },
  {
    id: 'select', labelKey: 'menu.select', items: [
      'select.all', 'select.none', 'select.invert', 'select.grow', 'select.shrink', '-', 'canvas.cropSelection',
    ],
  },
  {
    id: 'layer', labelKey: 'menu.layer', items: [
      'layer.add', 'layer.group', 'layer.duplicate', 'layer.delete', '-', 'layer.merge', 'layer.flatten', 'layer.ungroup', '-',
      'layer.up', 'layer.down', 'layer.rename', 'layer.visible', 'layer.lock',
    ],
  },
  {
    id: 'frame', labelKey: 'menu.frame', items: [
      'frame.add', 'frame.duplicate', 'frame.link', 'frame.delete', '-', 'frame.prev', 'frame.next', 'frame.play', 'frame.onion',
      '-', 'frame.tags', 'frame.duration', 'frame.fps',
    ],
  },
  {
    id: 'canvas', labelKey: 'menu.canvas', items: [
      'canvas.resize', 'canvas.cropSelection', 'canvas.trim', '-', 'canvas.flipH', 'canvas.flipV', '-',
      'canvas.rotate90', 'canvas.rotate180', 'canvas.rotate270', '-', 'canvas.biome', 'canvas.effects', 'canvas.adjust', '-', 'canvas.grid', 'canvas.guides',
      'canvas.palette', 'canvas.metadata', 'canvas.rename', '-', 'canvas.minimap',
    ],
  },
  {
    id: 'view', labelKey: 'menu.view', items: [
      'view.zoomIn', 'view.zoomOut', 'view.fit', 'view.actual', 'view.center', '-',
      'view.grid', 'view.guides', 'view.onion', '-', 'view.timeline', 'view.rightPanel', 'view.preview', 'view.playtest', 'view.zen', '-',
      { type: 'themes' }, { type: 'languages' }, '-', 'view.fullscreen',
    ],
  },
  {
    id: 'help', labelKey: 'menu.help', items: [
      'app.welcome', 'app.shortcuts', 'app.commands', '-', 'app.settings', 'app.about',
    ],
  },
];

function cleanLabel(text) {
  return String(text || '').replace(/\s*\.$/, '');
}

export function MenuBar({ commands, commandMap, runCommand, viewport }) {
  const store = useStore();
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(null);
  const rootRef = useRef(null);
  const [zoom, setZoom] = useState(store.activeSession?.view?.zoom || 1);

  useEffect(() => {
    setZoom(store.activeSession?.view?.zoom || 1);
  }, [store.activeSession?.id, store.revision]);
  useStoreEvent('viewport:zoom', (event) => setZoom(event.zoom));

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(null);
    };
    const key = (event) => { if (event.key === 'Escape') setOpen(null); };
    document.addEventListener('pointerdown', close, true);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', close, true);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  const exec = (id) => {
    setOpen(null);
    runCommand(id);
  };

  const renderItem = (item) => {
    if (item === '-') return <div className="menu-separator" key={`sep-${Math.random()}`} role="separator" />;
    if (item.type === 'themes') {
      return (
        <div className="menu-section" key="themes">
          <div className="menu-section-title">{t('menu.theme')}</div>
          {['dark', 'light', 'contrast'].map((theme) => (
            <button
              type="button"
              key={theme}
              className={`menu-item ${store.ui.theme === theme ? 'is-checked' : ''}`}
              onClick={() => { store.setUI({ theme }); setOpen(null); }}
            >
              <span className="menu-check">{store.ui.theme === theme ? <Icon name="check" size={13} /> : null}</span>
              <span className="menu-item-label">{t(`theme.${theme}`)}</span>
              <Icon name={theme === 'light' ? 'sun' : theme === 'contrast' ? 'contrast' : 'moon'} size={13} />
            </button>
          ))}
        </div>
      );
    }
    if (item.type === 'languages') {
      return (
        <div className="menu-section" key="languages">
          <div className="menu-section-title">{t('menu.language')}</div>
          {LANGUAGES.map((language) => (
            <button
              type="button"
              key={language.id}
              className={`menu-item ${lang === language.id ? 'is-checked' : ''}`}
              onClick={() => { store.setUI({ language: language.id }); setOpen(null); }}
            >
              <span className="menu-check">{lang === language.id ? <Icon name="check" size={13} /> : null}</span>
              <span className="menu-item-label">{language.label}</span>
              <span className="menu-lang-code">{language.id.toUpperCase()}</span>
            </button>
          ))}
        </div>
      );
    }
    const command = commandMap.get(item);
    if (!command) return null;
    const enabled = command.enabled?.() !== false;
    const checked = command.checked?.();
    const shortcut = formatShortcut(command.shortcut);
    return (
      <button
        type="button"
        key={item}
        role="menuitem"
        className={`menu-item ${checked ? 'is-checked' : ''}`.trim()}
        disabled={!enabled}
        onClick={() => exec(item)}
      >
        <span className="menu-check">{checked ? <Icon name="check" size={13} /> : null}</span>
        <span className="menu-item-label">{cleanLabel(command.label)}</span>
        {shortcut !== '—' ? <span className="menu-shortcut">{shortcut}</span> : null}
      </button>
    );
  };

  const themeIcon = store.ui.theme === 'light' ? 'sun' : store.ui.theme === 'contrast' ? 'contrast' : 'moon';

  return (
    <header className="menubar" ref={rootRef}>
      <div className="brand" title={t('app.tagline')}>
        <LogoMark size={24} />
        <span className="brand-name">PixelForge</span>
        <span className="brand-badge">LOCAL</span>
      </div>
      <nav className="menus" aria-label="Main menu">
        {MENUS.map((menu) => (
          <div className="menu-root" key={menu.id}>
            <button
              type="button"
              className={`menu-trigger ${open === menu.id ? 'is-open' : ''}`}
              onClick={() => setOpen((current) => current === menu.id ? null : menu.id)}
              onPointerEnter={() => { if (open) setOpen(menu.id); }}
              aria-haspopup="menu"
              aria-expanded={open === menu.id}
            >
              {t(menu.labelKey)}
            </button>
            {open === menu.id ? (
              <div className="menu-dropdown" role="menu" aria-label={t(menu.labelKey)}>
                {menu.items.map(renderItem)}
              </div>
            ) : null}
          </div>
        ))}
      </nav>
      <div className="menubar-tail">
        <button
          type="button"
          className="btn btn-sm btn-ghost playtest-btn"
          onClick={() => store.setDialog({ type: 'playtest' })}
          title={t('playtest.title')}
          style={{ gap: 5, fontWeight: 600, color: '#58c896', background: 'rgba(88, 200, 150, 0.12)', border: '1px solid rgba(88, 200, 150, 0.4)', height: 26, padding: '0 8px', borderRadius: 4 }}
        >
          <Icon name="play" size={12} />
          <span>{t('playtest.short')}</span>
        </button>
        <button
          type="button"
          className="btn btn-sm btn-ghost guide-btn"
          onClick={() => store.setDialog({ type: 'guide' })}
          title={t('guide.title')}
          style={{ gap: 5, fontWeight: 600, color: 'var(--accent-soft)', background: 'var(--accent-dim)', border: '1px solid var(--accent-line)', height: 26, padding: '0 8px', borderRadius: 4 }}
        >
          <Icon name="sparkles" size={13} />
          <span>{t('guide.title')}</span>
        </button>
        <div className="quick-group">
          <IconButton icon="undo" label={t('menu.undo')} onClick={() => runCommand('edit.undo')} disabled={!store.history?.canUndo} />
          <IconButton icon="redo" label={t('menu.redo')} onClick={() => runCommand('edit.redo')} disabled={!store.history?.canRedo} />
        </div>
        <div className="quick-group">
          <IconButton icon="grid" label={t('menu.grid')} active={store.ui.showGrid} onClick={() => runCommand('view.grid')} />
          <IconButton icon="layers" label={t('menu.onion')} active={store.ui.showOnion} onClick={() => runCommand('view.onion')} />
        </div>
        <button type="button" className="zoom-chip" title={t('menu.fit')} onClick={() => viewport.current?.fit?.()}>
          {Math.round(zoom * 100)}%
        </button>
        <IconButton icon={themeIcon} label={t('menu.theme')} onClick={() => runCommand('view.theme')} />
        <IconButton icon="command" label={t('menu.commands')} onClick={() => runCommand('app.commands')} />
        <IconButton icon="settings" label={t('menu.preferences')} onClick={() => runCommand('app.settings')} />
      </div>
    </header>
  );
}

export default MenuBar;
