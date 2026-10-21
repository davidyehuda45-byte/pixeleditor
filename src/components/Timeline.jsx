import React, { useEffect, useRef, useState } from 'react';
import { useStore, useI18n } from '../ui/hooks.jsx';
import { Icon } from './Icon.jsx';
import { IconButton, NumberInput, Slider } from '../ui/controls.jsx';
import { buildRows, CelThumb } from './LayersPanel.jsx';
import {
  addFrame, duplicateFrame, deleteFrame, moveFrame, setFrameDuration, setAllDurations,
  toggleCelLink, unlinkCel, toggleLayerFlag,
} from '../core/commands.js';

function fpsFor(frames) {
  if (!frames?.length) return 10;
  return Math.max(1, Math.min(60, Math.round(1000 / Math.max(10, frames[0].duration || 100))));
}

export function Timeline({ playing, onTogglePlay, onCloseMobile, isMobileOpen }) {
  const store = useStore();
  const { t } = useI18n();
  const doc = store.doc;
  const session = store.activeSession;
  const [frameWidth, setFrameWidth] = useState(46);
  const [dropIndex, setDropIndex] = useState(null);
  const [fpsDraft, setFpsDraft] = useState(() => fpsFor(doc?.frames));
  const [showOnionOptions, setShowOnionOptions] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { setFpsDraft(fpsFor(doc?.frames)); }, [doc?.id, doc?.frames.length, store.activeFrame?.duration]);

  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-frame-active="true"]');
    if (!el || !scrollRef.current) return;
    const container = scrollRef.current;
    const left = el.offsetLeft;
    const right = left + el.offsetWidth;
    if (left < container.scrollLeft + 180) container.scrollLeft = Math.max(0, left - 190);
    else if (right > container.scrollLeft + container.clientWidth - 20) container.scrollLeft = right - container.clientWidth + 30;
  }, [session?.activeFrameId, frameWidth]);

  if (!doc || !session) {
    return <section className={`timeline ${isMobileOpen ? 'is-mobile-open' : ''} panel-empty`}>{t('frames.empty')}</section>;
  }

  const rows = buildRows(doc);
  const currentIndex = store.activeFrameIndex;
  const duration = store.activeFrame?.duration || 100;
  const commitFps = () => {
    const fps = Math.max(1, Math.min(60, Math.round(Number(fpsDraft) || 10)));
    setFpsDraft(fps);
    setAllDurations(store, fps);
  };

  const activeTag = doc.tagAt ? doc.tagAt(currentIndex) : null;

  return (
    <section className={`timeline ${isMobileOpen ? 'is-mobile-open' : ''}`} aria-label={t('menu.timeline')}>
      <div className="mobile-drawer-header">
        <div className="mobile-drawer-pill" />
        <span className="mobile-drawer-title">{t('menu.timeline')}</span>
        <button type="button" className="btn btn-sm btn-ghost mobile-drawer-close" onClick={onCloseMobile} aria-label={t('common.close')}>
          <Icon name="x" size={16} />
        </button>
      </div>
      <div className="timeline-toolbar">
        <div className="timeline-playback">
          <IconButton icon="chevron-left" label={t('shortcut.prevFrame')} onClick={() => {
            const index = (currentIndex - 1 + doc.frames.length) % doc.frames.length;
            store.setActiveFrame(doc.frames[index].id);
          }} />
          <button type="button" className="play-button" onClick={onTogglePlay} title={playing ? t('shortcut.play') : t('shortcut.play')} aria-label={playing ? t('shortcut.play') : t('shortcut.play')}>
            <Icon name={playing ? 'pause' : 'play'} size={16} />
          </button>
          <IconButton icon="chevron-right" label={t('shortcut.nextFrame')} onClick={() => {
            const index = (currentIndex + 1) % doc.frames.length;
            store.setActiveFrame(doc.frames[index].id);
          }} />
        </div>
        <div className="frame-counter" title={t('frames.title')}>
          <strong>{currentIndex + 1}</strong><span>/</span>{doc.frames.length}
        </div>
        <div className="timeline-field" title={t('frames.duration')}>
          <Icon name="clock" size={13} />
          <NumberInput value={duration} min={10} max={10000} step={10} onChange={(value) => setFrameDuration(store, session.activeFrameId, value)} className="num-tiny" />
          <span className="unit">ms</span>
        </div>
        <div className="timeline-field" title={t('frames.fps')}>
          <input
            className="fps-input"
            type="number"
            min="1"
            max="60"
            value={fpsDraft}
            onChange={(event) => setFpsDraft(event.target.value)}
            onBlur={commitFps}
            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); commitFps(); event.currentTarget.blur(); } }}
            aria-label={t('frames.fps')}
          />
          <span className="unit">FPS</span>
        </div>
        <div className="toolbar-divider" />
        <IconButton icon="plus" label={t('frames.add')} onClick={() => addFrame(store)} />
        <IconButton icon="copy" label={t('frames.duplicate')} onClick={() => duplicateFrame(store)} />
        <IconButton icon="link" label={t('menu.linkFrame')} onClick={() => duplicateFrame(store, true)} />
        <IconButton icon="trash" label={t('frames.delete')} onClick={() => {
          store.askConfirm({
            title: t('confirm.deleteFrame.title'),
            message: t('confirm.deleteFrame.message', { index: currentIndex + 1 }),
            confirmLabel: t('common.delete'),
            danger: true,
            onConfirm: () => deleteFrame(store),
          });
        }} />
        <div className="toolbar-divider" />
        <IconButton icon="tag" label={t('menu.frameTags')} onClick={() => store.setDialog({ type: 'tags' })} />
        <div className="onion-control">
          <button
            type="button"
            className={`mini-toggle ${store.ui.showOnion ? 'is-active' : ''}`}
            onClick={() => store.setUI({ showOnion: !store.ui.showOnion })}
            title={t('frames.onion')}
          >
            <Icon name="layers" size={13} /><span>{t('frames.onion')}</span>
          </button>
          <IconButton icon={showOnionOptions ? 'chevron-up' : 'chevron-down'} label={t('frames.onionOpacity')} onClick={() => setShowOnionOptions((value) => !value)} />
          {showOnionOptions ? (
            <div className="onion-popover">
              <div className="onion-row">
                <span>{t('frames.onionBefore')}</span>
                <NumberInput value={store.ui.onionBefore} min={0} max={8} onChange={(value) => store.setUI({ onionBefore: value })} className="num-tiny" />
              </div>
              <div className="onion-row">
                <span>{t('frames.onionAfter')}</span>
                <NumberInput value={store.ui.onionAfter} min={0} max={8} onChange={(value) => store.setUI({ onionAfter: value })} className="num-tiny" />
              </div>
              <Slider value={Math.round(store.ui.onionOpacity * 100)} min={5} max={100} suffix="%" label={t('frames.onionOpacity')} onChange={(value) => store.setUI({ onionOpacity: value / 100 })} />
            </div>
          ) : null}
        </div>
        {activeTag ? (
          <span className="active-tag" style={{ '--tag-color': activeTag.color || '#7c6cf5' }} title={activeTag.name}>
            <span className="tag-dot" />{activeTag.name}
          </span>
        ) : null}
        <span className="toolbar-spacer" />
        <div className="timeline-zoom">
          <IconButton icon="minus" label={t('timeline.zoomOut')} onClick={() => setFrameWidth((value) => Math.max(28, value - 8))} />
          <span>{frameWidth}px</span>
          <IconButton icon="plus" label={t('timeline.zoomIn')} onClick={() => setFrameWidth((value) => Math.min(96, value + 8))} />
        </div>
      </div>

      <div className="timeline-scroll" ref={scrollRef}>
        <div
          className="timeline-grid"
          style={{
            gridTemplateColumns: `186px repeat(${doc.frames.length}, ${frameWidth}px)`,
            minWidth: `calc(186px + ${doc.frames.length * frameWidth}px)`,
          }}
        >
          <div className="timeline-corner">
            <Icon name="layers" size={13} />
            <span>{t('layers.title')}</span>
          </div>
          {doc.frames.map((frame, index) => {
            const tag = doc.tagAt ? doc.tagAt(index) : null;
            return (
              <div
                key={frame.id}
                className={`frame-head ${index === currentIndex ? 'is-active' : ''} ${dropIndex === index ? 'is-drop' : ''}`}
                style={tag ? { borderTopColor: tag.color || '#7c6cf5' } : undefined}
                draggable
                data-frame-active={index === currentIndex ? 'true' : undefined}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('application/x-pixelforge-frame', String(index));
                }}
                onDragOver={(event) => { event.preventDefault(); setDropIndex(index); }}
                onDragLeave={() => setDropIndex(null)}
                onDrop={(event) => {
                  event.preventDefault();
                  const from = Number(event.dataTransfer.getData('application/x-pixelforge-frame'));
                  setDropIndex(null);
                  if (Number.isInteger(from) && from !== index) moveFrame(store, from, index);
                }}
                onClick={() => store.setActiveFrame(frame.id)}
                onDoubleClick={() => { store.setActiveFrame(frame.id); store.setDialog({ type: 'frameDuration' }); }}
                title={`${index + 1} · ${frame.duration} ms${tag ? ` · ${tag.name}` : ''}`}
              >
                <span className="frame-number">{index + 1}</span>
                <span className="frame-duration">{frame.duration} ms</span>
                {tag ? <span className="frame-tag" style={{ background: tag.color || '#7c6cf5' }}>{tag.name}</span> : null}
              </div>
            );
          })}

          {rows.map(({ layer, depth }) => (
            <React.Fragment key={layer.id}>
              <div
                className={`timeline-layer ${layer.id === session.activeLayerId ? 'is-active' : ''}`}
                style={{ '--depth': depth }}
                onClick={() => store.setActiveLayer(layer.id)}
              >
                <span className="layer-indent" />
                <Icon name={layer.type === 'group' ? 'folder' : 'layers'} size={12} />
                <span className="timeline-layer-name">{layer.name}</span>
                <button
                  type="button"
                  className={`timeline-eye ${layer.visible === false ? 'is-off' : ''}`}
                  onClick={(event) => { event.stopPropagation(); toggleLayerFlag(store, layer.id, 'visible'); }}
                  title={layer.visible === false ? t('layers.hidden') : t('layers.visible')}
                >
                  <Icon name={layer.visible === false ? 'eye-off' : 'eye'} size={11} />
                </button>
              </div>
              {doc.frames.map((frame) => {
                const cel = layer.type === 'layer' ? doc.getCel(layer.id, frame.id) : null;
                const linked = cel ? doc.linkCount(cel) > 1 : false;
                const active = layer.id === session.activeLayerId && frame.id === session.activeFrameId;
                return (
                  <button
                    type="button"
                    key={`${layer.id}:${frame.id}`}
                    className={`cel-cell ${active ? 'is-active' : ''} ${frame.id === session.activeFrameId ? 'is-column' : ''} ${linked ? 'is-linked' : ''}`}
                    onClick={(event) => {
                      if (event.altKey && layer.type === 'layer') {
                        event.preventDefault();
                        event.stopPropagation();
                        if (linked) unlinkCel(store, layer.id, frame.id);
                        else toggleCelLink(store, layer.id, frame.id);
                        return;
                      }
                      store.setActiveLayer(layer.id);
                      store.setActiveFrame(frame.id);
                    }}
                    onDoubleClick={() => { store.setActiveLayer(layer.id); store.setActiveFrame(frame.id); }}
                    onAuxClick={(event) => {
                      if (event.button !== 1 || layer.type !== 'layer') return;
                      event.preventDefault();
                      if (linked) unlinkCel(store, layer.id, frame.id);
                      else toggleCelLink(store, layer.id, frame.id);
                    }}
                    title={linked
                      ? `${layer.name} · ${t('layers.celLinked')} · ${t('layers.unlinkHint')}`
                      : `${layer.name} · ${t('layers.celLinked')} · ${t('layers.linkHint')}`}
                    disabled={layer.type === 'group'}
                  >
                    {layer.type === 'layer' ? (
                      <span className="cel-thumb">
                        <CelThumb doc={doc} layer={layer} frameId={frame.id} size={Math.min(frameWidth - 12, 32)} revision={store.revision} />
                        {linked ? <span className="cel-link"><Icon name="link" size={9} /></span> : null}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Timeline;
