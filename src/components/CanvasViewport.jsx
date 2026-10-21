import React, { useEffect, useRef } from 'react';
import { useStore } from '../ui/hooks.jsx';
import { renderComposite } from '../core/compositor.js';
import { setDocumentProps } from '../core/commands.js';
import { toHex } from '../utils/color.js';

const RULER = 18;
const ZOOM_STEPS = [0.5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function nextZoom(current, direction) {
  if (direction > 0) return ZOOM_STEPS.find((z) => z > current + 0.001) || ZOOM_STEPS[ZOOM_STEPS.length - 1];
  const lower = [...ZOOM_STEPS].reverse().find((z) => z < current - 0.001);
  return lower || ZOOM_STEPS[0];
}

function colorFromHex(hex, fallback) {
  const value = String(hex || '').replace('#', '');
  if (![3, 4, 6, 8].includes(value.length)) return fallback;
  return `#${value.slice(0, value.length === 4 ? 3 : value.length === 8 ? 6 : value.length)}`;
}

function guideAxis(guide) {
  if (!guide) return null;
  if (guide.orientation === 'vertical' || guide.axis === 'x' || guide.type === 'vertical') return 'x';
  if (guide.orientation === 'horizontal' || guide.axis === 'y' || guide.type === 'horizontal') return 'y';
  if (typeof guide.x === 'number') return 'x';
  if (typeof guide.y === 'number') return 'y';
  return null;
}

function guidePosition(guide) {
  if (typeof guide.position === 'number') return guide.position;
  if (typeof guide.pos === 'number') return guide.pos;
  if (typeof guide.x === 'number') return guide.x;
  if (typeof guide.y === 'number') return guide.y;
  return 0;
}

/**
 * The canvas viewport: checkerboard, zoom/pan, rulers, guides, grid, onion
 * skin, selection ants and pointer routing into the framework-free ToolEngine.
 */
export function CanvasViewport({ engine, apiRef }) {
  const store = useStore();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const localRef = useRef({ zoom: 8, panX: 0, panY: 0 });
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });
  const compositeRef = useRef(null);
  const offscreenRef = useRef(null);
  const onionCanvasRef = useRef(null);
  const checkerRef = useRef({ canvas: null, key: '' });
  const pointerRef = useRef({ inside: false, x: 0, y: 0, screenX: 0, screenY: 0 });
  const panRef = useRef(null);
  const spaceRef = useRef(false);
  const touchRef = useRef({ pointers: new Map(), pinch: null });
  const wheelRef = useRef({ delta: 0, last: 0 });
  const wheelHandlerRef = useRef(null);
  const panCursorRef = useRef(false);
  const antsRef = useRef(0);
  const guideDragRef = useRef(null);
  const drawQueuedRef = useRef(0);
  const fitRef = useRef(() => {});
  const apiRefLocal = apiRef || { current: null };

  const doc = store.doc;
  const session = store.activeSession;
  const ui = store.ui;

  const layout = () => {
    const { width, height } = sizeRef.current;
    const vw = Math.max(1, width - RULER);
    const vh = Math.max(1, height - RULER);
    return { width, height, vw, vh };
  };

  const docRect = () => {
    if (!doc) return { x: RULER, y: RULER, w: 1, h: 1 };
    const { vw, vh } = layout();
    const zoom = localRef.current.zoom;
    const w = doc.width * zoom;
    const h = doc.height * zoom;
    return {
      x: RULER + vw / 2 + localRef.current.panX - w / 2,
      y: RULER + vh / 2 + localRef.current.panY - h / 2,
      w, h,
    };
  };

  const screenToDoc = (screenX, screenY) => {
    const rect = docRect();
    const zoom = localRef.current.zoom;
    return {
      x: Math.floor((screenX - rect.x) / zoom),
      y: Math.floor((screenY - rect.y) / zoom),
      exactX: (screenX - rect.x) / zoom,
      exactY: (screenY - rect.y) / zoom,
    };
  };

  const snap = (point) => {
    if (!doc) return point;
    let x = point.exactX;
    let y = point.exactY;
    const threshold = 4 / localRef.current.zoom;
    if (store.ui.snapToGuides && store.ui.showGuides) {
      for (const guide of doc.guides || []) {
        const axis = guideAxis(guide);
        const pos = guidePosition(guide);
        if (axis === 'x' && Math.abs(x - pos) <= threshold) x = pos;
        if (axis === 'y' && Math.abs(y - pos) <= threshold) y = pos;
      }
    }
    if (store.ui.snapToGrid) {
      const gw = Math.max(1, doc.grid?.w || 1);
      const gh = Math.max(1, doc.grid?.h || 1);
      x = Math.round(x / gw) * gw;
      y = Math.round(y / gh) * gh;
    }
    return { x: Math.floor(x), y: Math.floor(y), exactX: x, exactY: y };
  };

  const persistView = () => {
    if (!session) return;
    session.view.zoom = localRef.current.zoom;
    session.view.panX = localRef.current.panX;
    session.view.panY = localRef.current.panY;
    store.setView({ zoom: session.view.zoom, panX: session.view.panX, panY: session.view.panY });
  };

  const fit = () => {
    if (!doc) return;
    const { vw, vh } = layout();
    const raw = Math.min((vw - 32) / doc.width, (vh - 32) / doc.height);
    const z = raw >= 1 ? Math.max(1, Math.min(64, Math.floor(raw))) : Math.max(0.5, Math.min(1, Math.floor(raw * 2) / 2));
    localRef.current = { zoom: z, panX: 0, panY: 0 };
    if (session) session.view.fitted = true;
    persistView();
    scheduleDraw();
    store.emit('viewport:zoom', { zoom: z });
  };

  const actual = () => {
    localRef.current = { ...localRef.current, zoom: 1, panX: 0, panY: 0 };
    if (session) session.view.fitted = false;
    persistView();
    scheduleDraw();
    store.emit('viewport:zoom', { zoom: 1 });
  };

  const center = () => {
    localRef.current = { ...localRef.current, panX: 0, panY: 0 };
    persistView();
    scheduleDraw();
  };

  const zoomAtScreen = (screenX, screenY, newZoom) => {
    if (!doc) return;
    const z = clamp(newZoom, 0.5, 64);
    const { vw, vh } = layout();
    const before = screenToDoc(screenX, screenY).exactX;
    const beforeY = screenToDoc(screenX, screenY).exactY;
    localRef.current.zoom = z;
    const px = screenX - RULER;
    const py = screenY - RULER;
    localRef.current.panX = px - vw / 2 - (before - doc.width / 2) * z;
    localRef.current.panY = py - vh / 2 - (beforeY - doc.height / 2) * z;
    if (session) session.view.fitted = false;
    persistView();
    scheduleDraw();
    store.emit('viewport:zoom', { zoom: z });
  };

  const zoomBy = (factor) => {
    const direction = factor >= 1 ? 1 : -1;
    const target = nextZoom(localRef.current.zoom, direction);
    const { width, height } = sizeRef.current;
    zoomAtScreen(RULER + (width - RULER) / 2, RULER + (height - RULER) / 2, target);
  };

  apiRefLocal.current = { fit, actual, center, zoomBy, zoomAtScreen, screenToDoc, refresh: () => scheduleDraw(), getCompositePixels: () => compositeRef.current };

  const makeChecker = (ctx) => {
    const cell = clamp(ui.checkerSize || 8, 2, 32);
    const key = `${ui.checkerColorA}|${ui.checkerColorB}|${cell}|${ui.theme}`;
    if (checkerRef.current.key !== key) {
      const canvas = document.createElement('canvas');
      canvas.width = cell * 2;
      canvas.height = cell * 2;
      const c = canvas.getContext('2d');
      c.fillStyle = colorFromHex(ui.checkerColorA, '#20222c');
      c.fillRect(0, 0, cell * 2, cell * 2);
      c.fillStyle = colorFromHex(ui.checkerColorB, '#2a2d3a');
      c.fillRect(0, 0, cell, cell);
      c.fillRect(cell, cell, cell, cell);
      checkerRef.current = { canvas, key };
    }
    return ctx.createPattern(checkerRef.current.canvas, 'repeat');
  };

  const scheduleDraw = () => {
    if (!onionCanvasRef.current) onionCanvasRef.current = document.createElement('canvas');
    if (drawQueuedRef.current) return;
    drawQueuedRef.current = requestAnimationFrame(() => {
      drawQueuedRef.current = 0;
      draw();
    });
  };

  const drawOnionFrame = (ctx, frameId, rect, tint, opacity) => {
    if (!doc) return;
    const tmp = onionCanvasRef.current;
    if (!tmp) return;
    tmp.width = doc.width;
    tmp.height = doc.height;
    const tctx = tmp.getContext('2d');
    const comp = renderComposite(doc, frameId);
    tctx.clearRect(0, 0, doc.width, doc.height);
    tctx.putImageData(new ImageData(comp.data, doc.width, doc.height), 0, 0);
    if (tint) {
      tctx.globalCompositeOperation = 'source-atop';
      tctx.globalAlpha = 0.45;
      tctx.fillStyle = tint;
      tctx.fillRect(0, 0, doc.width, doc.height);
      tctx.globalCompositeOperation = 'source-over';
      tctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  };

  const drawSelection = (ctx) => {
    if (!doc?.selection || doc.selection.empty) return;
    const rect = docRect();
    const zoom = localRef.current.zoom;
    const mask = doc.selection.mask;
    const path = new Path2D();
    let has = false;
    for (let y = 0; y < doc.height; y++) for (let x = 0; x < doc.width; x++) {
      if (!mask[y * doc.width + x]) continue;
      has = true;
      const left = rect.x + x * zoom;
      const top = rect.y + y * zoom;
      if (x === 0 || !mask[y * doc.width + x - 1]) { path.moveTo(left, top); path.lineTo(left, top + zoom); }
      if (x === doc.width - 1 || !mask[y * doc.width + x + 1]) { path.moveTo(left + zoom, top); path.lineTo(left + zoom, top + zoom); }
      if (y === 0 || !mask[(y - 1) * doc.width + x]) { path.moveTo(left, top); path.lineTo(left + zoom, top); }
      if (y === doc.height - 1 || !mask[(y + 1) * doc.width + x]) { path.moveTo(left, top + zoom); path.lineTo(left + zoom, top + zoom); }
    }
    if (!has) return;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = ui.theme === 'light' ? '#ffffff' : '#000000';
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -antsRef.current;
    ctx.stroke(path);
    ctx.strokeStyle = ui.theme === 'light' ? '#000000' : '#ffffff';
    ctx.lineDashOffset = -antsRef.current + 4;
    ctx.stroke(path);
    ctx.restore();
  };

  const drawSelectionPreview = (ctx) => {
    const preview = engine.selectionPreview;
    if (!preview) return;
    const rect = docRect();
    const zoom = localRef.current.zoom;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -antsRef.current;
    ctx.strokeStyle = ui.theme === 'light' ? '#15151f' : '#ffffff';
    ctx.beginPath();
    if (preview.type === 'rect') {
      const x = Math.min(preview.start[0], preview.end[0]);
      const y = Math.min(preview.start[1], preview.end[1]);
      const w = Math.abs(preview.end[0] - preview.start[0]) + 1;
      const h = Math.abs(preview.end[1] - preview.start[1]) + 1;
      ctx.rect(rect.x + x * zoom + 0.5, rect.y + y * zoom + 0.5, w * zoom, h * zoom);
    } else if (preview.type === 'ellipse') {
      const x0 = Math.min(preview.start[0], preview.end[0]);
      const y0 = Math.min(preview.start[1], preview.end[1]);
      const x1 = Math.max(preview.start[0], preview.end[0]);
      const y1 = Math.max(preview.start[1], preview.end[1]);
      ctx.ellipse(rect.x + ((x0 + x1) / 2) * zoom + zoom / 2, rect.y + ((y0 + y1) / 2) * zoom + zoom / 2,
        ((x1 - x0 + 1) * zoom) / 2, ((y1 - y0 + 1) * zoom) / 2, 0, 0, Math.PI * 2);
    } else if (Array.isArray(preview.points) && preview.points.length) {
      const points = preview.points;
      ctx.moveTo(rect.x + points[0][0] * zoom + zoom / 2, rect.y + points[0][1] * zoom + zoom / 2);
      for (let i = 1; i < points.length; i++) ctx.lineTo(rect.x + points[i][0] * zoom + zoom / 2, rect.y + points[i][1] * zoom + zoom / 2);
      if (preview.type === 'polygon') ctx.closePath();
    }
    ctx.stroke();
    ctx.restore();
  };

  const draw = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const { width, height, vw, vh } = layout();
    const theme = ui.theme;
    const colors = theme === 'light'
      ? { workspace: '#c9cbd4', ruler: '#eceef4', line: '#b4b8c6', text: '#5a5f72', border: '#32343e', guide: '#0b8fd4' }
      : theme === 'contrast'
        ? { workspace: '#000000', ruler: '#101010', line: '#f5f5f5', text: '#ffffff', border: '#ffffff', guide: '#00ffff' }
        : { workspace: '#0d0e13', ruler: '#1a1c24', line: '#343744', text: '#8f94a8', border: '#6b7185', guide: '#41a6f6' };

    ctx.save();
    ctx.fillStyle = colors.workspace;
    ctx.fillRect(0, 0, width, height);

    // Ruler background.
    ctx.fillStyle = colors.ruler;
    ctx.fillRect(0, 0, width, RULER);
    ctx.fillRect(0, 0, RULER, height);
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, RULER - 0.5); ctx.lineTo(width, RULER - 0.5);
    ctx.moveTo(RULER - 0.5, 0); ctx.lineTo(RULER - 0.5, height);
    ctx.stroke();

    if (!doc) {
      ctx.fillStyle = colors.text;
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(store.ui.language === 'en' ? 'No document open' : 'Tidak ada dokumen', width / 2, height / 2);
      ctx.restore();
      return;
    }

    const rect = docRect();
    const zoom = localRef.current.zoom;
    const docX = rect.x, docY = rect.y, docW = rect.w, docH = rect.h;

    // Ruler ticks and labels.
    const stepFor = (available, z) => {
      const candidates = [1, 2, 4, 5, 8, 10, 16, 20, 32, 40, 50, 64, 100, 128, 200, 256, 512, 1024];
      return candidates.find((s) => s * z >= 48) || 1024;
    };
    const stepX = stepFor(docW, zoom);
    const stepY = stepFor(docH, zoom);
    ctx.fillStyle = colors.text;
    ctx.font = '9px ui-monospace, monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    for (let x = 0; x <= doc.width; x += stepX) {
      const sx = docX + x * zoom;
      if (sx < RULER || sx > width) continue;
      ctx.strokeStyle = colors.line;
      ctx.beginPath(); ctx.moveTo(Math.round(sx) + 0.5, RULER - 5); ctx.lineTo(Math.round(sx) + 0.5, RULER); ctx.stroke();
      if (x < doc.width) ctx.fillText(String(x), sx + (stepX * zoom) / 2, RULER / 2 + 1);
    }
    ctx.textAlign = 'right';
    for (let y = 0; y <= doc.height; y += stepY) {
      const sy = docY + y * zoom;
      if (sy < RULER || sy > height) continue;
      ctx.strokeStyle = colors.line;
      ctx.beginPath(); ctx.moveTo(RULER - 5, Math.round(sy) + 0.5); ctx.lineTo(RULER, Math.round(sy) + 0.5); ctx.stroke();
      if (y < doc.height) ctx.fillText(String(y), RULER - 2, sy + (stepY * zoom) / 2);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Checkerboard.
    ctx.save();
    ctx.beginPath();
    ctx.rect(docX, docY, docW, docH);
    ctx.clip();
    const checker = makeChecker(ctx);
    if (checker) {
      ctx.fillStyle = checker;
      ctx.fillRect(docX, docY, docW, docH);
    }
    ctx.restore();

    // Onion skin (behind the current frame).
    if (ui.showOnion) {
      const index = Math.max(0, doc.frameIndex(session?.activeFrameId));
      const before = clamp(ui.onionBefore | 0, 0, 8);
      const after = clamp(ui.onionAfter | 0, 0, 8);
      const opacity = clamp(ui.onionOpacity ?? 0.35, 0.05, 1);
      for (let i = before; i >= 1; i--) {
        const frame = doc.frames[index - i];
        if (frame) drawOnionFrame(ctx, frame.id, rect, '#ff5577', opacity * (1 - (i - 1) * 0.12));
      }
      for (let i = after; i >= 1; i--) {
        const frame = doc.frames[index + i];
        if (frame) drawOnionFrame(ctx, frame.id, rect, '#41a6f6', opacity * (1 - (i - 1) * 0.12));
      }
    }

    // Composite of the active frame.
    if (!offscreenRef.current) offscreenRef.current = document.createElement('canvas');
    const off = offscreenRef.current;
    if (off.width !== doc.width || off.height !== doc.height) {
      off.width = doc.width;
      off.height = doc.height;
    }
    const comp = renderComposite(doc, session?.activeFrameId);
    compositeRef.current = comp.data;
    const offCtx = off.getContext('2d');
    offCtx.clearRect(0, 0, doc.width, doc.height);
    offCtx.putImageData(new ImageData(comp.data, doc.width, doc.height), 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, docX, docY, docW, docH);

    // Live tool overlay.
    if (engine.overlay) {
      const tmp = onionCanvasRef.current;
      if (tmp) {
        tmp.width = doc.width;
        tmp.height = doc.height;
        const tctx = tmp.getContext('2d');
        tctx.clearRect(0, 0, doc.width, doc.height);
        tctx.putImageData(new ImageData(engine.overlay, doc.width, doc.height), 0, 0);
        ctx.drawImage(tmp, docX, docY, docW, docH);
      }
    }

    // Grid.
    if (ui.showGrid && zoom >= 2) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(docX, docY, docW, docH);
      ctx.clip();
      if (zoom >= 8) {
        ctx.strokeStyle = ui.theme === 'light' ? 'rgba(30,34,48,0.10)' : 'rgba(255,255,255,0.055)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const x0 = Math.max(0, Math.floor((RULER - docX) / zoom));
        const x1 = Math.min(doc.width, Math.ceil((width - docX) / zoom));
        const y0 = Math.max(0, Math.floor((RULER - docY) / zoom));
        const y1 = Math.min(doc.height, Math.ceil((height - docY) / zoom));
        for (let x = x0; x <= x1; x++) { const sx = Math.round(docX + x * zoom) + 0.5; ctx.moveTo(sx, docY); ctx.lineTo(sx, docY + docH); }
        for (let y = y0; y <= y1; y++) { const sy = Math.round(docY + y * zoom) + 0.5; ctx.moveTo(docX, sy); ctx.lineTo(docX + docW, sy); }
        ctx.stroke();
      }
      if (doc.grid?.w > 0 && doc.grid?.h > 0) {
        ctx.strokeStyle = ui.gridOverlayColor || 'rgba(255,255,255,0.14)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const gx = doc.grid.x || 0, gy = doc.grid.y || 0;
        for (let x = gx; x <= doc.width; x += doc.grid.w) {
          const sx = Math.round(docX + x * zoom) + 0.5;
          ctx.moveTo(sx, docY); ctx.lineTo(sx, docY + docH);
        }
        for (let y = gy; y <= doc.height; y += doc.grid.h) {
          const sy = Math.round(docY + y * zoom) + 0.5;
          ctx.moveTo(docX, sy); ctx.lineTo(docX + docW, sy);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // Guides.
    if (ui.showGuides) {
      ctx.strokeStyle = colors.guide;
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      for (const guide of doc.guides || []) {
        const axis = guideAxis(guide);
        const pos = guidePosition(guide);
        if (axis === 'x') {
          const sx = Math.round(docX + pos * zoom) + 0.5;
          ctx.beginPath(); ctx.moveTo(sx, RULER); ctx.lineTo(sx, height); ctx.stroke();
        } else if (axis === 'y') {
          const sy = Math.round(docY + pos * zoom) + 0.5;
          ctx.beginPath(); ctx.moveTo(RULER, sy); ctx.lineTo(width, sy); ctx.stroke();
        }
      }
    }

    // Canvas border.
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(docX) + 0.5, Math.round(docY) + 0.5, Math.round(docW) - 1, Math.round(docH) - 1);

    drawSelection(ctx);
    drawSelectionPreview(ctx);

    // Brush cursor.
    const p = pointerRef.current;
    if (p.inside && !panRef.current && !guideDragRef.current && ui.tool !== 'hand') {
      const bx = docX + Math.floor(p.exactX) * zoom;
      const by = docY + Math.floor(p.exactY) * zoom;
      const size = Math.max(1, ui.brushSize | 0) * zoom;
      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = ui.theme === 'light' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.85)';
      ctx.strokeRect(Math.round(bx) + 0.5, Math.round(by) + 0.5, Math.round(size) - 1, Math.round(size) - 1);
      ctx.strokeStyle = ui.theme === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.65)';
      ctx.strokeRect(Math.round(bx) + 1.5, Math.round(by) + 1.5, Math.round(size) - 3, Math.round(size) - 3);
      ctx.restore();
    }

    // Guide drag preview.
    if (guideDragRef.current) {
      const g = guideDragRef.current;
      ctx.save();
      ctx.strokeStyle = colors.guide;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      if (g.axis === 'x') {
        const sx = Math.round(docX + g.position * zoom) + 0.5;
        ctx.moveTo(sx, RULER); ctx.lineTo(sx, height);
      } else {
        const sy = Math.round(docY + g.position * zoom) + 0.5;
        ctx.moveTo(RULER, sy); ctx.lineTo(width, sy);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Minimap badge.
    if (ui.showMinimap) {
      const mw = 96, mh = Math.max(32, Math.round((mw * doc.height) / doc.width));
      const mx = width - mw - 12, my = height - mh - 12;
      ctx.fillStyle = ui.theme === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(10,11,16,0.82)';
      ctx.fillRect(mx - 2, my - 2, mw + 4, mh + 4);
      ctx.drawImage(off, mx, my, mw, mh);
      ctx.strokeStyle = colors.guide;
      ctx.strokeRect(mx - 1.5, my - 1.5, mw + 3, mh + 3);
    }

    ctx.restore();
  };

  const emitCursor = (screenX, screenY) => {
    if (!doc) return;
    const point = screenToDoc(screenX, screenY);
    const inside = point.x >= 0 && point.y >= 0 && point.x < doc.width && point.y < doc.height;
    pointerRef.current = { inside, x: point.x, y: point.y, exactX: point.exactX, exactY: point.exactY, screenX, screenY };
    let hex = null;
    let color = null;
    if (inside && compositeRef.current) {
      const i = (point.y * doc.width + point.x) * 4;
      const a = compositeRef.current[i + 3];
      if (a > 0) {
        color = [compositeRef.current[i], compositeRef.current[i + 1], compositeRef.current[i + 2], a];
        hex = toHex(color);
      }
    }
    store.emit('cursor', {
      x: point.x, y: point.y, inside, color, hex,
      brushSize: ui.brushSize, selection: doc.selection?.empty ? null : doc.selection.bounds,
    });
  };

  const pointerEventLike = (event, extra = {}) => ({
    button: event.button,
    buttons: event.buttons,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    pressure: event.pressure || 0.5,
    pointerType: event.pointerType || 'mouse',
    zoom: localRef.current.zoom,
    ...extra,
  });

  const localPoint = (event) => {
    const canvas = canvasRef.current;
    const bounds = canvas.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };

  const beginGuideDrag = (axis, point) => {
    if (!doc) return;
    guideDragRef.current = { axis, position: 0, fromRuler: true };
    updateGuideDrag(point);
  };

  const updateGuideDrag = (screenPoint) => {
    const drag = guideDragRef.current;
    if (!drag || !doc) return;
    const point = screenToDoc(screenPoint.x, screenPoint.y);
    drag.position = clamp(drag.axis === 'x' ? point.exactX : point.exactY, 0, drag.axis === 'x' ? doc.width : doc.height);
    scheduleDraw();
  };

  const finishGuideDrag = () => {
    const drag = guideDragRef.current;
    guideDragRef.current = null;
    if (!drag || !doc) return;
    const position = Math.round(drag.position * 2) / 2;
    const guides = [...(doc.guides || []), {
      id: `guide_${Date.now().toString(36)}`,
      orientation: drag.axis === 'x' ? 'vertical' : 'horizontal',
      position,
    }];
    setDocumentProps(store, { guides }, 'Tambah garis bantu');
    store.toast(store.ui.language === 'en' ? 'Guide added.' : 'Garis bantu ditambahkan.', 'success', 1400);
    scheduleDraw();
  };

  // ---- pointer / wheel / keyboard handlers --------------------------------

  const onPointerDown = (event) => {
    if (!doc) return;
    const point = localPoint(event);
    const screenX = point.x, screenY = point.y;
    canvasRef.current.setPointerCapture?.(event.pointerId);

    if (touchRef.current.pointers) touchRef.current.pointers.set(event.pointerId, { x: screenX, y: screenY });
    if (event.pointerType === 'touch' && touchRef.current.pointers.size === 2) {
      const [a, b] = [...touchRef.current.pointers.values()];
      const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      touchRef.current.pinch = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        zoom: localRef.current.zoom,
        docPoint: screenToDoc(center.x, center.y),
        center,
      };
      panRef.current = null;
      if (engine.state) engine.cancel();
      return;
    }

    if (event.button === 1 || (event.button === 0 && (spaceRef.current || store.ui.tool === 'hand'))) {
      event.preventDefault();
      panRef.current = {
        startX: screenX, startY: screenY,
        panX: localRef.current.panX, panY: localRef.current.panY,
      };
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
      return;
    }

    if (store.ui.tool === 'zoom') {
      const zoomIn = !event.altKey && event.button !== 2;
      const target = nextZoom(localRef.current.zoom, zoomIn ? 1 : -1);
      zoomAtScreen(screenX, screenY, target);
      return;
    }

    if (event.button !== 0 && event.button !== 2) return;
    const snapped = snap(screenToDoc(screenX, screenY));
    if (screenX < RULER && screenY > RULER - 6) {
      beginGuideDrag('x', point);
      return;
    }
    if (screenY < RULER && screenX > RULER - 6) {
      beginGuideDrag('y', point);
      return;
    }
    if (screenX < RULER || screenY < RULER) return;
    engine.pointerDown({ x: snapped.x, y: snapped.y }, pointerEventLike(event, { button: event.button }));
  };

  const onPointerMove = (event) => {
    if (!doc) return;
    const point = localPoint(event);
    const screenX = point.x, screenY = point.y;
    if (event.pointerType === 'touch' && touchRef.current.pointers) {
      touchRef.current.pointers.set(event.pointerId, { x: screenX, y: screenY });
      const pinch = touchRef.current.pinch;
      if (pinch && touchRef.current.pointers.size === 2) {
        const [a, b] = [...touchRef.current.pointers.values()];
        const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const zoom = clamp(pinch.zoom * (dist / Math.max(1, pinch.distance)), 0.5, 64);
        zoomAtScreen(center.x, center.y, zoom);
        emitCursor(screenX, screenY);
        return;
      }
    }
    if (panRef.current) {
      localRef.current.panX = panRef.current.panX + (screenX - panRef.current.startX);
      localRef.current.panY = panRef.current.panY + (screenY - panRef.current.startY);
      persistView();
      scheduleDraw();
      emitCursor(screenX, screenY);
      return;
    }
    if (guideDragRef.current) {
      updateGuideDrag(point);
      emitCursor(screenX, screenY);
      return;
    }
    emitCursor(screenX, screenY);
    if (engine.state) {
      const snapped = snap(screenToDoc(screenX, screenY));
      engine.pointerMove({ x: snapped.x, y: snapped.y }, pointerEventLike(event));
    }
    scheduleDraw();
  };

  const onPointerUp = (event) => {
    const point = localPoint(event);
    if (touchRef.current.pointers) touchRef.current.pointers.delete(event.pointerId);
    if (touchRef.current.pointers.size < 2) touchRef.current.pinch = null;
    if (guideDragRef.current) {
      updateGuideDrag(point);
      finishGuideDrag();
      return;
    }
    if (panRef.current) {
      panRef.current = null;
      if (canvasRef.current) canvasRef.current.style.cursor = '';
      scheduleDraw();
      return;
    }
    if (engine.state) {
      const snapped = snap(screenToDoc(point.x, point.y));
      engine.pointerUp({ x: snapped.x, y: snapped.y }, pointerEventLike(event));
    }
    scheduleDraw();
  };

  const onPointerLeave = () => {
    pointerRef.current.inside = false;
    scheduleDraw();
    store.emit('cursor', { x: 0, y: 0, inside: false, color: null, hex: null });
  };

  const onPointerCancel = (event) => {
    if (touchRef.current.pointers) touchRef.current.pointers.delete(event.pointerId);
    if (touchRef.current.pointers.size < 2) touchRef.current.pinch = null;
    panRef.current = null;
    guideDragRef.current = null;
    if (engine.state) engine.cancel();
    scheduleDraw();
  };

  const onDoubleClick = (event) => {
    if (!doc) return;
    if (engine.handleDoubleClick()) {
      event.preventDefault();
      scheduleDraw();
    }
  };

  const onWheel = (event) => {
    if (!doc) return;
    event.preventDefault();
    if (event.shiftKey) {
      localRef.current.panX -= event.deltaY || event.deltaX;
      persistView();
      scheduleDraw();
      return;
    }
    const now = performance.now();
    if (now - wheelRef.current.last > 160) wheelRef.current.delta = 0;
    wheelRef.current.last = now;
    wheelRef.current.delta += event.deltaY;
    if (Math.abs(wheelRef.current.delta) < 24) return;
    const direction = wheelRef.current.delta < 0 ? 1 : -1;
    wheelRef.current.delta = 0;
    const point = localPoint(event);
    const target = nextZoom(localRef.current.zoom, direction);
    zoomAtScreen(point.x, point.y, target);
  };

  const onContextMenu = (event) => event.preventDefault();
  wheelHandlerRef.current = onWheel;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;
    ctxRef.current = canvas.getContext('2d');
    const resize = () => {
      const bounds = container.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.floor(bounds.width));
      const height = Math.max(1, Math.floor(bounds.height));
      sizeRef.current = { width, height, dpr };
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctxRef.current = ctx;
      const view = store.activeSession?.view;
      if (view && !view.fitted) fitRef.current();
      scheduleDraw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    const onKeyDown = (event) => {
      if (store.dialog || store.confirm) return;
      if (event.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(event.target.tagName) && !event.target.isContentEditable) {
        spaceRef.current = true;
        if (!event.repeat) event.preventDefault();
      }
    };
    const onKeyUp = (event) => {
      if (event.code === 'Space') spaceRef.current = false;
    };
    const onWheelNative = (event) => {
      wheelHandlerRef.current?.(event);
    };
    canvas.addEventListener('wheel', onWheelNative, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      observer.disconnect();
      canvas.removeEventListener('wheel', onWheelNative);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      cancelAnimationFrame(drawQueuedRef.current);
      drawQueuedRef.current = 0;
    };
  }, [store]);

  // Animate selection ants.
  useEffect(() => {
    const id = setInterval(() => {
      const selected = doc && !doc.selection?.empty;
      if (!selected && !engine.selectionPreview) return;
      antsRef.current = (antsRef.current + 1) % 8;
      scheduleDraw();
    }, 120);
    return () => clearInterval(id);
  }, [doc, engine]);

  // Sync view when switching tabs; fit if needed.
  useEffect(() => {
    const view = store.activeSession?.view;
    if (!view) return;
    localRef.current = { zoom: view.zoom || 8, panX: view.panX || 0, panY: view.panY || 0 };
    fitRef.current = fit;
    const id = requestAnimationFrame(() => {
      if (!view.fitted) fit();
      else scheduleDraw();
    });
    return () => cancelAnimationFrame(id);
  }, [session?.id]);

  // Redraw on every React-visible change.
  useEffect(() => {
    scheduleDraw();
  });

  // Keep fitRef current for the ResizeObserver closure.
  fitRef.current = fit;

  const cursorStyle = panRef.current || spaceRef.current || ui.tool === 'hand'
    ? 'grab'
    : ui.tool === 'zoom' ? 'zoom-in' : ui.tool === 'move' ? 'move' : 'none';

  return (
    <div className="viewport" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="viewport-canvas"
        style={{ cursor: cursorStyle, touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerLeave}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        aria-label={store.ui.language === 'en' ? 'PixelForge canvas' : 'Kanvas PixelForge'}
        role="img"
      />
      <div className="viewport-hint" aria-hidden="true">
        {store.ui.language === 'en'
          ? 'Scroll to zoom · Space / middle drag to pan · Right click draws with the secondary colour'
          : 'Scroll untuk zoom · Spasi / tombol tengah untuk pan · Klik kanan memakai warna sekunder'}
      </div>
    </div>
  );
}

export default CanvasViewport;
