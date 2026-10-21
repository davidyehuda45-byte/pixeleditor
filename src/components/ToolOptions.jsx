import React from 'react';
import { useStore, useI18n } from '../ui/hooks.jsx';
import { Icon } from './Icon.jsx';
import { Button, NumberInput, Segmented, Select, Slider, Toggle } from '../ui/controls.jsx';
import { FONT_STYLES } from '../tools/fonts.js';

function Group({ label, children, wide = false }) {
  return (
    <div className={`option-group ${wide ? 'is-wide' : ''}`}>
      {label ? <span className="option-label">{label}</span> : null}
      <div className="option-control">{children}</div>
    </div>
  );
}

function BrushPreview({ size, shape, color }) {
  const px = Math.max(1, Math.min(16, size || 1));
  const cells = [];
  for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) {
    let inside = true;
    if (shape === 'round' && px > 2) {
      const dx = (x + 0.5 - px / 2) / (px / 2);
      const dy = (y + 0.5 - px / 2) / (px / 2);
      inside = dx * dx + dy * dy <= 1.05;
    }
    if (inside) cells.push(<span key={`${x}-${y}`} style={{ left: `${(x / px) * 100}%`, top: `${(y / px) * 100}%`, width: `${100 / px}%`, height: `${100 / px}%`, background: color }} />);
  }
  return <div className="brush-preview" title={`${size}px`}>{cells}</div>;
}

