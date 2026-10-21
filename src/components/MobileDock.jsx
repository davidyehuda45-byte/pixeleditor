import React from 'react';
import { useStore, useI18n } from '../ui/hooks.jsx';
import { Icon } from './Icon.jsx';
import { TOOL_BY_ID } from '../ui/toolDefs.js';

export function MobileDock({ activeDrawer, onToggleDrawer, runCommand, viewport }) {
  const store = useStore();
  const { t } = useI18n();

  const currentToolDef = TOOL_BY_ID[store.ui.tool] || { icon: 'pencil' };
  const canUndo = !!store.history?.canUndo;
  const canRedo = !!store.history?.canRedo;

  return (
    <nav className="mobile-dock" aria-label="Mobile Navigation Dock">
      <button
        type="button"
        className="mobile-dock-btn"
        disabled={!canUndo}
        onClick={() => runCommand('edit.undo')}
        title={t('menu.undo')}
        aria-label={t('menu.undo')}
      >
        <Icon name="undo" size={18} />
        <span className="mobile-dock-label">Undo</span>
      </button>

      <button
        type="button"
        className="mobile-dock-btn"
        disabled={!canRedo}
        onClick={() => runCommand('edit.redo')}
        title={t('menu.redo')}
        aria-label={t('menu.redo')}
      >
        <Icon name="redo" size={18} />
        <span className="mobile-dock-label">Redo</span>
      </button>

      <button
        type="button"
        className={`mobile-dock-btn ${activeDrawer === 'tools' ? 'is-active' : ''}`}
        onClick={() => onToggleDrawer('tools')}
        title={t('menu.tools')}
        aria-label={t('menu.tools')}
      >
        <Icon name={currentToolDef.icon} size={18} />
        <span className="mobile-dock-label">{t('menu.tools')}</span>
      </button>

      <button
        type="button"
        className={`mobile-dock-btn ${activeDrawer === 'panel' ? 'is-active' : ''}`}
        onClick={() => onToggleDrawer('panel')}
        title={t('colors.palette')}
        aria-label={t('colors.palette')}
      >
        <div className="mobile-color-indicator">
          <span className="color-dot primary" style={{ background: store.ui.primary }} />
          <span className="color-dot secondary" style={{ background: store.ui.secondary }} />
        </div>
        <span className="mobile-dock-label">{t('colors.palette')}</span>
      </button>

      <button
        type="button"
        className={`mobile-dock-btn ${activeDrawer === 'timeline' ? 'is-active' : ''}`}
        onClick={() => onToggleDrawer('timeline')}
        title={t('menu.frame')}
        aria-label={t('menu.frame')}
      >
        <Icon name="play" size={18} />
        <span className="mobile-dock-label">{t('menu.frame')}</span>
      </button>

      <button
        type="button"
        className="mobile-dock-btn"
        onClick={() => viewport.current?.fit?.()}
        title={t('menu.fit')}
        aria-label={t('menu.fit')}
      >
        <Icon name="fit" size={18} />
        <span className="mobile-dock-label">Fit</span>
      </button>
    </nav>
  );
}

export default MobileDock;
