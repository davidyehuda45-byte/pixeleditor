import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { IconButton } from '../../ui/controls.jsx';
import { useFocusTrap } from '../../ui/hooks.jsx';

/** Accessible modal shell shared by every PixelForge dialog. */
export function Modal({
  title, subtitle, icon = 'info', children, footer, onClose, size = 'md',
  className = '', busy = false, bodyClassName = '', headerExtra = null,
}) {
  const shellRef = useRef(null);
  const titleId = useId();
  useFocusTrap(shellRef, true);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      if (!busy) onClose?.();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [busy, onClose]);

  return createPortal(
    <div
      className={`modal-backdrop ${className}`.trim()}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose?.();
      }}
    >
      <div
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={shellRef}
      >
        <header className="modal-header">
          <span className="modal-icon"><Icon name={icon} size={18} /></span>
          <div className="modal-heading">
            <h2 id={titleId}>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {headerExtra}
          <IconButton icon="close" label="Tutup" onClick={onClose} disabled={busy} tabIndex={-1} />
        </header>
        <div className={`modal-body ${bodyClassName}`.trim()}>{children}</div>
        {footer ? <footer className="modal-footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}

export function DialogSection({ title, children, className = '', actions = null }) {
  return (
    <section className={`dialog-section ${className}`.trim()}>
      {(title || actions) ? (
        <div className="dialog-section-head">
          {title ? <h3>{title}</h3> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function DialogTabs({ tabs, value, onChange }) {
  return (
    <div className="dialog-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          className={value === tab.value ? 'is-active' : ''}
          onClick={() => onChange(tab.value)}
        >
          {tab.icon ? <Icon name={tab.icon} size={14} /> : null}
          <span>{tab.label}</span>
          {tab.badge != null ? <em>{tab.badge}</em> : null}
        </button>
      ))}
    </div>
  );
}

export function FormGrid({ columns = 2, children, className = '' }) {
  return (
    <div className={`form-grid cols-${columns} ${className}`.trim()}>
      {children}
    </div>
  );
}

export function InfoNote({ icon = 'info', tone = 'info', children }) {
  return (
    <div className={`info-note note-${tone}`}>
      <Icon name={icon} size={15} />
      <div>{children}</div>
    </div>
  );
}
