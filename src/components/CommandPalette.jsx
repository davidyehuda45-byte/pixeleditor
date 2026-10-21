import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../ui/hooks.jsx';
import { Icon } from './Icon.jsx';
import { formatShortcut } from '../ui/shortcuts.js';

const RECENTS_KEY = 'pixelforge:command-recents:v1';

function readRecents() {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string').slice(0, 8) : [];
  } catch {
    return [];
  }
}

function scoreCommand(command, query) {
  if (!query) return 0;
  const q = query.toLowerCase();
  const label = command.label.toLowerCase();
  const id = command.id.toLowerCase();
  if (label.startsWith(q)) return 120;
  if (label.includes(` ${q}`)) return 100;
  if (label.includes(q)) return 80;
  if (id.includes(q)) return 60;
  let index = 0;
  let score = 0;
  for (const char of q) {
    index = label.indexOf(char, index);
    if (index < 0) return -1;
    score += 3;
    index++;
  }
  return score;
}

export function CommandPalette({ open, onClose, commands, runCommand }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [recents, setRecents] = useState(readRecents);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActive(0);
      return;
    }
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const results = useMemo(() => {
    const enabled = commands.filter((command) => command.enabled?.() !== false);
    if (!query.trim()) {
      const recentCommands = recents.map((id) => enabled.find((command) => command.id === id)).filter(Boolean);
      const rest = enabled.filter((command) => !recents.includes(command.id));
      return [...recentCommands, ...rest];
    }
    return enabled
      .map((command) => ({ command, score: scoreCommand(command, query.trim()) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score || a.command.label.localeCompare(b.command.label))
      .slice(0, 80)
      .map((entry) => entry.command);
  }, [commands, query, recents]);

  const categoryLabel = (category) => {
    const map = {
      file: 'menu.file', edit: 'menu.edit', select: 'menu.select', layer: 'menu.layer',
      frame: 'menu.frame', view: 'menu.view', help: 'menu.help', tool: 'menu.tools', canvas: 'menu.canvas',
    };
    return map[category] ? t(map[category]) : category;
  };

  // Build headings separately from the keyboard-order command list. This keeps
  // recents highlighted without repeating the same category several times.
  const rows = useMemo(() => {
    if (query.trim()) {
      return results.map((command, index) => ({ type: 'command', command, index }));
    }
    const rowsOut = [];
    let index = 0;
    const pushGroup = (label, items) => {
      if (!items.length) return;
      rowsOut.push({ type: 'heading', key: `h-${label}`, label });
      for (const command of items) rowsOut.push({ type: 'command', command, index: index++ });
    };
    const byId = new Map(results.map((command) => [command.id, command]));
    const recentItems = recents.map((id) => byId.get(id)).filter(Boolean);
    pushGroup(t('command.recent'), recentItems);
    const rest = results.filter((command) => !recents.includes(command.id));
    const categories = [];
    for (const command of rest) {
      if (!categories.includes(command.category)) categories.push(command.category);
    }
    for (const category of categories) {
      pushGroup(categoryLabel(category), rest.filter((command) => command.category === category));
    }
    return rowsOut;
  }, [commands, query, recents, results, t]);

  const orderedCommands = useMemo(
    () => rows.filter((row) => row.type === 'command').map((row) => row.command),
    [rows],
  );

  useEffect(() => {
    setActive((value) => Math.min(value, Math.max(0, orderedCommands.length - 1)));
  }, [orderedCommands.length]);

  useEffect(() => {
    const el = listRef.current?.querySelector('.command-item.is-active');
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const execute = (command) => {
    if (!command) return;
    const next = [command.id, ...recents.filter((id) => id !== command.id)].slice(0, 8);
    setRecents(next);
    try { localStorage.setItem(RECENTS_KEY, JSON.stringify(next)); } catch { /* ignore quota */ }
    onClose();
    runCommand(command.id);
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((value) => Math.min(orderedCommands.length - 1, value + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((value) => Math.max(0, value - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      execute(orderedCommands[active]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div className="command-backdrop" role="dialog" aria-modal="true" aria-label={t('menu.commands')} onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="command-palette" onKeyDown={onKeyDown}>
        <div className="command-search">
          <Icon name="search" size={17} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => { setQuery(event.target.value); setActive(0); }}
            placeholder={t('command.search')}
            aria-label={t('menu.commands')}
            spellCheck={false}
          />
          <kbd>ESC</kbd>
        </div>
        <div className="command-list" ref={listRef} role="listbox">
          {results.length ? rows.map((row) => {
            if (row.type === 'heading') {
              return <div key={row.key} className="command-category">{row.label}</div>;
            }
            const { command, index } = row;
            return (
              <button
                type="button"
                key={command.id}
                role="option"
                aria-selected={active === index}
                className={`command-item ${active === index ? 'is-active' : ''}`}
                onPointerMove={() => setActive(index)}
                onClick={() => execute(command)}
              >
                <span className="command-icon"><Icon name={command.icon || 'command'} size={15} /></span>
                <span className="command-label">{command.label}</span>
                {command.checked?.() ? <Icon name="check" size={13} /> : null}
                {command.shortcut ? <kbd>{formatShortcut(command.shortcut)}</kbd> : null}
              </button>
            );
          }) : <div className="command-empty">{t('command.noResults')}</div>}
        </div>
        <div className="command-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> {t('command.navigate')}</span>
          <span><kbd>↵</kbd> {t('command.run')}</span>
          <span><kbd>Esc</kbd> {t('common.close')}</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
