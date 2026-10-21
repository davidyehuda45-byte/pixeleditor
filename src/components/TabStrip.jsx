import React from 'react';
import { useStore, useI18n } from '../ui/hooks.jsx';
import { Icon } from './Icon.jsx';
import { requestCloseSession } from '../ui/actions.js';

export function TabStrip() {
  const store = useStore();
  const { t } = useI18n();

  return (
    <div className={`tab-strip ${store.sessions.length <= 1 ? 'is-single' : ''}`} role="tablist" aria-label={t('app.name')}>
      <div className="tab-scroll">
        {store.sessions.map((session, index) => {
          const active = index === store.activeIndex;
          const title = session.doc?.title || session.fileName || t('app.untitled');
          return (
            <div
              key={session.id}
              className={`doc-tab ${active ? 'is-active' : ''} ${session.dirty ? 'is-dirty' : ''}`}
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => store.setActiveSession(index)}
              onAuxClick={(event) => { if (event.button === 1) requestCloseSession(store, session.id); }}
              onDoubleClick={() => { store.setActiveSession(index); store.setDialog({ type: 'renameDocument' }); }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') store.setActiveSession(index);
                if (event.key === 'Delete') requestCloseSession(store, session.id);
              }}
              title={`${title}${session.dirty ? ` · ${t('app.unsaved')}` : ` · ${t('app.saved')}`}`}
            >
              <span className="tab-dot" aria-hidden="true" />
              <span className="tab-title">{title}</span>
              {session.dirty ? <span className="tab-dirty" title={t('app.unsaved')} /> : null}
              <button
                type="button"
                className="tab-close"
                aria-label={t('menu.closeTab')}
                title={t('menu.closeTab')}
                onClick={(event) => { event.stopPropagation(); requestCloseSession(store, session.id); }}
              >
                <Icon name="close" size={12} />
              </button>
            </div>
          );
        })}
      </div>
      <button type="button" className="new-tab" title={t('menu.new')} aria-label={t('menu.new')} onClick={() => store.setDialog({ type: 'new' })}>
        <Icon name="plus" size={14} />
      </button>
      <div className="tab-tail">
        <span className={`save-indicator ${store.dirty ? 'is-dirty' : 'is-saved'}`}>
          <span className="save-dot" />
          {store.dirty ? t('app.unsaved') : t('app.saved')}
        </span>
        <button type="button" className="tab-tool" title={t('menu.timeline')} onClick={() => store.setUI({ showTimeline: !store.ui.showTimeline })}>
          <Icon name="film" size={14} />
        </button>
        <button type="button" className="tab-tool" title={t('menu.rightPanel')} onClick={() => store.setUI({ showRightPanel: !store.ui.showRightPanel })}>
          <Icon name="panel-right" size={14} />
        </button>
      </div>
    </div>
  );
}

export default TabStrip;
