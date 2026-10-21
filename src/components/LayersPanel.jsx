import React, { useEffect, useRef, useState } from 'react';
import { useStore, useI18n } from '../ui/hooks.jsx';
import { Icon } from './Icon.jsx';
import { IconButton, Slider, Select } from '../ui/controls.jsx';
import {
  addLayer, duplicateLayer, deleteLayer, mergeLayerDown, ungroupLayer, moveLayerTo,
  setLayerProps, toggleLayerFlag,
} from '../core/commands.js';

export function buildRows(doc) {
  if (!doc) return [];
  const byParent = new Map();
  for (const layer of doc.layers) {
    const key = layer.parentId && doc.getLayer(layer.parentId) ? layer.parentId : null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(layer);
  }
  for (const list of byParent.values()) list.sort((a, b) => doc.layers.indexOf(b) - doc.layers.indexOf(a));
  const rows = [];
  const visit = (parentId, depth) => {
    for (const layer of byParent.get(parentId) || []) {
      rows.push({ layer, depth });
      if (layer.type === 'group') visit(layer.id, depth + 1);
    }
  };
  visit(null, 0);
  // Any cycle or orphan shouldn't hide a layer; append leftovers.
  const seen = new Set(rows.map((r) => r.layer.id));
  for (const layer of [...doc.layers].reverse()) if (!seen.has(layer.id)) rows.push({ layer, depth: 0 });
  return rows;
}

export function CelThumb({ doc, layer, frameId, size = 30, revision }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !doc) return;
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#20222c';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#2a2d3a';
    const cell = 5;
    for (let y = 0; y < size; y += cell) for (let x = 0; x < size; x += cell) {
      if (((x / cell) + (y / cell)) % 2 === 0) ctx.fillRect(x, y, cell, cell);
    }
    if (layer.type === 'group') {
      ctx.strokeStyle = '#8f94a8';
      ctx.lineWidth = 1;
      ctx.strokeRect(6.5, 9.5, 17, 12);
      ctx.beginPath();
      ctx.moveTo(6.5, 9.5);
      ctx.lineTo(10.5, 5.5);
      ctx.lineTo(19.5, 5.5);
      ctx.lineTo(19.5, 9.5);
      ctx.stroke();
      return;
    }
    const cel = doc.getCel(layer.id, frameId);
    if (!cel?.pixels) return;
    const temp = document.createElement('canvas');
    temp.width = cel.width;
    temp.height = cel.height;
    const tctx = temp.getContext('2d');
    const img = new ImageData(new Uint8ClampedArray(cel.pixels), cel.width, cel.height);
    tctx.putImageData(img, 0, 0);
    const scale = Math.min(size / doc.width, size / doc.height);
    const dw = Math.max(1, Math.round(doc.width * scale));
    const dh = Math.max(1, Math.round(doc.height * scale));
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(temp, Math.floor((size - dw) / 2), Math.floor((size - dh) / 2), dw, dh);
  }, [doc, layer, frameId, size, revision]);
  return <canvas className="layer-thumb-canvas" ref={ref} width={size} height={size} aria-hidden="true" />;
}

