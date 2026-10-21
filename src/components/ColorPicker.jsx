import React, { useEffect, useRef, useState } from 'react';
import { parseHex, toHex, rgbToHsv, hsvToRgb, rgbToHsl, hslToRgb } from '../utils/color.js';
import { Segmented, Slider } from '../ui/controls.jsx';
import { useI18n } from '../ui/hooks.jsx';

const SV_W = 190;
const SV_H = 118;

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

/**
 * HSV colour picker with saturation/value field, hue and alpha sliders and
 * RGB/HSV/HSL numeric modes. Fully local and keyboard accessible.
 */
export function ColorPicker({ value = '#ffffffff', onChange, showAlpha = true }) {
  const { t } = useI18n();
  const [mode, setMode] = useState('hsv');
  const [hexDraft, setHexDraft] = useState(value);
  const svRef = useRef(null);
  const dragRef = useRef(false);
  const parsed = parseHex(value) || [0, 0, 0, 255];
  const [r, g, b, a] = parsed;
  const { h, s, v } = rgbToHsv(r, g, b);
  const { s: sl, l } = rgbToHsl(r, g, b);
  const current = toHex([r, g, b, a], true);
  const alpha = a / 255;

  useEffect(() => { setHexDraft(current); }, [current]);

  const emit = (rr, gg, bb, aa = a) => {
    onChange?.(toHex([clamp(rr, 0, 255) | 0, clamp(gg, 0, 255) | 0, clamp(bb, 0, 255) | 0, clamp(aa, 0, 255) | 0], true));
  };

  const emitHsv = (hh, ss, vv, aa = a) => {
    const [rr, gg, bb] = hsvToRgb(((hh % 360) + 360) % 360, clamp(ss, 0, 1), clamp(vv, 0, 1));
    emit(rr, gg, bb, aa);
  };

  const updateSv = (event) => {
    const rect = svRef.current.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    emitHsv(h, x, 1 - y);
  };

  const onSvPointerDown = (event) => {
    dragRef.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    updateSv(event);
  };
  const onSvPointerMove = (event) => {
    if (dragRef.current) updateSv(event);
  };
  const onSvPointerUp = () => { dragRef.current = false; };

  const validHex = (text) => {
    const clean = String(text).trim().replace(/^#/, '');
    return [3, 4, 6, 8].includes(clean.length) && /^[0-9a-f]+$/i.test(clean);
  };
  const commitHex = () => {
    if (!validHex(hexDraft)) {
      setHexDraft(current);
      return;
    }
    let clean = hexDraft.trim().replace(/^#/, '');
    if (clean.length === 3) clean += 'f';
    if (clean.length === 4) clean = clean.split('').map((c) => c + c).join('');
    if (clean.length === 6) clean += 'ff';
    const next = parseHex(clean);
    if (next) onChange?.(toHex(next, true));
  };

  const setChannel = (channel, number) => {
    const n = clamp(Number(number) || 0, 0, channel === 'a' ? 255 : 255);
    if (mode === 'rgb') {
      if (channel === 'r') emit(n, g, b);
      if (channel === 'g') emit(r, n, b);
      if (channel === 'b') emit(r, g, n);
      if (channel === 'a') emit(r, g, b, n);
    } else if (mode === 'hsv') {
      if (channel === 'h') emitHsv(n, s, v);
      if (channel === 's') emitHsv(h, n / 100, v);
      if (channel === 'v') emitHsv(h, s, n / 100);
      if (channel === 'a') emit(r, g, b, n);
    } else {
      if (channel === 'h') {
        const [rr, gg, bb] = hslToRgb(n, sl, l);
        emit(rr, gg, bb);
      }
      if (channel === 's') {
        const [rr, gg, bb] = hslToRgb(h, n / 100, l);
        emit(rr, gg, bb);
      }
      if (channel === 'l') {
        const [rr, gg, bb] = hslToRgb(h, sl, n / 100);
        emit(rr, gg, bb);
      }
      if (channel === 'a') emit(r, g, b, n);
    }
  };

  const fields = mode === 'rgb'
    ? [
        { key: 'r', label: 'R', value: r, max: 255 },
        { key: 'g', label: 'G', value: g, max: 255 },
        { key: 'b', label: 'B', value: b, max: 255 },
      ]
    : mode === 'hsv'
      ? [
          { key: 'h', label: 'H', value: Math.round(h), max: 360 },
          { key: 's', label: 'S', value: Math.round(s * 100), max: 100 },
          { key: 'v', label: 'V', value: Math.round(v * 100), max: 100 },
        ]
      : [
          { key: 'h', label: 'H', value: Math.round(h), max: 360 },
          { key: 's', label: 'S', value: Math.round(sl * 100), max: 100 },
          { key: 'l', label: 'L', value: Math.round(l * 100), max: 100 },
        ];

  const hueCss = `hsl(${Math.round(h)}, 100%, 50%)`;
  const cursorX = s * SV_W;
  const cursorY = (1 - v) * SV_H;

  return (
    <div className="color-picker">
      <div
        ref={svRef}
        className="sv-field"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueCss})` }}
        onPointerDown={onSvPointerDown}
        onPointerMove={onSvPointerMove}
        onPointerUp={onSvPointerUp}
        onPointerCancel={onSvPointerUp}
        role="slider"
        tabIndex={0}
        aria-label={t('colors.saturation')}
        aria-valuetext={`${Math.round(s * 100)}%, ${Math.round(v * 100)}%`}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') { event.preventDefault(); emitHsv(h, Math.max(0, s - 0.02), v); }
          if (event.key === 'ArrowRight') { event.preventDefault(); emitHsv(h, Math.min(1, s + 0.02), v); }
          if (event.key === 'ArrowUp') { event.preventDefault(); emitHsv(h, s, Math.min(1, v + 0.02)); }
          if (event.key === 'ArrowDown') { event.preventDefault(); emitHsv(h, s, Math.max(0, v - 0.02)); }
        }}
      >
        <span className="sv-cursor" style={{ left: cursorX, top: cursorY, borderColor: v > 0.6 && s < 0.4 ? '#111' : '#fff' }} />
      </div>

      <div className="color-sliders">
        <label className="hue-row">
          <span className="slider-glyph">H</span>
          <input
            type="range"
            min="0"
            max="360"
            value={Math.round(h)}
            className="hue-slider"
            onChange={(event) => emitHsv(Number(event.target.value), s, v)}
          />
        </label>
        {showAlpha ? (
          <label className="alpha-row">
            <span className="slider-glyph">A</span>
            <span className="alpha-track" style={{ backgroundImage: `linear-gradient(to right, transparent, ${toHex([r, g, b, 255], true)})` }}>
              <input
                type="range"
                min="0"
                max="255"
                value={a}
                onChange={(event) => emit(r, g, b, Number(event.target.value))}
              />
            </span>
            <span className="alpha-value">{a}</span>
          </label>
        ) : null}
      </div>

      <div className="color-mode-row">
        <Segmented
          value={mode}
          onChange={setMode}
          options={['rgb', 'hsv', 'hsl'].map((key) => ({ value: key, label: key.toUpperCase() }))}
        />
        <div className="hex-box">
          <span>#</span>
          <input
            value={hexDraft.replace(/^#/, '')}
            spellCheck={false}
            onChange={(event) => {
              setHexDraft(event.target.value);
              if (validHex(event.target.value)) {
                const clean = event.target.value.replace(/^#/, '');
                if (clean.length >= 6) {
                  const next = parseHex(clean);
                  if (next) onChange?.(toHex(next, true));
                }
              }
            }}
            onBlur={commitHex}
            onKeyDown={(event) => {
              if (event.key === 'Enter') { event.preventDefault(); commitHex(); event.currentTarget.blur(); }
              if (event.key === 'Escape') { setHexDraft(current); event.currentTarget.blur(); }
            }}
            aria-label={t('colors.hex')}
          />
        </div>
      </div>

      <div className={`channel-grid ${mode}`}>
        {fields.map((field) => (
          <label className="channel" key={field.key}>
            <span>{field.label}</span>
            <input
              type="number"
              min="0"
              max={field.max}
              value={field.value}
              onChange={(event) => setChannel(field.key, event.target.value)}
            />
          </label>
        ))}
        {showAlpha ? (
          <label className="channel">
            <span>A</span>
            <input type="number" min="0" max="255" value={a} onChange={(event) => setChannel('a', event.target.value)} />
          </label>
        ) : null}
      </div>

      <div className="alpha-preview" style={{ backgroundImage: `linear-gradient(45deg, #444 25%, transparent 25%), linear-gradient(-45deg, #444 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #444 75%), linear-gradient(-45deg, transparent 75%, #444 75%)`, backgroundColor: '#222' }}>
        <span style={{ background: current }} />
      </div>
    </div>
  );
}

export default ColorPicker;
