import React from 'react';
import { useStore, useI18n } from '../ui/hooks.jsx';
import { Icon } from './Icon.jsx';
import { TOOL_GROUPS } from '../ui/toolDefs.js';
import { formatShortcut, shortcutFor } from '../ui/shortcuts.js';

export function ToolRail({ viewport }) {
  const store = useStore();
  const { t } = useI18n();
  const active = store.ui.tool;

  return (
    <aside className="tool-rail" aria-label={t('menu.tools')}>
      <div className="tool-rail-scroll">
        {TOOL_GROUPS.map((group) => (
          <div className="tool-group" key={group.id}>
            <div className="tool-group-label" title={t(group.labelKey)}>{t(group.labelKey)}</div>
            <div className="tool-grid">
              {group.tools.map((tool) => {
                const combo = formatShortcut(shortcutFor(store, `tool.${tool.id}`));
                const name = t(tool.labelKey);
                const desc = t(`tool.${tool.id}.desc`);
                const title = `${name}${combo && combo !== '—' ? ` (${combo})` : ''}${desc ? `\n— ${desc}` : ''}`;
                return (
                  <button
                    type="button"
                    key={tool.id}
                    className={`tool-btn ${active === tool.id ? 'is-active' : ''}`}
                    title={title}
                    aria-label={name}
                    aria-pressed={active === tool.id}
                    onClick={() => store.setTool(tool.id)}
                  >
                    <Icon name={tool.icon} size={18} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="tool-rail-footer">
        <div className="rail-colors" title={t('colors.swap')}>
          <button
            type="button"
            className="rail-color rail-primary"
            style={{ background: store.ui.primary }}
            onClick={() => window.dispatchEvent(new CustomEvent('pixelforge:focus-color', { detail: 'primary' }))}
            aria-label={t('colors.primary')}
          />
          <button
            type="button"
            className="rail-color rail-secondary"
            style={{ background: store.ui.secondary }}
            onClick={() => window.dispatchEvent(new CustomEvent('pixelforge:focus-color', { detail: 'secondary' }))}
            aria-label={t('colors.secondary')}
          />
          <button type="button" className="rail-swap" onClick={() => store.swapColors()} title={t('colors.swap')} aria-label={t('colors.swap')}>
            <Icon name="swap" size={12} />
          </button>
        </div>
        <button type="button" className="rail-fit" onClick={() => viewport.current?.fit?.()} title={t('menu.fit')} aria-label={t('menu.fit')}>
          <Icon name="fit" size={15} />
        </button>
      </div>
    </aside>
  );
}

export default ToolRail;
