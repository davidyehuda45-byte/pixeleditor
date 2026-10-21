import React, { useEffect, useRef, useState } from 'react';
import { useI18n, useStore } from '../../ui/hooks.jsx';
import { Modal, FormGrid, InfoNote } from './Modal.jsx';
import { Button, Field, NumberInput, Select, Segmented } from '../../ui/controls.jsx';
import { FONT_STYLES, renderText, measureText } from '../../tools/fonts.js';
import { insertBitmapText } from '../../tools/textActions.js';
import { parseHex } from '../../utils/color.js';

export function TextDialog({ x, y, layerId, onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const doc = store.doc;
  const [text, setText] = useState('');
  const [font, setFont] = useState(store.ui.textFont || '5x7');
  const [size, setSize] = useState(store.ui.textSize || 1);
  const [align, setAlign] = useState(store.ui.textAlign || 'left');
  const [posX, setPosX] = useState(x ?? Math.floor((doc?.width || 32) / 2));
  const [posY, setPosY] = useState(y ?? Math.floor((doc?.height || 32) / 2));
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const metrics = measureText(text || 'Teks', { font, scale: size });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const color = parseHex(store.ui.primary || '#ffffff');
    const preview = renderText(text || t('dialog.text.placeholder'), { font, scale: size, align, color });
    canvas.width = Math.max(1, preview.width);
    canvas.height = Math.max(1, preview.height);
    const ctx = canvas.getContext('2d');
    const image = ctx.createImageData(canvas.width, canvas.height);
    image.data.set(preview.data);
    ctx.putImageData(image, 0, 0);
  }, [text, font, size, align, store.ui.primary, t]);

  const insert = () => {
    if (!text.trim()) {
      setError(t('dialog.text.empty'));
      return;
    }
    const result = insertBitmapText(store, {
      text,
      x: posX,
      y: posY,
      font,
      scale: size,
      align,
      color: store.ui.primary,
      layerId: layerId || store.activeSession?.activeLayerId,
      frameId: store.activeSession?.activeFrameId,
    });
    if (result?.ok) onClose();
    else setError(t('dialog.text.failed'));
  };

  return (
    <Modal
      title={t('dialog.text.title')}
      icon="type"
      onClose={onClose}
      size="md"
      footer={(
        <>
          <span className="modal-footer-note">{t('dialog.text.hint')}</span>
          <span className="modal-footer-spacer" />
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" icon="type" onClick={insert} disabled={!text.trim()}>{t('dialog.text.insert')}</Button>
        </>
      )}
    >
      <Field label={t('dialog.text.content')} hint={t('dialog.text.hint')}>
        <textarea
          className="text-textarea"
          rows={4}
          autoFocus
          value={text}
          placeholder={t('dialog.text.placeholder')}
          onChange={(event) => { setText(event.target.value); setError(''); }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              insert();
            }
          }}
        />
      </Field>
      <FormGrid>
        <Field label={t('dialog.text.font')}>
          <Select
            value={font}
            onChange={setFont}
            options={Object.values(FONT_STYLES).map((style) => ({ value: style.id, label: style.label }))}
          />
        </Field>
        <Field label={t('dialog.text.size')}>
          <NumberInput value={size} min={1} max={8} onChange={setSize} />
        </Field>
        <Field label={t('dialog.text.align')}>
          <Segmented
            value={align}
            onChange={setAlign}
            options={[
              { value: 'left', icon: 'align-left', title: t('options.left') },
              { value: 'center', icon: 'align-center', title: t('options.center') },
              { value: 'right', icon: 'align-right', title: t('options.right') },
            ]}
          />
        </Field>
        <Field label={t('dialog.text.position')}>
          <div className="pair-inputs">
            <NumberInput value={posX} min={-1024} max={1024} onChange={setPosX} aria-label="X" />
            <NumberInput value={posY} min={-1024} max={1024} onChange={setPosY} aria-label="Y" />
          </div>
        </Field>
      </FormGrid>
      <div className="text-preview-pane">
        <span className="text-preview-label">{t('dialog.text.preview')}</span>
        <div className="text-preview-canvas-wrap">
          <canvas ref={canvasRef} className="text-preview-canvas" />
        </div>
        <span className="text-preview-meta">{metrics.width} × {metrics.height} px · {t('common.alpha')} 255</span>
      </div>
      {error ? <InfoNote icon="warning" tone="error">{error}</InfoNote> : null}
    </Modal>
  );
}
