import React, { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { translate, formatTime, LANGUAGES } from '../i18n.js';

const StoreContext = createContext(null);

export function StoreProvider({ store, children }) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>');
  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return store;
}

export function useStoreInstance() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStoreInstance must be used inside <StoreProvider>');
  return store;
}

export function useI18n() {
  const store = useStore();
  const lang = store.ui.language || 'id';
  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);
  return { t, lang, languages: LANGUAGES };
}

/** Subscribe to a specific ephemeral/bus event without triggering renders. */
export function useStoreEvent(type, handler) {
  const store = useStoreInstance();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    return store.subscribe((event) => {
      if (event.type === type) ref.current?.(event);
    });
  }, [store, type]);
}

/** Subscribe to many events (space-separated or array). */
export function useStoreEvents(types, handler) {
  const store = useStoreInstance();
  const ref = useRef(handler);
  ref.current = handler;
  const key = Array.isArray(types) ? types.join('|') : String(types);
  useEffect(() => {
    const set = new Set(key.split('|'));
    return store.subscribe((event) => {
      if (set.has(event.type)) ref.current?.(event);
    });
  }, [store, key]);
}

export function useCursorInfo() {
  const [info, setInfo] = useState({ x: 0, y: 0, inside: false, color: null, hex: null });
  useStoreEvent('cursor', (event) => setInfo({
    x: event.x, y: event.y, inside: event.inside, color: event.color, hex: event.hex,
  }));
  return info;
}

export function useNow(interval = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}

export function useFormatTime(lang) {
  return useCallback((value) => formatTime(value, lang), [lang]);
}

export function useDebouncedValue(value, delay = 150) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/** Close a transient popover when clicking outside of `ref`. */
export function useClickOutside(ref, onClose, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const handler = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      onClose?.(event);
    };
    const onKey = (event) => { if (event.key === 'Escape') onClose?.(event); };
    document.addEventListener('pointerdown', handler, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', handler, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [active, onClose, ref]);
}

export function useFocusTrap(ref, active = true) {
  useEffect(() => {
    if (!active || !ref.current) return undefined;
    const root = ref.current;
    const previous = document.activeElement;
    const focusables = () => Array.from(root.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter((el) => el.offsetParent !== null || el === document.activeElement);
    const first = focusables()[0];
    first?.focus?.();
    const onKey = (event) => {
      if (event.key !== 'Tab') return;
      const list = focusables();
      if (!list.length) return;
      const firstEl = list[0], lastEl = list[list.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault(); lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault(); firstEl.focus();
      }
    };
    root.addEventListener('keydown', onKey);
    return () => {
      root.removeEventListener('keydown', onKey);
      if (previous && previous.focus) previous.focus();
    };
  }, [active, ref]);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function useLatest(value) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
