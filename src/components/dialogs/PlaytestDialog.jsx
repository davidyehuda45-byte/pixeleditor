import React, { useEffect, useRef, useState } from 'react';
import { useStore, useI18n } from '../../ui/hooks.jsx';
import { Button } from '../../ui/controls.jsx';
import { Modal } from './Modal.jsx';
import { Icon } from '../Icon.jsx';
import { renderComposite } from '../../core/compositor.js';

// Minimalistic Web Audio 8-bit chiptune sound synthesizer (zero external dependencies)
function createSfxEngine() {
  let ctx = null;
  const getCtx = () => {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  return {
    playJump() {
      const c = getCtx();
      if (!c) return;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(140, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(380, c.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, c.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, c.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.14);
    },
    playAttack() {
      const c = getCtx();
      if (!c) return;
      const bufferSize = c.sampleRate * 0.08;
      const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = c.createBufferSource();
      noise.buffer = buffer;
      const filter = c.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, c.currentTime);
      filter.frequency.exponentialRampToValueAtTime(300, c.currentTime + 0.08);
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.2, c.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, c.currentTime + 0.08);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);
      noise.start();
    },
    playLand() {
      const c = getCtx();
      if (!c) return;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, c.currentTime);
      osc.frequency.linearRampToValueAtTime(40, c.currentTime + 0.06);
      gain.gain.setValueAtTime(0.25, c.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, c.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.06);
    },
  };
}