export function ToolOptions({ engine }) {
  const store = useStore();
  const { t } = useI18n();
  const ui = store.ui;
  const tool = ui.tool;
  const set = (patch) => store.setUI(patch);
  const doc = store.doc;
  const session = store.activeSession;
  const isBrush = ['pencil', 'brush', 'eraser', 'shade', 'spray'].includes(tool);
  const isShape = ['line', 'rect', 'ellipse', 'polygon', 'curve'].includes(tool);
  const isSelection = ['select-rect', 'select-ellipse', 'lasso', 'polygon-lasso'].includes(tool);

  const symmetryOptions = [
    { value: 'none', label: t('options.symmetryNone') },
    { value: 'h', label: t('options.symmetryH') },
    { value: 'v', label: t('options.symmetryV') },
    { value: 'both', label: t('options.symmetryBoth') },
    { value: 'radial', label: t('options.symmetryRadial') },
  ];
  const ditherOptions = [
    { value: 'none', label: t('options.ditherNone') },
    { value: 'checker', label: t('options.checker') },
    { value: 'bayer2', label: t('options.bayer2') },
    { value: 'bayer4', label: t('options.bayer4') },
    { value: 'bayer8', label: t('options.bayer8') },
    { value: 'lines', label: t('options.lines') },
    { value: 'dots', label: t('options.dots') },
  ];
  const selectionOptions = [
    { value: 'replace', label: t('selection.replace'), icon: 'square' },
    { value: 'add', label: t('selection.add'), icon: 'plus' },
    { value: 'subtract', label: t('selection.subtract'), icon: 'minus' },
    { value: 'intersect', label: t('selection.intersect'), icon: 'target' },
  ];

  const brushSize = () => (
    <Group label={t('options.brushSize')}>
      <NumberInput value={ui.brushSize} min={1} max={64} onChange={(value) => set({ brushSize: value })} className="num-small" />
      <BrushPreview size={ui.brushSize} shape={ui.brushShape} color={ui.primary} />
    </Group>
  );

  const brushShape = () => (
    <Group label={t('options.brushShape')}>
      <Segmented
        value={ui.brushShape}
        onChange={(value) => set({ brushShape: value })}
        options={[
          { value: 'round', label: t('options.round'), icon: 'circle' },
          { value: 'square', label: t('options.square'), icon: 'square' },
        ]}
      />
    </Group>
  );

  const symmetry = () => (
    <Group label={t('options.symmetry')}>
      <Select value={ui.symmetry} onChange={(value) => set({ symmetry: value })} options={symmetryOptions} className="select-compact" />
      {ui.symmetry === 'radial' ? (
        <NumberInput value={ui.symmetrySlices} min={2} max={32} onChange={(value) => set({ symmetrySlices: value })} className="num-tiny" aria-label={t('options.slices')} />
      ) : null}
    </Group>
  );

  const brushOptions = () => (
    <>
      {brushSize()}
      {brushShape()}
      <Group label={t('options.pressure')}>
        <Toggle checked={ui.pressureSize} onChange={(value) => set({ pressureSize: value })} label={t('options.pressure')} />
      </Group>
      <Group label={t('common.opacity')}>
        <Slider value={Math.round((ui.brushOpacity / 255) * 100)} onChange={(value) => set({ brushOpacity: Math.round((value / 100) * 255) })} min={1} max={100} suffix="%" />
      </Group>
      <Group>
        <Toggle checked={ui.pixelPerfect} onChange={(value) => set({ pixelPerfect: value })} label={t('options.pixelPerfect')} />
      </Group>
      {symmetry()}
      <Group>
        <Toggle checked={ui.tiled} onChange={(value) => set({ tiled: value })} label={t('options.tiled')} />
      </Group>
      <Group>
        <Toggle checked={ui.lockAlpha} onChange={(value) => set({ lockAlpha: value })} label={t('options.lockAlpha')} />
      </Group>
    </>
  );

  const renderOptions = () => {
    switch (tool) {
      case 'pencil':
      case 'brush':
        return brushOptions();
      case 'eraser':
        return (
          <>
            {brushSize()}
            {brushShape()}
            <Group label={t('options.eraserMode')}>
              <Segmented
                value={ui.eraserMode}
                onChange={(value) => set({ eraserMode: value })}
                options={[
                  { value: 'transparent', label: t('options.eraserTransparent') },
                  { value: 'background', label: t('options.eraserBackground') },
                ]}
              />
            </Group>
            <Group>
              <Toggle checked={ui.pixelPerfect} onChange={(value) => set({ pixelPerfect: value })} label={t('options.pixelPerfect')} />
            </Group>
            {symmetry()}
            <Group><Toggle checked={ui.tiled} onChange={(value) => set({ tiled: value })} label={t('options.tiled')} /></Group>
            <Group><Toggle checked={ui.lockAlpha} onChange={(value) => set({ lockAlpha: value })} label={t('options.lockAlpha')} /></Group>
          </>
        );
      case 'spray':
        return (
          <>
            {brushSize()}
            <Group label={t('options.sprayDensity')}>
              <NumberInput value={ui.sprayDensity} min={1} max={64} onChange={(value) => set({ sprayDensity: value })} className="num-small" />
            </Group>
            <Group label={t('common.opacity')}>
              <Slider value={Math.round((ui.brushOpacity / 255) * 100)} onChange={(value) => set({ brushOpacity: Math.round((value / 100) * 255) })} min={1} max={100} suffix="%" />
            </Group>
            {symmetry()}
            <Group><Toggle checked={ui.tiled} onChange={(value) => set({ tiled: value })} label={t('options.tiled')} /></Group>
          </>
        );
      case 'shade':
        return (
          <>
            {brushSize()}
            <Group label={t('options.density')}>
              <Slider value={Math.round((ui.shadeStrength ?? 0.25) * 100)} onChange={(value) => set({ shadeStrength: value / 100 })} min={1} max={100} suffix="%" />
            </Group>
            <Group label={t('options.dither')}>
              <Select value={ui.dither} onChange={(value) => set({ dither: value })} options={ditherOptions} className="select-compact" />
            </Group>
            {symmetry()}
            <Group><Toggle checked={ui.tiled} onChange={(value) => set({ tiled: value })} label={t('options.tiled')} /></Group>
          </>
        );
      case 'fill':
        return (
          <>
            <Group label={t('options.fillMode')}>
              <Segmented
                value={ui.fillMode}
                onChange={(value) => set({ fillMode: value })}
                options={[
                  { value: 'solid', label: t('options.solid') },
                  { value: 'dither', label: t('options.pattern') },
                ]}
              />
            </Group>
            {ui.fillMode === 'dither' ? (
              <Group label={t('options.dither')}>
                <Select value={ui.dither} onChange={(value) => set({ dither: value })} options={ditherOptions} className="select-compact" />
              </Group>
            ) : null}
            <Group>
              <Toggle checked={ui.contiguous} onChange={(value) => set({ contiguous: value })} label={t('options.contiguous')} />
            </Group>
            <Group label={t('options.source')}>
              <Select
                value={ui.fillSource}
                onChange={(value) => set({ fillSource: value })}
                options={[
                  { value: 'layer', label: t('options.sourceLayer') },
                  { value: 'composite', label: t('options.sourceComposite') },
                ]}
                className="select-compact"
              />
            </Group>
            <Group label={t('options.tolerance')}>
              <Slider value={ui.tolerance} onChange={(value) => set({ tolerance: value })} min={0} max={255} />
            </Group>
            <Group>
              <Toggle checked={ui.lockAlpha} onChange={(value) => set({ lockAlpha: value })} label={t('options.lockAlpha')} />
            </Group>
          </>
        );
      case 'gradient':
        return (
          <>
            <Group label={t('options.gradientType')}>
              <Segmented
                value={ui.gradientType}
                onChange={(value) => set({ gradientType: value })}
                options={[
                  { value: 'linear', label: t('options.linear') },
                  { value: 'radial', label: t('options.radial') },
                ]}
              />
            </Group>
            <Group>
              <Toggle checked={ui.gradientSnapPalette} onChange={(value) => set({ gradientSnapPalette: value })} label={t('options.snapPalette')} />
            </Group>
            <Group label={t('options.dither')}>
              <Select value={ui.dither} onChange={(value) => set({ dither: value })} options={ditherOptions} className="select-compact" />
            </Group>
            <Group label={t('common.opacity')}>
              <Slider value={Math.round((ui.brushOpacity / 255) * 100)} onChange={(value) => set({ brushOpacity: Math.round((value / 100) * 255) })} min={1} max={100} suffix="%" />
            </Group>
          </>
        );
      case 'line':
      case 'rect':
      case 'rounded-rect':
      case 'ellipse':
        return (
          <>
            {brushSize()}
            {tool !== 'line' ? (
              <Group>
                <Toggle checked={ui.shapeFill} onChange={(value) => set({ shapeFill: value })} label={t('options.shapeFill')} />
              </Group>
            ) : null}
            <Group label={t('options.thickness')}>
              <NumberInput value={ui.shapeThickness} min={1} max={32} onChange={(value) => set({ shapeThickness: value })} className="num-small" />
            </Group>
            <Group>
              <Toggle checked={ui.pixelPerfect} onChange={(value) => set({ pixelPerfect: value })} label={t('options.pixelPerfect')} />
            </Group>
            {symmetry()}
          </>
        );
      case 'polygon':
        return (
          <>
            {brushSize()}
            <Group>
              <Toggle checked={ui.shapeFill} onChange={(value) => set({ shapeFill: value })} label={t('options.shapeFill')} />
            </Group>
            <Group label={t('options.thickness')}>
              <NumberInput value={ui.shapeThickness} min={1} max={32} onChange={(value) => set({ shapeThickness: value })} className="num-small" />
            </Group>
            <span className="option-hint">{t('options.hintPolygon')}</span>
          </>
        );
      case 'curve':
        return (
          <>
            {brushSize()}
            <Group label={t('options.curveType')}>
              <Segmented
                value={ui.curveType}
                onChange={(value) => set({ curveType: value })}
                options={[
                  { value: 'quadratic', label: t('options.quadratic') },
                  { value: 'cubic', label: t('options.cubic') },
                ]}
              />
            </Group>
            <Group>
              <Toggle checked={ui.shapeFill} onChange={(value) => set({ shapeFill: value })} label={t('options.shapeFill')} />
            </Group>
            <span className="option-hint">{t('options.hintCurve')}</span>
          </>
        );
      case 'picker':
        return (
          <Group label={t('options.source')}>
            <Segmented
              value={ui.pickerSource}
              onChange={(value) => set({ pickerSource: value })}
              options={[
                { value: 'layer', label: t('options.sourceLayer') },
                { value: 'composite', label: t('options.sourceComposite') },
              ]}
            />
          </Group>
        );
      case 'wand':
        return (
          <>
            <Group>
              <Toggle checked={ui.selectWandContiguous} onChange={(value) => set({ selectWandContiguous: value })} label={t('options.contiguous')} />
            </Group>
            <Group label={t('options.connectivity')}>
              <Segmented
                value={ui.selectWandConnectivity}
                onChange={(value) => set({ selectWandConnectivity: Number(value) })}
                options={[{ value: 4, label: '4' }, { value: 8, label: '8' }]}
              />
            </Group>
            <Group label={t('options.tolerance')}>
              <Slider value={ui.tolerance} onChange={(value) => set({ tolerance: value })} min={0} max={255} />
            </Group>
            <Group label={t('options.source')}>
              <Select
                value={ui.fillSource}
                onChange={(value) => set({ fillSource: value })}
                options={[
                  { value: 'layer', label: t('options.sourceLayer') },
                  { value: 'composite', label: t('options.sourceComposite') },
                ]}
                className="select-compact"
              />
            </Group>
          </>
        );
      case 'select-rect':
      case 'select-ellipse':
      case 'lasso':
      case 'polygon-lasso':
        return (
          <>
            <Group label={t('options.selectionOnly')}>
              <Segmented value={ui.selectionMode || 'replace'} onChange={(value) => set({ selectionMode: value })} options={selectionOptions} />
            </Group>
            {tool === 'polygon-lasso' ? <span className="option-hint">{t('options.hintPolygon')}</span> : null}
            <Group>
              <Button variant="ghost" size="sm" icon="target" onClick={() => store.setDialog({ type: 'growSelection' })}>{t('menu.growSelection')}</Button>
            </Group>
          </>
        );
      case 'move':
        return (
          <span className="option-hint">
            {store.ui.language === 'en'
              ? 'Drag pixels or the selection. Arrow keys nudge; Shift+Arrows move 8 px.'
              : 'Seret piksel atau seleksi. Tombol panah menggeser 1 px; Shift+panah 8 px.'}
          </span>
        );
      case 'text':
        return (
          <>
            <Group label={t('options.font')}>
              <Select
                value={ui.textFont}
                onChange={(value) => set({ textFont: value })}
                options={Object.keys(FONT_STYLES).map((key) => ({ value: key, label: FONT_STYLES[key].label || key }))}
                className="select-compact"
              />
            </Group>
            <Group label={t('options.thickness')}>
              <NumberInput value={ui.textSize} min={1} max={8} onChange={(value) => set({ textSize: value })} className="num-small" />
            </Group>
            <Group label={t('options.align')}>
              <Segmented
                value={ui.textAlign}
                onChange={(value) => set({ textAlign: value })}
                options={[
                  { value: 'left', icon: 'align-left', title: t('options.left') },
                  { value: 'center', icon: 'align-center', title: t('options.center') },
                  { value: 'right', icon: 'align-right', title: t('options.right') },
                ]}
              />
            </Group>
            <Group>
              <Button
                variant="primary"
                size="sm"
                icon="type"
                onClick={() => {
                  if (!session) return;
                  store.setDialog({
                    type: 'text',
                    x: Math.floor(doc.width / 2),
                    y: Math.floor(doc.height / 2),
                    layerId: session.activeLayerId,
                    frameId: session.activeFrameId,
                    color: ui.primary,
                  });
                }}
              >
                {t('dialog.text.insert')}
              </Button>
            </Group>
          </>
        );
      default:
        return <span className="option-hint">{t('options.title')}</span>;
    }
  };

  return (
    <div className="tool-options" aria-label={t('options.title')}>
      <div className="current-tool">
        <span className="current-tool-icon"><Icon name={TOOL_ICONS[tool] || 'pencil'} size={16} /></span>
        <span>{t(`tool.${tool}`)}</span>
      </div>
      <div className="tool-options-scroll">{renderOptions()}</div>
      <div className="tool-options-tail">
        <button type="button" className={`mini-toggle ${ui.snapToGrid ? 'is-active' : ''}`} onClick={() => set({ snapToGrid: !ui.snapToGrid })} title={t('options.gridSnap')}>
          <Icon name="grid" size={14} /><span>{t('options.snap')}</span>
        </button>
      </div>
    </div>
  );
}

const TOOL_ICONS = {
  pencil: 'pencil', brush: 'brush', eraser: 'eraser', picker: 'eyedropper', fill: 'bucket',
  gradient: 'gradient', shade: 'shade', spray: 'spray', line: 'line', rect: 'square',
  ellipse: 'circle', polygon: 'polygon', curve: 'curve', 'rounded-rect': 'rounded-square', 'select-rect': 'marquee',
  'select-ellipse': 'circle', lasso: 'lasso', 'polygon-lasso': 'polygon', wand: 'wand',
  move: 'move', hand: 'hand', zoom: 'zoom', text: 'type',
};

export default ToolOptions;
