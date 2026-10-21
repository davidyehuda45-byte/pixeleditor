import React from 'react';
import { Icon } from '../components/Icon.jsx';

export function Button({ children, variant = 'default', size = 'md', icon, trailingIcon, className = '', ...props }) {
  return (
    <button type="button" className={`btn btn-${variant} btn-${size} ${className}`.trim()} {...props}>
      {icon ? <Icon name={icon} size={size === 'sm' ? 14 : 16} /> : null}
      {children ? <span>{children}</span> : null}
      {trailingIcon ? <Icon name={trailingIcon} size={size === 'sm' ? 14 : 16} /> : null}
    </button>
  );
}

export function IconButton({ icon, label, active = false, className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`icon-btn ${active ? 'is-active' : ''} ${className}`.trim()}
      title={label}
      aria-label={label}
      aria-pressed={props['aria-pressed'] ?? (active || undefined)}
      {...props}
    >
      {children || <Icon name={icon} size={16} />}
    </button>
  );
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`field ${className}`.trim()}>
      {label ? <span className="field-label">{label}</span> : null}
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function Select({ value, onChange, options = [], className = '', ...props }) {
  return (
    <select
      className={`select ${className}`.trim()}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      {...props}
    >
      {options.map((option) => {
        const opt = typeof option === 'string' ? { value: option, label: option } : option;
        return <option key={opt.value} value={opt.value}>{opt.label}</option>;
      })}
    </select>
  );
}

export function NumberInput({ value, onChange, min = -99999, max = 99999, step = 1, className = '', ...props }) {
  const set = (next) => {
    const number = Number(next);
    if (Number.isFinite(number)) onChange?.(Math.max(min, Math.min(max, number)));
  };
  return (
    <div className={`number-input ${className}`.trim()}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => set(event.target.value)}
        {...props}
      />
      <div className="stepper">
        <button type="button" tabIndex={-1} onClick={() => set(Number(value) + step)} aria-label="+">
          <Icon name="chevron-up" size={10} />
        </button>
        <button type="button" tabIndex={-1} onClick={() => set(Number(value) - step)} aria-label="-">
          <Icon name="chevron-down" size={10} />
        </button>
      </div>
    </div>
  );
}

export function Slider({ value, onChange, min = 0, max = 100, step = 1, label, suffix = '', className = '', disabled = false }) {
  return (
    <label className={`range-field ${className}`.trim()}>
      {label ? <span className="range-label">{label}</span> : null}
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(event) => onChange?.(Number(event.target.value))}
      />
      <span className="range-value">{value}{suffix}</span>
    </label>
  );
}

export function Toggle({ checked, onChange, label, hint, disabled = false }) {
  return (
    <label className={`toggle-row ${disabled ? 'is-disabled' : ''}`.trim()}>
      <span className="toggle">
        <input type="checkbox" checked={!!checked} disabled={disabled} onChange={(event) => onChange?.(event.target.checked)} />
        <span className="toggle-track" aria-hidden="true"><span className="toggle-thumb" /></span>
      </span>
      <span className="toggle-copy">
        <span className="toggle-label">{label}</span>
        {hint ? <span className="toggle-hint">{hint}</span> : null}
      </span>
    </label>
  );
}

export function Segmented({ value, onChange, options = [], label, className = '' }) {
  return (
    <div className={`segmented ${className}`.trim()} role="group" aria-label={label}>
      {options.map((option) => {
        const opt = typeof option === 'string' ? { value: option, label: option } : option;
        return (
          <button
            key={opt.value}
            type="button"
            className={value === opt.value ? 'is-active' : ''}
            onClick={() => onChange?.(opt.value)}
            title={opt.title || undefined}
            aria-pressed={value === opt.value}
          >
            {opt.icon ? <Icon name={opt.icon} size={14} /> : null}
            {opt.label ? <span>{opt.label}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function Swatch({ color = '#000000', size = 22, active = false, title, onClick, onContextMenu, className = '' }) {
  return (
    <button
      type="button"
      className={`swatch ${active ? 'is-active' : ''} ${className}`.trim()}
      style={{ width: size, height: size, background: color }}
      title={title || color}
      aria-label={title || color}
      onClick={onClick}
      onContextMenu={onContextMenu}
    />
  );
}

export function Spinner({ label = 'Loading' }) {
  return <span className="spinner" role="status" aria-label={label}><span /></span>;
}

export function EmptyState({ icon = 'info', title, children }) {
  return (
    <div className="empty-state">
      <Icon name={icon} size={22} />
      {title ? <strong>{title}</strong> : null}
      {children ? <span>{children}</span> : null}
    </div>
  );
}
