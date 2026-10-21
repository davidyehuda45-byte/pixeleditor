import React, { useEffect, useRef, useState } from 'react';
import { useStore, useI18n } from '../../ui/hooks.jsx';
import { Button, IconButton, Select } from '../../ui/controls.jsx';
import { Modal } from './Modal.jsx';
import { Icon } from '../Icon.jsx';
import { BIOME_PRESETS, remapBiome } from '../../core/effects/biomeRemap.js';
import { renderComposite } from '../../core/compositor.js';

export function BiomeDialog({ onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const doc = store.doc;
  const canvasRef = useRef(null);

  const [selectedPreset, setSelectedPreset] = useState('fire');
  const [scope, setScope] = useState('current'); // 'current' | 'layer' | 'all'
  const [duplicateVariant, setDuplicateVariant] = useState(false);

  // Live preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !doc) return;
    const ctx = canvas.getContext('2d');
    const comp = renderComposite(doc, store.activeFrameId);
    const source = comp?.data || comp;
    const remapped = remapBiome(source, selectedPreset);

    canvas.width = doc.width;
    canvas.height = doc.height;
    const imgData = new ImageData(remapped, doc.width, doc.height);
    ctx.putImageData(imgData, 0, 0);
  }, [doc, store.activeFrameId, selectedPreset]);

  if (!doc) return null;

  const handleApply = () => {
    store.transact(t('biome.applyUndo', { preset: selectedPreset }), () => {
      const activeLayerId = store.activeLayerId;
      const activeFrameId = store.activeFrameId;

      const layersToProcess = scope === 'all'
        ? doc.layers.filter(l => l.visible && !l.isGroup)
        : doc.layers.filter(l => l.id === activeLayerId);

      const framesToProcess = scope === 'current'
        ? doc.frames.filter(f => f.id === activeFrameId)
        : doc.frames;

      for (const frame of framesToProcess) {
        for (const layer of layersToProcess) {
          const cel = doc.celAt(layer.id, frame.id);
          if (!cel || !cel.pixels) continue;
          const remappedPixels = remapBiome(cel.pixels, selectedPreset);
          cel.pixels.set(remappedPixels);
        }
      }

      // If user checked "duplicate as new variant", create a new animation tag
      if (duplicateVariant && doc.tags.length > 0) {
        const activeTag = doc.tagAt(store.activeFrameIndex);
        if (activeTag) {
          const newTagName = `${activeTag.name}_${selectedPreset}`;
          doc.addTag({
            name: newTagName,
            from: activeTag.from,
            to: activeTag.to,
            direction: activeTag.direction,
          });
        }
      }
    });

    store.toast(t('biome.appliedSuccess', { preset: selectedPreset }), 'success');
    onClose();
  };

  return (
    <Modal title={t('biome.title')} onClose={onClose} width={580} className="biome-modal">
      <div className="biome-dialog-content">
        <div className="biome-presets-panel">
          <label className="biome-section-label">{t('biome.chooseElement')}</label>
          <div className="biome-presets-grid">
            {BIOME_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`biome-preset-card ${selectedPreset === p.id ? 'is-active' : ''}`}
                onClick={() => setSelectedPreset(p.id)}
              >
                <span className="biome-preset-color" style={{ background: p.color }} />
                <div className="biome-preset-info">
                  <strong>{t(p.nameKey)}</strong>
                  <span>{t(p.descKey)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="biome-preview-panel">
          <label className="biome-section-label">{t('common.preview')}</label>
          <div className="biome-canvas-wrap">
            <canvas
              ref={canvasRef}
              className="biome-canvas"
              style={{
                imageRendering: 'pixelated',
                width: Math.min(180, Math.max(96, doc.width * 4)),
                height: Math.min(180, Math.max(96, doc.height * 4)),
              }}
            />
          </div>

          <div className="biome-options">
            <label className="biome-label">{t('biome.scope')}</label>
            <Select
              value={scope}
              onChange={setScope}
              options={[
                { value: 'current', label: t('biome.scopeCurrent') },
                { value: 'layer', label: t('biome.scopeLayer') },
                { value: 'all', label: t('biome.scopeAll') },
              ]}
            />

            <label className="checkbox-row" style={{ marginTop: 8 }}>
              <input
                type="checkbox"
                checked={duplicateVariant}
                onChange={(e) => setDuplicateVariant(e.target.checked)}
              />
              <span>{t('biome.tagVariantOption')}</span>
            </label>
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="primary" icon="sparkles" onClick={handleApply}>
          {t('biome.applyBtn')}
        </Button>
      </div>
    </Modal>
  );
}

export default BiomeDialog;