/** Layer stack with drag reorder, groups, blend/opacity and per-frame thumbs. */
export function LayersPanel({ compact = false }) {
  const store = useStore();
  const { t } = useI18n();
  const doc = store.doc;
  const session = store.activeSession;
  const activeLayer = store.activeLayer;
  const [collapsed, setCollapsed] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [dropTarget, setDropTarget] = useState(null);
  const opacityStartRef = useRef(null);
  const [opacityDraft, setOpacityDraft] = useState(activeLayer?.opacity ?? 255);

  useEffect(() => {
    if (!activeLayer) return;
    setOpacityDraft(activeLayer.opacity ?? 255);
  }, [activeLayer?.id, store.revision]);

  if (!doc || !session) return <div className="panel-empty">{t('layers.empty')}</div>;
  const rows = buildRows(doc);

  const beginRename = (layer) => {
    setEditingId(layer.id);
    setEditName(layer.name);
  };
  const commitRename = () => {
    if (!editingId) return;
    const name = editName.trim();
    if (name && name !== doc.getLayer(editingId)?.name) setLayerProps(store, editingId, { name }, t('layers.rename'));
    setEditingId(null);
  };

  const toggleGroup = (id) => setCollapsed((current) => ({ ...current, [id]: !current[id] }));

  const onDragStart = (event, layer) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', layer.id);
    event.dataTransfer.setData('application/x-pixelforge-layer', layer.id);
  };
  const onDragOver = (event, layer) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientY - rect.top) / Math.max(1, rect.height);
    const position = layer.type === 'group'
      ? (ratio < 0.28 ? 'before' : ratio > 0.72 ? 'after' : 'inside')
      : (ratio < 0.5 ? 'before' : 'after');
    setDropTarget({ id: layer.id, position });
  };
  const onDrop = (event, target) => {
    event.preventDefault();
    const id = event.dataTransfer.getData('application/x-pixelforge-layer') || event.dataTransfer.getData('text/plain');
    const position = dropTarget?.id === target.id ? dropTarget.position : 'after';
    setDropTarget(null);
    if (!id || id === target.id) return;
    const dragged = doc.getLayer(id);
    if (!dragged) return;
    // Never move a group into itself or one of its descendants.
    if (target.id === id || doc.descendantIds(id).includes(target.id)) return;
    const targetIndex = doc.layers.findIndex((l) => l.id === target.id);
    if (targetIndex < 0) return;
    let destination;
    let parentId;
    if (position === 'inside' && target.type === 'group') {
      parentId = target.id;
      destination = targetIndex + 1;
    } else {
      parentId = target.parentId;
      destination = position === 'before' ? targetIndex + 1 : targetIndex;
    }
    // Destination is measured before the dragged layer is removed.
    const draggedIndex = doc.layers.findIndex((l) => l.id === id);
    if (draggedIndex >= 0 && draggedIndex < destination) destination -= 1;
    moveLayerTo(store, id, destination, parentId);
  };

  const startOpacityDrag = () => {
    if (!activeLayer) return;
    opacityStartRef.current = activeLayer.opacity ?? 255;
  };
  const previewOpacity = (value) => {
    setOpacityDraft(value);
    if (activeLayer) {
      activeLayer.opacity = value;
      store.emit('doc:change', { reason: 'opacity-preview' });
    }
  };
  const commitOpacity = () => {
    if (!activeLayer || opacityStartRef.current == null) return;
    const start = opacityStartRef.current;
    const end = activeLayer.opacity ?? opacityDraft;
    opacityStartRef.current = null;
    if (start === end) return;
    activeLayer.opacity = start;
    setLayerProps(store, activeLayer.id, { opacity: end }, t('layers.opacity'));
    setOpacityDraft(end);
  };

  const blendOptions = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'add', 'subtract', 'difference']
    .map((value) => ({ value, label: t(`blend.${value}`) }));

  return (
    <div className={`layers-panel ${compact ? 'is-compact' : ''}`}>
      <div className="layer-props">
        <Select
          value={activeLayer?.blend || 'normal'}
          onChange={(value) => activeLayer && setLayerProps(store, activeLayer.id, { blend: value }, t('layers.blend'))}
          options={blendOptions}
          aria-label={t('layers.blend')}
          className="blend-select"
          disabled={!activeLayer}
        />
        <div className="layer-opacity-wrap" onPointerDown={startOpacityDrag} onPointerUp={commitOpacity} onPointerCancel={commitOpacity}>
          <Slider
            value={opacityDraft}
            min={0}
            max={255}
            label={t('common.opacity')}
            onChange={previewOpacity}
            className="layer-opacity"
          />
        </div>
      </div>
      <div className="layer-list" role="tree" aria-label={t('layers.title')}>
        {rows.map(({ layer, depth }) => {
          const active = layer.id === session.activeLayerId;
          const collapsedHere = !!collapsed[layer.id];
          const linked = layer.type === 'layer' && doc.getCel(layer.id, session.activeFrameId)
            ? doc.linkCount(doc.getCel(layer.id, session.activeFrameId)) > 1 : false;
          return (
            <div
              key={layer.id}
              className={`layer-row ${active ? 'is-active' : ''} ${layer.visible === false ? 'is-hidden' : ''} ${dropTarget?.id === layer.id ? `drop-${dropTarget.position}` : ''}`}
              style={{ '--depth': depth }}
              role="treeitem"
              aria-selected={active}
              aria-expanded={layer.type === 'group' ? !collapsedHere : undefined}
              draggable
              onDragStart={(event) => onDragStart(event, layer)}
              onDragOver={(event) => onDragOver(event, layer)}
              onDragLeave={() => setDropTarget(null)}
              onDragEnd={() => setDropTarget(null)}
              onDrop={(event) => onDrop(event, layer)}
              onClick={() => store.setActiveLayer(layer.id)}
              onDoubleClick={() => beginRename(layer)}
            >
              <span className="layer-indent" />
              {layer.type === 'group' ? (
                <button
                  type="button"
                  className="layer-chevron"
                  onClick={(event) => { event.stopPropagation(); toggleGroup(layer.id); }}
                  aria-label={collapsedHere ? 'Expand' : 'Collapse'}
                >
                  <Icon name={collapsedHere ? 'chevron-right' : 'chevron-down'} size={12} />
                </button>
              ) : <span className="layer-chevron-spacer" />}
              <span className={`layer-thumb ${linked ? 'is-linked' : ''}`} title={t('layers.thumbnail')}>
                <CelThumb doc={doc} layer={layer} frameId={session.activeFrameId} size={26} revision={store.revision} />
                {linked ? <span className="layer-link-badge"><Icon name="link" size={9} /></span> : null}
              </span>
              <span className="layer-copy">
                {editingId === layer.id ? (
                  <input
                    className="layer-name-input"
                    value={editName}
                    autoFocus
                    onChange={(event) => setEditName(event.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') { event.preventDefault(); commitRename(); }
                      if (event.key === 'Escape') { event.preventDefault(); setEditingId(null); }
                    }}
                    onClick={(event) => event.stopPropagation()}
                  />
                ) : (
                  <span className="layer-name">{layer.name}</span>
                )}
                {layer.type === 'group' ? <span className="layer-badge">{t('layers.group')}</span> : null}
                {layer.reference ? <span className="layer-badge">{t('layers.reference')}</span> : null}
                {layer.clipping ? <span className="layer-badge">{t('layers.clipping')}</span> : null}
                {layer.lockAlpha ? <span className="layer-badge">{t('layers.lockAlpha')}</span> : null}
              </span>
              <span className="layer-actions">
                <IconButton
                  icon={layer.visible === false ? 'eye-off' : 'eye'}
                  label={layer.visible === false ? t('layers.hidden') : t('layers.visible')}
                  className={`mini ${layer.visible === false ? 'is-off' : ''}`}
                  onClick={(event) => { event.stopPropagation(); toggleLayerFlag(store, layer.id, 'visible'); }}
                />
                <IconButton
                  icon={layer.locked ? 'lock' : 'unlock'}
                  label={layer.locked ? t('layers.locked') : t('layers.unlocked')}
                  className={`mini ${layer.locked ? 'is-on' : 'is-faint'}`}
                  onClick={(event) => { event.stopPropagation(); toggleLayerFlag(store, layer.id, 'locked'); }}
                />
              </span>
            </div>
          );
        })}
      </div>
      <div className="layer-toolbar">
        <IconButton icon="plus" label={t('layers.add')} onClick={() => addLayer(store)} />
        <IconButton icon="folder-plus" label={t('layers.addGroup')} onClick={() => addLayer(store, { type: 'group' })} />
        <IconButton icon="copy" label={t('layers.duplicate')} onClick={() => duplicateLayer(store)} disabled={!activeLayer || activeLayer.type !== 'layer'} />
        <IconButton icon="merge" label={t('layers.merge')} onClick={() => mergeLayerDown(store)} disabled={!activeLayer || activeLayer.type !== 'layer'} />
        <IconButton icon="folder" label={t('layers.ungroup')} onClick={() => ungroupLayer(store, activeLayer?.id)} disabled={activeLayer?.type !== 'group'} />
        <span className="toolbar-spacer" />
        <IconButton
          icon="trash"
          label={t('layers.delete')}
          disabled={!activeLayer || doc.layers.filter((l) => l.type === 'layer').length <= 1 && activeLayer.type === 'layer'}
          onClick={() => {
            if (!activeLayer) return;
            store.askConfirm({
              title: t('confirm.deleteLayer.title'),
              message: t('confirm.deleteLayer.message', { name: activeLayer.name }),
              confirmLabel: t('common.delete'),
              danger: true,
              onConfirm: () => deleteLayer(store, activeLayer.id),
            });
          }}
        />
      </div>
    </div>
  );
}

export default LayersPanel;
