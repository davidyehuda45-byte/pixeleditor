import React from 'react';
import { useStore, useI18n } from '../ui/hooks.jsx';
import { Icon } from './Icon.jsx';
import { Button } from '../ui/controls.jsx';

const TOAST_ICONS = { success: 'success', error: 'error', warn: 'warning', info: 'info' };

export function ToastHost() {
  const store = useStore();
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {store.toasts.map((toast) => (
        <div className={`toast toast-${toast.type || 'info'}`} key={toast.id}>
          <span className="toast-icon"><Icon name={TOAST_ICONS[toast.type] || 'info'} size={16} /></span>
          <span className="toast-message">{toast.message}</span>
          <button type="button" className="toast-close" aria-label="Close" onClick={() => store.dismissToast?.(toast.id)}>
            <Icon name="close" size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function ConfirmHost() {
  const store = useStore();
  const { t } = useI18n();
  const confirm = store.confirmState;
  if (!confirm) return null;
  return (
    <div className="modal-backdrop confirm-backdrop" role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) store.resolveConfirm(false); }}>
      <div className="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className={`modal-icon ${confirm.danger ? 'is-danger' : ''}`}>
          <Icon name={confirm.danger ? 'warning' : 'info'} size={22} />
        </div>
        <div className="confirm-copy">
          <h2 id="confirm-title">{confirm.title}</h2>
          <p>{confirm.message}</p>
        </div>
        <div className="modal-actions">
          <Button variant="ghost" onClick={() => store.resolveConfirm(false)}>{confirm.cancelLabel || t('common.cancel')}</Button>
          <Button variant={confirm.danger ? 'danger' : 'primary'} onClick={() => store.resolveConfirm(true)} autoFocus>
            {confirm.confirmLabel || t('common.continue')}
          </Button>
        </div>
      </div>
    </div>
  );
}