export function PlaytestDialog({ onClose }) {
  const store = useStore();
  const { t } = useI18n();
  const doc = store.doc;

  const canvasRef = useRef(null);
  const sfxRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [debugHitbox, setDebugHitbox] = useState(true);

  // Cached rasterized frames
  const frameCanvasesRef = useRef([]);

  // Game state
  const gameStateRef = useRef({
    x: 160,
    y: 0,
    vx: 0,
    vy: 0,
    facing: 1, // 1: right, -1: left
    onGround: true,
    action: 'idle', // 'idle' | 'walk' | 'jump' | 'attack'
    frameIdx: 0,
    frameTime: 0,
    attackTimer: 0,
    scrollX: 0,
  });

  const keysRef = useRef({ left: false, right: false, jump: false, attack: false });

  // Pre-rasterize all frames into offscreen canvases
  useEffect(() => {
    if (!doc) return;
    sfxRef.current = createSfxEngine();

    const canvases = doc.frames.map((frame) => {
      const c = document.createElement('canvas');
      c.width = doc.width;
      c.height = doc.height;
      const ctx = c.getContext('2d');
      const comp = renderComposite(doc, frame.id);
      const pixels = comp?.data || comp;
      const imgData = new ImageData(pixels, doc.width, doc.height);
      ctx.putImageData(imgData, 0, 0);
      return { canvas: c, duration: frame.duration || 100 };
    });
    frameCanvasesRef.current = canvases;
  }, [doc]);

  // Main 60fps Game Loop
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas || !doc) return undefined;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Detect tag frame boundaries
    const findTag = (name) => doc.tags?.find(t => t.name.toLowerCase().includes(name));
    const idleTag = findTag('idle');
    const walkTag = findTag('walk') || findTag('run');
    const jumpTag = findTag('jump');
    const attackTag = findTag('attack') || findTag('slash');

    const getFrameRange = (action) => {
      if (action === 'attack' && attackTag) return [attackTag.from, attackTag.to];
      if (action === 'jump' && jumpTag) return [jumpTag.from, jumpTag.to];
      if (action === 'walk' && walkTag) return [walkTag.from, walkTag.to];
      if (idleTag) return [idleTag.from, idleTag.to];
      // Fallback
      const total = doc.frames.length;
      if (total <= 1) return [0, 0];
      if (action === 'walk') return [1, Math.min(total - 1, 3)];
      return [0, 0];
    };

    let lastTimestamp = performance.now();

    const loop = (timestamp) => {
      const dt = Math.min(32, timestamp - lastTimestamp);
      lastTimestamp = timestamp;

      const state = gameStateRef.current;
      const keys = keysRef.current;

      // Physics & Input
      const moveSpeed = 2.4;
      const jumpPower = -7.6;
      const gravity = 0.42;

      // Input movement
      if (keys.left) {
        state.vx = -moveSpeed;
        state.facing = -1;
      } else if (keys.right) {
        state.vx = moveSpeed;
        state.facing = 1;
      } else {
        state.vx = 0;
      }

      // Jump
      if (keys.jump && state.onGround) {
        state.vy = jumpPower;
        state.onGround = false;
        if (soundEnabled) sfxRef.current?.playJump();
      }

      // Attack
      if (keys.attack && state.action !== 'attack') {
        state.action = 'attack';
        state.attackTimer = 220; // ms
        state.frameIdx = getFrameRange('attack')[0];
        if (soundEnabled) sfxRef.current?.playAttack();
      }

      // Gravity & Ground collision
      state.vy += gravity;
      state.y += state.vy;

      if (state.y >= 0) {
        if (!state.onGround && state.vy > 1.5 && soundEnabled) {
          sfxRef.current?.playLand();
        }
        state.y = 0;
        state.vy = 0;
        state.onGround = true;
      }

      // Action state determination
      if (state.attackTimer > 0) {
        state.attackTimer -= dt;
        state.action = 'attack';
      } else if (!state.onGround) {
        state.action = 'jump';
      } else if (Math.abs(state.vx) > 0.1) {
        state.action = 'walk';
      } else {
        state.action = 'idle';
      }

      // Parallax scroll update
      state.x += state.vx;
      state.scrollX += state.vx * 0.7;

      // Animation frame advancement
      const [fromFrame, toFrame] = getFrameRange(state.action);
      const span = Math.max(1, toFrame - fromFrame + 1);

      state.frameTime += dt;
      const activeDuration = frameCanvasesRef.current[state.frameIdx]?.duration || 100;
      if (state.frameTime >= activeDuration) {
        state.frameTime = 0;
        const nextRel = ((state.frameIdx - fromFrame + 1) % span);
        state.frameIdx = fromFrame + nextRel;
      }

      // ---- Rendering ----
      const W = canvas.width;
      const H = canvas.height;
      const groundY = H - 54;

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
      skyGrad.addColorStop(0, '#1a1829');
      skyGrad.addColorStop(1, '#2c2847');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, groundY);

      // Distant parallax stars/clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 20; i++) {
        const sx = ((i * 47 - state.scrollX * 0.2) % W + W) % W;
        const sy = (i * 23) % (groundY - 30);
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Ground plane
      ctx.fillStyle = '#1c212c';
      ctx.fillRect(0, groundY, W, H - groundY);
      ctx.fillStyle = '#58c896';
      ctx.fillRect(0, groundY, W, 4);

      // Tiled dirt grid
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      const tileOffset = ((-state.scrollX) % 16 + 16) % 16;
      for (let tx = tileOffset; tx < W; tx += 16) {
        ctx.fillRect(tx, groundY + 4, 1, H - groundY);
      }

      // Draw Character Sprite
      const spriteScale = 2.5;
      const curFrame = frameCanvasesRef.current[state.frameIdx];

      if (curFrame?.canvas) {
        const sw = doc.width * spriteScale;
        const sh = doc.height * spriteScale;
        const charScreenX = W / 2;
        const charScreenY = groundY + state.y;

        ctx.save();
        ctx.translate(charScreenX, charScreenY);
        ctx.scale(state.facing, 1);

        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 0, (sw / 2.5), 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw sprite aligned bottom-center
        ctx.drawImage(curFrame.canvas, -sw / 2, -sh, sw, sh);

        // Debug Hitbox / Hurtbox Overlay
        if (debugHitbox) {
          // Hurtbox (Blue - body)
          ctx.strokeStyle = 'rgba(64, 160, 255, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-sw * 0.3, -sh * 0.9, sw * 0.6, sh * 0.88);

          // Hitbox (Red - active weapon during attack)
          if (state.action === 'attack') {
            ctx.strokeStyle = 'rgba(255, 64, 64, 0.95)';
            ctx.fillStyle = 'rgba(255, 64, 64, 0.15)';
            ctx.fillRect(sw * 0.15, -sh * 0.8, sw * 0.55, sh * 0.7);
            ctx.strokeRect(sw * 0.15, -sh * 0.8, sw * 0.55, sh * 0.7);
          }

          // Origin Foot Pivot (Green)
          ctx.fillStyle = '#58c896';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // HUD Status (Action Tag & FPS)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(10, 10, 150, 48);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeRect(10, 10, 150, 48);

      ctx.fillStyle = '#e8eaf2';
      ctx.font = '11px sans-serif';
      ctx.fillText(`Aksi: ${state.action.toUpperCase()}`, 18, 28);
      ctx.fillStyle = '#8f95a8';
      ctx.fillText(`Frame: ${state.frameIdx + 1}/${doc.frames.length} (${state.facing > 0 ? '▶' : '◀'})`, 18, 45);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [doc, soundEnabled, debugHitbox]);

  // Keyboard controls router
  useEffect(() => {
    const onKeyDown = (e) => {
      const code = e.code;
      if (code === 'KeyA' || code === 'ArrowLeft') keysRef.current.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') keysRef.current.right = true;
      if (code === 'KeyW' || code === 'ArrowUp' || code === 'Space') {
        e.preventDefault();
        keysRef.current.jump = true;
      }
      if (code === 'KeyJ' || code === 'KeyZ' || code === 'Enter') {
        e.preventDefault();
        keysRef.current.attack = true;
      }
      if (code === 'KeyH') setDebugHitbox(v => !v);
    };

    const onKeyUp = (e) => {
      const code = e.code;
      if (code === 'KeyA' || code === 'ArrowLeft') keysRef.current.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') keysRef.current.right = false;
      if (code === 'KeyW' || code === 'ArrowUp' || code === 'Space') keysRef.current.jump = false;
      if (code === 'KeyJ' || code === 'KeyZ' || code === 'Enter') keysRef.current.attack = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return (
    <Modal title={t('playtest.title')} onClose={onClose} width={660} className="playtest-modal">
      <div className="playtest-dialog-content">
        <div className="playtest-screen-wrap">
          <canvas
            ref={canvasRef}
            width={480}
            height={270}
            className="playtest-canvas"
          />
        </div>

        {/* Desktop & Mobile Virtual Controller */}
        <div className="playtest-controls-bar">
          <div className="playtest-virtual-dpad">
            <button
              type="button"
              className="dpad-btn"
              onPointerDown={() => { keysRef.current.left = true; }}
              onPointerUp={() => { keysRef.current.left = false; }}
              onPointerLeave={() => { keysRef.current.left = false; }}
              aria-label="Kiri"
            >
              ◀
            </button>
            <button
              type="button"
              className="dpad-btn"
              onPointerDown={() => { keysRef.current.right = true; }}
              onPointerUp={() => { keysRef.current.right = false; }}
              onPointerLeave={() => { keysRef.current.right = false; }}
              aria-label="Kanan"
            >
              ▶
            </button>
          </div>

          <div className="playtest-virtual-actions">
            <button
              type="button"
              className="action-btn action-jump"
              onPointerDown={() => { keysRef.current.jump = true; }}
              onPointerUp={() => { keysRef.current.jump = false; }}
              onPointerLeave={() => { keysRef.current.jump = false; }}
            >
              ▲ {t('playtest.jump')} (Space)
            </button>
            <button
              type="button"
              className="action-btn action-attack"
              onPointerDown={() => { keysRef.current.attack = true; }}
              onPointerUp={() => { keysRef.current.attack = false; }}
              onPointerLeave={() => { keysRef.current.attack = false; }}
            >
              ⚔️ {t('playtest.attack')} (J)
            </button>
          </div>

          <div className="playtest-options">
            <Button
              size="sm"
              variant={soundEnabled ? 'primary' : 'ghost'}
              onClick={() => setSoundEnabled(v => !v)}
              title="8-Bit Audio SFX"
            >
              {soundEnabled ? '🔊 SFX' : '🔇 Mute'}
            </Button>
            <Button
              size="sm"
              variant={debugHitbox ? 'primary' : 'ghost'}
              onClick={() => setDebugHitbox(v => !v)}
              title="Hitbox & Hurtbox Wireframe"
            >
              🎯 Hitbox
            </Button>
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <span className="modal-footer-note">{t('playtest.hint')}</span>
        <Button variant="ghost" onClick={onClose}>{t('common.close')}</Button>
      </div>
    </Modal>
  );
}

export default PlaytestDialog;
