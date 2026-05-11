import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/* =======================================================================
   PHOTOPARK · AR FORCED PERSPECTIVE — pitch prototype
   Path A: desktop simulator. Drag to orbit, find the magic viewpoint where
   the projected artwork resolves into a single coherent image.
   ======================================================================= */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

.pp-root {
  --bg: #0c0a14;
  --paper: #f6efe1;
  --ink: #0c0a14;
  --hot: #ff2e7e;
  --acid: #d4ff3a;
  --cyan: #4fffea;
  --shade: rgba(246, 239, 225, 0.08);
  --shade2: rgba(246, 239, 225, 0.18);
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 620px;
  background: radial-gradient(ellipse at 50% 40%, #1a1230 0%, #0c0a14 65%, #050308 100%);
  color: var(--paper);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}
.pp-root * { box-sizing: border-box; }

.pp-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: grab;
  display: block;
}
.pp-canvas.dragging { cursor: grabbing; }

/* ─── Top HUD ─────────────────────────────────────────── */
.pp-hud-top {
  position: absolute;
  top: 20px; left: 20px; right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  pointer-events: none;
  z-index: 10;
  gap: 16px;
}
.pp-badge {
  pointer-events: auto;
  padding: 12px 16px;
  background: var(--paper);
  color: var(--ink);
  font-family: 'Big Shoulders Display', sans-serif;
  font-weight: 900;
  font-size: 20px;
  line-height: 1;
  letter-spacing: 0.02em;
  box-shadow: 5px 5px 0 var(--hot);
  position: relative;
}
.pp-badge .pp-sub {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
  font-size: 9px;
  letter-spacing: 0.24em;
  margin-top: 5px;
  opacity: 0.55;
}
.pp-badge::before {
  content: '';
  position: absolute;
  top: -6px; left: -6px;
  width: 12px; height: 12px;
  background: var(--acid);
  border-radius: 50%;
}

.pp-align {
  pointer-events: auto;
  padding: 12px 18px 14px;
  background: rgba(12, 10, 20, 0.78);
  backdrop-filter: blur(10px);
  border: 1px solid var(--shade);
  min-width: 220px;
  text-align: right;
}
.pp-align .pp-l {
  font-size: 9px;
  letter-spacing: 0.24em;
  opacity: 0.55;
  text-transform: uppercase;
}
.pp-align .pp-v {
  font-family: 'Big Shoulders Display', sans-serif;
  font-weight: 900;
  font-size: 58px;
  line-height: 0.88;
  color: var(--acid);
  font-variant-numeric: tabular-nums;
  transition: color 0.25s ease;
  margin-top: 2px;
}
.pp-align .pp-v .pp-pct { font-size: 24px; opacity: 0.6; }
.pp-align.warm .pp-v { color: var(--hot); }
.pp-align.cold .pp-v { color: var(--paper); opacity: 0.4; }
.pp-align.locked .pp-v { color: var(--cyan); }
.pp-bar {
  margin-top: 10px;
  height: 4px;
  background: var(--shade);
  position: relative;
  overflow: hidden;
}
.pp-bar-fill {
  position: absolute;
  inset: 0;
  background: var(--acid);
  transform-origin: left;
  transform: scaleX(0);
  transition: transform 0.15s linear, background 0.25s ease;
}
.pp-align.warm .pp-bar-fill { background: var(--hot); }
.pp-align.cold .pp-bar-fill { background: var(--shade2); }
.pp-align.locked .pp-bar-fill { background: var(--cyan); }

/* ─── Bottom HUD ──────────────────────────────────────── */
.pp-hud-bot {
  position: absolute;
  bottom: 20px; left: 20px; right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  pointer-events: none;
  z-index: 10;
  gap: 16px;
}
.pp-hint {
  pointer-events: auto;
  max-width: 380px;
  font-size: 12px;
  line-height: 1.55;
  letter-spacing: 0.02em;
  padding: 13px 16px;
  background: rgba(12, 10, 20, 0.78);
  backdrop-filter: blur(10px);
  border-left: 3px solid var(--hot);
}
.pp-hint b {
  font-family: 'Big Shoulders Display', sans-serif;
  letter-spacing: 0.08em;
  color: var(--acid);
  font-size: 13px;
  font-weight: 900;
  display: block;
  margin-bottom: 4px;
  text-transform: uppercase;
}
.pp-hint.locked b { color: var(--cyan); }
.pp-hint.warm b { color: var(--hot); }

.pp-controls {
  pointer-events: auto;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.pp-btn {
  font-family: 'Big Shoulders Display', sans-serif;
  font-weight: 900;
  letter-spacing: 0.08em;
  font-size: 13px;
  background: var(--paper);
  color: var(--ink);
  border: none;
  padding: 11px 16px;
  cursor: pointer;
  transition: transform 0.08s, box-shadow 0.08s;
  box-shadow: 3px 3px 0 var(--ink), 3px 3px 0 1px var(--shade2);
  text-transform: uppercase;
}
.pp-btn:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 var(--ink); }
.pp-btn:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--ink); }
.pp-btn.primary { background: var(--hot); color: var(--paper); box-shadow: 3px 3px 0 var(--acid); }
.pp-btn.primary:hover { box-shadow: 4px 4px 0 var(--acid); }
.pp-btn.ghost {
  background: transparent;
  color: var(--paper);
  border: 1px solid var(--shade2);
  box-shadow: none;
}
.pp-btn.ghost:hover { border-color: var(--paper); box-shadow: none; transform: none; }
.pp-btn.ghost.on { background: var(--acid); color: var(--ink); border-color: var(--acid); }

/* ─── Scene picker ────────────────────────────────────── */
.pp-picker {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 6px;
  pointer-events: auto;
  z-index: 10;
}
.pp-picker .pp-tab {
  width: 42px;
  height: 42px;
  background: rgba(12, 10, 20, 0.6);
  border: 1px solid var(--shade);
  cursor: pointer;
  font-family: 'Big Shoulders Display', sans-serif;
  font-weight: 900;
  font-size: 18px;
  color: var(--paper);
  opacity: 0.55;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pp-picker .pp-tab:hover { opacity: 1; border-color: var(--paper); }
.pp-picker .pp-tab.active {
  background: var(--acid);
  color: var(--ink);
  border-color: var(--acid);
  opacity: 1;
  transform: translateX(4px);
}
.pp-picker .pp-tab-upload {
  font-size: 22px;
  border-style: dashed;
  margin-top: 4px;
}
.pp-picker .pp-tab-upload.has {
  border-style: solid;
  border-color: var(--hot);
  color: var(--hot);
  opacity: 0.9;
}
.pp-picker .pp-tab-upload.active {
  background: var(--hot);
  color: var(--paper);
  border-color: var(--hot);
}
.pp-picker .pp-tab-label {
  position: absolute;
  left: 50px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 9px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  opacity: 0;
  transition: opacity 0.15s;
  pointer-events: none;
  white-space: nowrap;
}
.pp-picker .pp-tab:hover .pp-tab-label { opacity: 0.7; }

/* ─── Lock-on banner ──────────────────────────────────── */
.pp-lock {
  position: absolute;
  top: 42%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  text-align: center;
  z-index: 5;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.pp-lock.show {
  opacity: 1;
  animation: pp-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.pp-lock .pp-lock-t {
  font-family: 'Big Shoulders Display', sans-serif;
  font-weight: 900;
  font-size: 90px;
  line-height: 0.88;
  color: var(--cyan);
  letter-spacing: 0.01em;
  text-shadow: 7px 7px 0 var(--ink);
}
.pp-lock .pp-lock-s {
  margin-top: 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.32em;
  color: var(--paper);
  opacity: 0.85;
}
@keyframes pp-pop {
  0% { transform: translate(-50%, -50%) scale(0.5); }
  60% { transform: translate(-50%, -50%) scale(1.06); }
  100% { transform: translate(-50%, -50%) scale(1); }
}

/* ─── Intro ───────────────────────────────────────────── */
.pp-intro {
  position: absolute;
  inset: 0;
  background: rgba(12, 10, 20, 0.86);
  backdrop-filter: blur(6px);
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  padding: 20px;
}
.pp-intro-card {
  max-width: 460px;
  padding: 28px 30px 24px;
  background: var(--paper);
  color: var(--ink);
  box-shadow: 10px 10px 0 var(--hot);
  position: relative;
}
.pp-intro-card::before {
  content: '';
  position: absolute;
  top: -8px; left: -8px;
  width: 16px; height: 16px;
  background: var(--acid);
  border-radius: 50%;
}
.pp-intro-card h1 {
  font-family: 'Big Shoulders Display', sans-serif;
  font-weight: 900;
  font-size: 44px;
  line-height: 0.92;
  letter-spacing: 0.01em;
  margin: 0 0 2px;
}
.pp-intro-card .pp-kicker {
  font-size: 9px;
  letter-spacing: 0.28em;
  opacity: 0.55;
  margin-bottom: 18px;
  font-weight: 500;
}
.pp-intro-card p {
  font-size: 13px;
  line-height: 1.55;
  margin: 0 0 10px;
}
.pp-intro-card ul { margin: 8px 0 22px 18px; padding: 0; }
.pp-intro-card li {
  font-size: 12px;
  line-height: 1.7;
  list-style: square;
}
.pp-intro-card li b {
  font-family: 'Big Shoulders Display', sans-serif;
  letter-spacing: 0.05em;
  background: var(--acid);
  padding: 0 4px;
}
.pp-intro-go {
  font-family: 'Big Shoulders Display', sans-serif;
  font-weight: 900;
  letter-spacing: 0.1em;
  font-size: 15px;
  background: var(--ink);
  color: var(--paper);
  border: none;
  padding: 13px 22px;
  cursor: pointer;
  width: 100%;
  text-transform: uppercase;
  transition: background 0.15s;
}
.pp-intro-go:hover { background: var(--hot); }

/* ─── Mobile / small screens ──────────────────────────── */
@media (max-width: 640px) {
  .pp-align { min-width: 0; padding: 8px 12px; }
  .pp-align .pp-v { font-size: 36px; }
  .pp-badge { font-size: 15px; padding: 9px 12px; }
  .pp-hud-bot { flex-direction: column; align-items: stretch; }
  .pp-hint { max-width: none; }
  .pp-controls { justify-content: flex-start; }
  .pp-btn { font-size: 11px; padding: 9px 12px; }
}
`;

/* ─── Drawing helpers (used by makeArtwork) ───────────── */
function drawPalm(ctx, x, baseY, height) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.rotate(-0.08);
  // trunk
  ctx.fillStyle = '#3a2418';
  ctx.beginPath();
  ctx.moveTo(-height * 0.018, 0);
  ctx.lineTo(-height * 0.008, -height);
  ctx.lineTo(height * 0.008, -height);
  ctx.lineTo(height * 0.018, 0);
  ctx.closePath();
  ctx.fill();
  // trunk rings
  ctx.fillStyle = '#1f1208';
  for (let i = 1; i < 11; i++) {
    const t = i / 11;
    const y = -t * height;
    ctx.fillRect(-height * 0.013, y, height * 0.026, 2);
  }
  // coconuts
  ctx.fillStyle = '#1f1208';
  for (const [cx, cy] of [[-height * 0.02, -height + 8], [height * 0.02, -height + 4]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, height * 0.018, 0, Math.PI * 2);
    ctx.fill();
  }
  // fronds (7 leaves radiating)
  ctx.fillStyle = '#1a3a1a';
  for (let a = 0; a < 7; a++) {
    const angle = -Math.PI / 2 + (a - 3) * 0.5;
    ctx.save();
    ctx.translate(0, -height);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(height * 0.18, 0, height * 0.22, height * 0.045, 0, 0, Math.PI * 2);
    ctx.fill();
    // darker overlay
    ctx.fillStyle = '#0c2a0c';
    ctx.beginPath();
    ctx.ellipse(height * 0.18, height * 0.012, height * 0.20, height * 0.022, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a3a1a';
    ctx.restore();
  }
  ctx.restore();
}

function drawTouristPose(ctx, x, y, h) {
  // Classic "holding up the tower" silhouette, arms raised toward upper-right
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#0c0a14';
  ctx.strokeStyle = '#0c0a14';
  ctx.lineWidth = h * 0.08;
  ctx.lineCap = 'round';
  // head
  ctx.beginPath();
  ctx.arc(0, -h * 0.85, h * 0.13, 0, Math.PI * 2);
  ctx.fill();
  // body
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.7);
  ctx.lineTo(0, -h * 0.35);
  ctx.stroke();
  // legs
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.35);
  ctx.lineTo(-h * 0.13, 0);
  ctx.moveTo(0, -h * 0.35);
  ctx.lineTo(h * 0.13, 0);
  ctx.stroke();
  // arms reaching up-right toward tower
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.65);
  ctx.lineTo(h * 0.28, -h * 0.95);
  ctx.moveTo(0, -h * 0.65);
  ctx.lineTo(h * 0.22, -h * 1.02);
  ctx.stroke();
  ctx.restore();
}

/* ─── Procedural artworks ─────────────────────────────── */
function makeArtwork(kind) {
  const c = document.createElement('canvas');
  const W = 1600, H = 900;
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  if (kind === 0) {
    // 0 — PHOTOPARK on a hot gradient
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#ff2e7e');
    g.addColorStop(0.55, '#ff5a2a');
    g.addColorStop(1, '#ffb13d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // confetti
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.3})`;
      const x = Math.random() * W, y = Math.random() * H, r = 6 + Math.random() * 24;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    // black ticks
    ctx.fillStyle = '#0c0a14';
    for (let i = 0; i < 28; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      ctx.fillRect(x, y, 4, 14);
    }

    // wordmark
    ctx.font = `900 ${Math.round(H * 0.36)}px "Arial Black", Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0c0a14';
    ctx.lineWidth = 18;
    ctx.strokeText('PHOTOPARK', W / 2, H * 0.46);
    ctx.fillStyle = '#fff5e1';
    ctx.fillText('PHOTOPARK', W / 2, H * 0.46);

    // tagline
    ctx.font = `900 ${Math.round(H * 0.07)}px "Arial Black", Impact, sans-serif`;
    ctx.fillStyle = '#0c0a14';
    ctx.fillText('★  AR FORCED PERSPECTIVE  ★', W / 2, H * 0.72);
  } else if (kind === 1) {
    // 1 — Heart on cream
    ctx.fillStyle = '#f6efe1';
    ctx.fillRect(0, 0, W, H);

    // bg stripes
    ctx.fillStyle = 'rgba(255, 46, 126, 0.07)';
    for (let i = -20; i < 30; i++) {
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-Math.PI / 8);
      ctx.fillRect(i * 80, -H, 30, H * 2.5);
      ctx.restore();
    }

    // heart
    const cx = W / 2, cy = H * 0.52, sz = H * 0.34;
    ctx.fillStyle = '#ff2e7e';
    ctx.beginPath();
    ctx.moveTo(cx, cy + sz * 0.78);
    ctx.bezierCurveTo(cx - sz * 1.45, cy - sz * 0.2, cx - sz * 0.42, cy - sz * 1.05, cx, cy - sz * 0.32);
    ctx.bezierCurveTo(cx + sz * 0.42, cy - sz * 1.05, cx + sz * 1.45, cy - sz * 0.2, cx, cy + sz * 0.78);
    ctx.fill();

    // LOVE
    ctx.font = `900 ${Math.round(sz * 0.6)}px "Arial Black", Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f6efe1';
    ctx.fillText('LOVE', cx, cy + sz * 0.04);

    // tagline above
    ctx.font = `900 ${Math.round(H * 0.06)}px "Arial Black", Impact, sans-serif`;
    ctx.fillStyle = '#0c0a14';
    ctx.fillText('— PHOTOPARK FOREVER —', cx, H * 0.10);

    // tagline below
    ctx.fillText('FIND YOUR ANGLE', cx, H * 0.90);

    // corner squares
    ctx.fillStyle = '#0c0a14';
    const m = 50;
    [[m, m], [W - m - 20, m], [m, H - m - 20], [W - m - 20, H - m - 20]].forEach(([x, y]) => {
      ctx.fillRect(x, y, 20, 20);
    });
  } else if (kind === 2) {
    // 2 — Acid SCAN ME
    ctx.fillStyle = '#0c0a14';
    ctx.fillRect(0, 0, W, H);

    // diagonal stripes
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(Math.PI / 7);
    for (let i = -30; i < 30; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#d4ff3a' : 'transparent';
      ctx.fillRect(i * 70, -H * 1.5, 35, H * 3);
    }
    ctx.restore();

    // big cyan disc
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, H * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = '#4fffea';
    ctx.fill();

    // inner ring
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#0c0a14';
    ctx.stroke();

    // wordmark
    ctx.font = `900 ${Math.round(H * 0.2)}px "Arial Black", Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0c0a14';
    ctx.fillText('SCAN', W / 2, H * 0.45);
    ctx.fillText('ME', W / 2, H * 0.61);

    // outer label
    ctx.font = `700 ${Math.round(H * 0.05)}px "Arial Black", Impact, sans-serif`;
    ctx.fillStyle = '#d4ff3a';
    ctx.fillText('▸ FIND THE ANGLE ◂', W / 2, H * 0.93);
  } else if (kind === 3) {
    // 3 — Beach paradise
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.7);
    sky.addColorStop(0, '#4ba0d4');
    sky.addColorStop(0.5, '#ffb88a');
    sky.addColorStop(1, '#ffd5a0');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H * 0.6);

    // Sun glow halo
    const sx = W * 0.66, sy = H * 0.34, sr = H * 0.13;
    const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 4);
    halo.addColorStop(0, 'rgba(255, 240, 180, 0.85)');
    halo.addColorStop(0.3, 'rgba(255, 200, 130, 0.4)');
    halo.addColorStop(1, 'rgba(255, 200, 130, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H * 0.7);
    // sun disc
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fillStyle = '#fff4b8';
    ctx.fill();

    // Distant clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (const [cx, cy, cw] of [[W * 0.15, H * 0.18, 220], [W * 0.42, H * 0.25, 160], [W * 0.85, H * 0.15, 180]]) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, cw, cw * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ocean
    const ocean = ctx.createLinearGradient(0, H * 0.55, 0, H * 0.78);
    ocean.addColorStop(0, '#1d6a96');
    ocean.addColorStop(0.5, '#3e95bf');
    ocean.addColorStop(1, '#7cc4e0');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, H * 0.55, W, H * 0.23);

    // Sun reflection on water (broken into shimmer)
    ctx.fillStyle = 'rgba(255, 235, 160, 0.7)';
    for (let i = 0; i < 12; i++) {
      const w = Math.max(8, 90 - i * 6);
      const y = H * 0.58 + i * 9;
      ctx.fillRect(sx - w / 2, y, w, 4);
    }

    // Sand
    const sand = ctx.createLinearGradient(0, H * 0.74, 0, H);
    sand.addColorStop(0, '#f5deaa');
    sand.addColorStop(1, '#dcb673');
    ctx.fillStyle = sand;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.78);
    ctx.bezierCurveTo(W * 0.3, H * 0.74, W * 0.6, H * 0.80, W, H * 0.76);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // Sand shadow ripples
    ctx.fillStyle = 'rgba(180, 130, 70, 0.18)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(W * (0.2 + i * 0.18), H * (0.88 + i * 0.02), 70, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Palm trees
    drawPalm(ctx, W * 0.13, H * 0.82, H * 0.72);
    drawPalm(ctx, W * 0.92, H * 0.86, H * 0.55);

    // Title
    ctx.font = `900 ${Math.round(H * 0.13)}px "Arial Black", Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0c0a14';
    ctx.lineWidth = 11;
    ctx.strokeText('PARADISE', W * 0.5, H * 0.14);
    ctx.fillStyle = '#fff5e1';
    ctx.fillText('PARADISE', W * 0.5, H * 0.14);

    ctx.font = `700 ${Math.round(H * 0.04)}px "Arial Black", Impact, sans-serif`;
    ctx.fillStyle = '#0c0a14';
    ctx.fillText('— PHOTOPARK ATTRACTION —', W * 0.5, H * 0.23);
  } else {
    // 4 — Leaning Tower of Pisa at sunset
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#2d2055');
    sky.addColorStop(0.35, '#a83c6a');
    sky.addColorStop(0.6, '#ee8a4e');
    sky.addColorStop(0.85, '#ffd089');
    sky.addColorStop(1, '#fff2c2');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Sun behind tower
    const sx = W * 0.38, sy = H * 0.58;
    const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, H * 0.55);
    halo.addColorStop(0, 'rgba(255, 230, 150, 0.95)');
    halo.addColorStop(0.25, 'rgba(255, 180, 110, 0.5)');
    halo.addColorStop(1, 'rgba(255, 180, 110, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);
    ctx.beginPath();
    ctx.arc(sx, sy, H * 0.11, 0, Math.PI * 2);
    ctx.fillStyle = '#ffe092';
    ctx.fill();

    // Ground
    const ground = ctx.createLinearGradient(0, H * 0.86, 0, H);
    ground.addColorStop(0, '#3a2548');
    ground.addColorStop(1, '#1a0f24');
    ctx.fillStyle = ground;
    ctx.fillRect(0, H * 0.86, W, H * 0.14);
    // distant cypress trees on horizon
    ctx.fillStyle = '#1a0f24';
    for (let i = 0; i < 8; i++) {
      const tx = W * (0.05 + i * 0.13);
      const th = H * (0.04 + Math.random() * 0.03);
      ctx.beginPath();
      ctx.moveTo(tx, H * 0.86);
      ctx.lineTo(tx - 8, H * 0.86 - th * 0.7);
      ctx.lineTo(tx, H * 0.86 - th);
      ctx.lineTo(tx + 8, H * 0.86 - th * 0.7);
      ctx.closePath();
      ctx.fill();
    }

    // Tower
    const towerCx = W * 0.55, towerBase = H * 0.86;
    const towerH = H * 0.7, towerW = H * 0.14;
    ctx.save();
    ctx.translate(towerCx, towerBase);
    ctx.rotate(0.085); // ~5° lean to the right
    const tw = towerW;
    const fill = '#f4ead0';
    const ink = '#0c0a14';

    // Plinth
    const plinthH = towerH * 0.06;
    ctx.fillStyle = fill;
    ctx.fillRect(-tw * 0.58, -plinthH, tw * 1.16, plinthH);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    ctx.strokeRect(-tw * 0.58, -plinthH, tw * 1.16, plinthH);

    // Ground floor (no arches, solid base with one entry)
    const baseH = towerH * 0.12;
    let y = -plinthH - baseH;
    ctx.fillStyle = fill;
    ctx.fillRect(-tw * 0.5, y, tw, baseH);
    ctx.strokeRect(-tw * 0.5, y, tw, baseH);
    // entry arch
    ctx.fillStyle = ink;
    ctx.fillRect(-tw * 0.06, y + baseH * 0.3, tw * 0.12, baseH * 0.7);
    // blind arches on either side
    for (const ax of [-tw * 0.32, -tw * 0.18, tw * 0.18, tw * 0.32]) {
      ctx.beginPath();
      ctx.arc(ax, y + baseH * 0.6, tw * 0.04, Math.PI, Math.PI * 2);
      ctx.fill();
    }

    // 6 colonnade levels
    const colLevels = 6;
    const colLevelH = towerH * 0.095;
    for (let i = 0; i < colLevels; i++) {
      y -= colLevelH;
      ctx.fillStyle = fill;
      ctx.fillRect(-tw * 0.5, y, tw, colLevelH);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3;
      ctx.strokeRect(-tw * 0.5, y, tw, colLevelH);

      // top + bottom cornice bands
      ctx.fillStyle = ink;
      ctx.fillRect(-tw * 0.5, y + colLevelH * 0.08, tw, 2);
      ctx.fillRect(-tw * 0.5, y + colLevelH * 0.85, tw, 2);

      // columns
      const cols = 12;
      for (let c = 0; c <= cols; c++) {
        const cx = -tw * 0.5 + (c / cols) * tw;
        ctx.fillRect(cx - 1, y + colLevelH * 0.15, 2, colLevelH * 0.7);
      }
    }

    // Bell chamber
    const bellH = towerH * 0.12;
    y -= bellH;
    const bellW = tw * 0.86;
    ctx.fillStyle = fill;
    ctx.fillRect(-bellW * 0.5, y, bellW, bellH);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    ctx.strokeRect(-bellW * 0.5, y, bellW, bellH);
    // bell arches (taller)
    ctx.fillStyle = ink;
    const bcols = 8;
    for (let c = 0; c <= bcols; c++) {
      const cx = -bellW * 0.5 + (c / bcols) * bellW;
      ctx.fillRect(cx - 1, y + bellH * 0.18, 2, bellH * 0.7);
    }
    ctx.fillRect(-bellW * 0.5, y + bellH * 0.1, bellW, 2);

    // Crowning cap
    ctx.beginPath();
    ctx.moveTo(-bellW * 0.5, y);
    ctx.lineTo(0, y - bellH * 0.45);
    ctx.lineTo(bellW * 0.5, y);
    ctx.closePath();
    ctx.fillStyle = ink;
    ctx.fill();
    // flag pole
    ctx.fillRect(-1.5, y - bellH * 0.85, 3, bellH * 0.4);

    ctx.restore();

    // Classic forced-perspective tourist silhouette
    drawTouristPose(ctx, W * 0.22, H * 0.86, H * 0.32);

    // Title
    ctx.font = `900 ${Math.round(H * 0.14)}px "Arial Black", Impact, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#fff2c2';
    ctx.lineWidth = 9;
    ctx.strokeText('PISA', W * 0.05, H * 0.2);
    ctx.fillStyle = '#0c0a14';
    ctx.fillText('PISA', W * 0.05, H * 0.2);

    ctx.font = `700 ${Math.round(H * 0.035)}px "Arial Black", Impact, sans-serif`;
    ctx.fillStyle = '#0c0a14';
    ctx.fillText('· TORRE PENDENTE · EST. 1372 ·', W * 0.055, H * 0.245);

    // Corner ticks (postcard feel)
    ctx.fillStyle = '#0c0a14';
    const m = 36;
    [[m, m], [W - m - 18, m], [m, H - m - 18], [W - m - 18, H - m - 18]].forEach(([cx, cy]) => {
      ctx.fillRect(cx, cy, 18, 4);
      ctx.fillRect(cx, cy, 4, 18);
    });
  }

  return c;
}

/* ─── Projective shader ───────────────────────────────── */
const VERT = `
varying vec3 vWorldPos;
varying vec3 vNormal;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const FRAG = `
precision highp float;
uniform sampler2D projTex;
uniform mat4 projMatrix;
uniform vec3 projPos;
uniform vec3 baseColor;
uniform vec3 gridColor;
uniform float gridScale;
uniform float texOpacity;
varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
  // pick grid plane based on dominant normal axis
  vec3 n = abs(vNormal);
  vec2 gp;
  if (n.y > 0.7) gp = vWorldPos.xz;
  else if (n.x > 0.7) gp = vWorldPos.zy;
  else gp = vWorldPos.xy;

  vec2 g = fract(gp * gridScale);
  vec2 d = min(g, 1.0 - g);
  float line = 1.0 - smoothstep(0.0, 0.015, min(d.x, d.y));
  float mline = 1.0 - smoothstep(0.0, 0.005, min(d.x, d.y));
  vec3 base = mix(baseColor, gridColor, line * 0.28 + mline * 0.4);

  // light wash from above for surface readability
  float wash = clamp(dot(normalize(vNormal), vec3(0.2, 1.0, 0.3)), 0.0, 1.0);
  base *= 0.78 + 0.22 * wash;

  // project the artwork
  vec4 pc = projMatrix * vec4(vWorldPos, 1.0);
  vec3 ndc = pc.xyz / pc.w;
  vec2 uv = ndc.xy * 0.5 + 0.5;

  bool inFront = pc.w > 0.0;
  bool inFrame = uv.x > 0.001 && uv.x < 0.999 && uv.y > 0.001 && uv.y < 0.999;

  vec3 toProj = normalize(projPos - vWorldPos);
  float facing = max(dot(normalize(vNormal), toProj), 0.0);

  vec3 col = base;
  if (inFront && inFrame && facing > 0.05) {
    vec4 t = texture2D(projTex, uv);
    col = mix(col, t.rgb, t.a * texOpacity * smoothstep(0.05, 0.25, facing));
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

/* ─── Math helpers ────────────────────────────────────── */
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

/* ─── Per-artwork scene configs ───────────────────────── */
// Each scene defines its own magic viewpoint, projector FOV, set of physical
// props the artwork projects onto, and a default wide-shot camera angle.
const SCENES = [
  {
    // 0 — LOGO: studio showroom
    magicPos: [0, 1.55, 5.2],
    magicLook: [0, 1.05, 0],
    fov: 54,
    wide: { pos: [3.5, 2.4, 5.5], look: [0, 1.0, 0] },
    obstacles: [
      { type: 'cyl', pos: [1.55, 1.1, 0.9], size: { r: 0.32, h: 2.2 },
        mat: { base: 0x251c3a, grid: 0x4a3a6e, gridScale: 2.5 } },
      { type: 'box', pos: [-1.4, 0.2, 1.4], size: [1.0, 0.4, 0.8],
        mat: { base: 0x1d1830, grid: 0x3a2f5a, gridScale: 2.5 } },
      { type: 'torus', pos: [-2.4, 1.85, -0.3], rot: [0, Math.PI / 5, 0],
        size: { r: 0.45, t: 0.045 },
        mat: { base: 0x3a2050, grid: 0x6a3a90, gridScale: 3.0 } },
    ],
  },
  {
    // 1 — HEART: intimate photo booth, lower angle, bench setup
    magicPos: [0, 1.2, 4.3],
    magicLook: [0, 1.0, -0.3],
    fov: 52,
    wide: { pos: [-3.4, 1.8, 5.0], look: [0, 1.0, 0] },
    obstacles: [
      // central bench
      { type: 'box', pos: [0, 0.3, 1.1], size: [2.4, 0.6, 0.7],
        mat: { base: 0x2a1830, grid: 0x4d2858, gridScale: 2.0 } },
      // flanking pillars
      { type: 'cyl', pos: [-2.2, 0.65, 1.8], size: { r: 0.18, h: 1.3 },
        mat: { base: 0x3a1840, grid: 0x6e2c6c, gridScale: 3.0 } },
      { type: 'cyl', pos: [2.2, 0.65, 1.8], size: { r: 0.18, h: 1.3 },
        mat: { base: 0x3a1840, grid: 0x6e2c6c, gridScale: 3.0 } },
      // orbs on top of pillars
      { type: 'sphere', pos: [-2.2, 1.4, 1.8], size: { r: 0.22 },
        mat: { base: 0x4a1850, grid: 0x803090, gridScale: 4.0 } },
      { type: 'sphere', pos: [2.2, 1.4, 1.8], size: { r: 0.22 },
        mat: { base: 0x4a1850, grid: 0x803090, gridScale: 4.0 } },
    ],
  },
  {
    // 2 — SCAN: tech/industrial, high angle, scattered crates
    magicPos: [0, 2.5, 4.2],
    magicLook: [0, 0.55, -0.4],
    fov: 56,
    wide: { pos: [3.4, 3.0, 5.0], look: [0, 0.8, 0] },
    obstacles: [
      { type: 'box', pos: [-1.6, 0.4, 1.0], size: [0.8, 0.8, 0.8],
        mat: { base: 0x1a2a30, grid: 0x305060, gridScale: 2.5 } },
      { type: 'box', pos: [1.7, 0.55, 0.4], size: [1.1, 1.1, 0.7],
        mat: { base: 0x1a2a30, grid: 0x305060, gridScale: 2.5 } },
      { type: 'box', pos: [-0.4, 0.25, -0.6], size: [1.4, 0.5, 0.9],
        mat: { base: 0x1a2a30, grid: 0x305060, gridScale: 2.5 } },
      { type: 'box', pos: [2.0, 1.55, 1.4], size: [0.5, 0.5, 0.5], rot: [0, Math.PI / 6, 0],
        mat: { base: 0x223a40, grid: 0x406070, gridScale: 3.0 } },
    ],
  },
  {
    // 3 — BEACH: tropical, offset angle, palm tree + surfboard + ball
    magicPos: [1.0, 1.45, 4.6],
    magicLook: [-0.2, 1.1, -0.4],
    fov: 56,
    wide: { pos: [-3.5, 2.2, 4.8], look: [0, 1.0, 0] },
    obstacles: [
      // palm trunk (tall thin cylinder)
      { type: 'cyl', pos: [-2.0, 1.4, 0.6], size: { r: 0.13, h: 2.8 },
        mat: { base: 0x2a1810, grid: 0x4a2818, gridScale: 3.0 } },
      // palm canopy
      { type: 'sphere', pos: [-2.0, 3.0, 0.6], size: { r: 0.65 },
        mat: { base: 0x1a3018, grid: 0x2a5028, gridScale: 4.0 } },
      // surfboard
      { type: 'box', pos: [1.8, 0.08, 1.6], size: [0.3, 0.12, 1.6], rot: [0, Math.PI / 8, 0],
        mat: { base: 0x1a3a4a, grid: 0x305a70, gridScale: 3.0 } },
      // beach ball
      { type: 'sphere', pos: [2.4, 0.42, 2.6], size: { r: 0.42 },
        mat: { base: 0x2a4a40, grid: 0x4a8070, gridScale: 4.0 } },
      // sandcastle (small box)
      { type: 'box', pos: [0.4, 0.2, 2.4], size: [0.6, 0.4, 0.6],
        mat: { base: 0x3a3018, grid: 0x6a5828, gridScale: 3.0 } },
    ],
  },
  {
    // 4 — PISA: classic tourist low angle, looking up at the monument
    magicPos: [0, 0.7, 5.0],
    magicLook: [0, 2.6, 0],
    fov: 62,
    wide: { pos: [-3.5, 1.4, 5.6], look: [0, 1.8, 0] },
    obstacles: [
      // tower stand-in (tall thick cylinder)
      { type: 'cyl', pos: [0, 1.5, 0], size: { r: 0.35, h: 3.0 },
        mat: { base: 0x2a2218, grid: 0x4a4028, gridScale: 2.5 } },
      // lamp post
      { type: 'cyl', pos: [-2.5, 1.0, 1.5], size: { r: 0.06, h: 2.0 },
        mat: { base: 0x1a1a1a, grid: 0x2a2a2a, gridScale: 4.0 } },
      // tourist bench
      { type: 'box', pos: [0, 0.25, 3.2], size: [2.0, 0.5, 0.55],
        mat: { base: 0x2a1f18, grid: 0x4a3a28, gridScale: 3.0 } },
      // small pigeon
      { type: 'sphere', pos: [1.4, 0.13, 2.5], size: { r: 0.12 },
        mat: { base: 0x3a3a3a, grid: 0x6a6a6a, gridScale: 5.0 } },
    ],
  },
];
// scene 5 (user upload) reuses the showroom layout
SCENES[5] = SCENES[0];

/* =======================================================================
   Main component
   ======================================================================= */
export default function PhotoparkAR() {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  const [alignment, setAlignment] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [showFrustum, setShowFrustum] = useState(false);
  const [showMarker, setShowMarker] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [locked, setLocked] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [userImage, setUserImage] = useState(null);
  const fileInputRef = useRef(null);

  /* ── Handle file upload — letterbox into 16:9 ───────── */
  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const W = 1600, H = 900;
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const ctx = c.getContext('2d');
        // Letterbox background matches the room's deep purple-black
        ctx.fillStyle = '#0c0a14';
        ctx.fillRect(0, 0, W, H);
        // Fit image into 16:9 preserving aspect
        const targetAspect = W / H;
        const imgAspect = img.width / img.height;
        let dw, dh, dx, dy;
        if (imgAspect > targetAspect) {
          dw = W;
          dh = W / imgAspect;
          dx = 0;
          dy = (H - dh) / 2;
        } else {
          dh = H;
          dw = H * imgAspect;
          dx = (W - dw) / 2;
          dy = 0;
        }
        ctx.drawImage(img, dx, dy, dw, dh);
        setUserImage(c);
        setImageIndex(5);
      };
      img.onerror = () => {
        // eslint-disable-next-line no-console
        console.warn('Image load failed');
      };
      img.src = ev.target.result;
    };
    reader.onerror = () => {
      // eslint-disable-next-line no-console
      console.warn('File read failed');
    };
    reader.readAsDataURL(file);
  };
  const [hasCustom, setHasCustom] = useState(false);
  const [customVersion, setCustomVersion] = useState(0);
  const [customName, setCustomName] = useState('');

  /* ── Set up Three.js scene once ─────────────────────── */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth, H = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    renderer.domElement.className = 'pp-canvas';

    const scene = new THREE.Scene();

    // User camera
    const camera = new THREE.PerspectiveCamera(48, W / H, 0.05, 100);
    // Magic viewpoint — mutable, updated per scene via applyScene()
    const MAGIC_POS = new THREE.Vector3(...SCENES[0].magicPos);
    const MAGIC_LOOK = new THREE.Vector3(...SCENES[0].magicLook);
    camera.position.copy(MAGIC_POS).add(new THREE.Vector3(2.5, 0.7, 0.5));
    camera.lookAt(MAGIC_LOOK);

    // Orbit state — spherical coords around an orbit target
    const orbit = {
      target: MAGIC_LOOK.clone(),
      radius: camera.position.distanceTo(MAGIC_LOOK),
      theta: Math.atan2(camera.position.x - MAGIC_LOOK.x, camera.position.z - MAGIC_LOOK.z),
      phi: Math.acos((camera.position.y - MAGIC_LOOK.y) / camera.position.distanceTo(MAGIC_LOOK)),
    };
    const applyOrbit = () => {
      const { target, radius, theta, phi } = orbit;
      camera.position.set(
        target.x + radius * Math.sin(phi) * Math.sin(theta),
        target.y + radius * Math.cos(phi),
        target.z + radius * Math.sin(phi) * Math.cos(theta),
      );
      camera.lookAt(target);
    };

    // Projector — defines the magic viewpoint and the artwork's "ideal" framing
    const projector = new THREE.PerspectiveCamera(SCENES[0].fov, 16 / 9, 0.05, 60);
    projector.position.copy(MAGIC_POS);
    projector.lookAt(MAGIC_LOOK);
    projector.updateMatrixWorld(true);

    // Procedural artwork texture
    const artCanvas = makeArtwork(0);
    const projTex = new THREE.CanvasTexture(artCanvas);
    projTex.minFilter = THREE.LinearFilter;
    projTex.magFilter = THREE.LinearFilter;
    projTex.wrapS = THREE.ClampToEdgeWrapping;
    projTex.wrapT = THREE.ClampToEdgeWrapping;

    // Shared uniforms
    const sharedUniforms = {
      projTex: { value: projTex },
      projMatrix: { value: new THREE.Matrix4() },
      projPos: { value: projector.position.clone() },
      baseColor: { value: new THREE.Color(0x1a1726) },
      gridColor: { value: new THREE.Color(0x2a2440) },
      gridScale: { value: 1.0 },
      texOpacity: { value: 1.0 },
    };
    const updateProjMatrix = () => {
      projector.updateMatrixWorld(true);
      sharedUniforms.projMatrix.value
        .copy(projector.projectionMatrix)
        .multiply(projector.matrixWorldInverse);
      sharedUniforms.projPos.value.copy(projector.position);
    };
    updateProjMatrix();

    const makeSurface = (geo, opts = {}) => {
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          projTex: sharedUniforms.projTex,
          projMatrix: sharedUniforms.projMatrix,
          projPos: sharedUniforms.projPos,
          texOpacity: sharedUniforms.texOpacity,
          baseColor: { value: new THREE.Color(opts.base ?? 0x1a1726) },
          gridColor: { value: new THREE.Color(opts.grid ?? 0x2a2440) },
          gridScale: { value: opts.gridScale ?? 1.0 },
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
      });
      const mesh = new THREE.Mesh(geo, mat);
      return mesh;
    };

    // ── Room geometry ────────────────────────────────
    const ROOM = { w: 9, h: 4, d: 7, floor: 0 };
    // floor
    const floor = makeSurface(new THREE.PlaneGeometry(ROOM.w * 1.4, ROOM.d * 1.6), {
      base: 0x16121f, grid: 0x2d2548, gridScale: 1.0,
    });
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, ROOM.floor, 0.5);
    scene.add(floor);

    // back wall
    const backWall = makeSurface(new THREE.PlaneGeometry(ROOM.w, ROOM.h * 1.4), {
      base: 0x191527, grid: 0x322a4d, gridScale: 1.0,
    });
    backWall.position.set(0, ROOM.h / 2, -ROOM.d / 2 + 1.3);
    scene.add(backWall);

    // left wall
    const leftWall = makeSurface(new THREE.PlaneGeometry(ROOM.d, ROOM.h * 1.4), {
      base: 0x141021, grid: 0x29224a, gridScale: 1.0,
    });
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-ROOM.w / 2, ROOM.h / 2, 0);
    scene.add(leftWall);

    // right wall
    const rightWall = makeSurface(new THREE.PlaneGeometry(ROOM.d, ROOM.h * 1.4), {
      base: 0x141021, grid: 0x29224a, gridScale: 1.0,
    });
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(ROOM.w / 2, ROOM.h / 2, 0);
    scene.add(rightWall);

    // ── Obstacle group (filled per scene by applyScene below) ──
    const obstacleGroup = new THREE.Group();
    scene.add(obstacleGroup);

    const makeObstacle = (o) => {
      let geo;
      const sz = o.size || {};
      switch (o.type) {
        case 'box':
          geo = new THREE.BoxGeometry(
            ...(Array.isArray(sz) ? sz : [sz.w || 1, sz.h || 1, sz.d || 1]),
          );
          break;
        case 'cyl':
          geo = new THREE.CylinderGeometry(sz.r ?? 0.3, sz.r ?? 0.3, sz.h ?? 1.5, 32, 1, true);
          break;
        case 'sphere':
          geo = new THREE.SphereGeometry(sz.r ?? 0.5, 32, 16);
          break;
        case 'torus':
          geo = new THREE.TorusGeometry(sz.r ?? 0.4, sz.t ?? 0.05, 16, 48);
          break;
        default:
          return null;
      }
      const mesh = makeSurface(geo, o.mat || {});
      mesh.material.side = THREE.DoubleSide;
      if (o.pos) mesh.position.set(...o.pos);
      if (o.rot) mesh.rotation.set(...o.rot);
      return mesh;
    };

    // ── Magic spot marker (a soft ring you can stand "inside") ──
    const markerGroup = new THREE.Group();
    const ringGeo = new THREE.RingGeometry(0.32, 0.42, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff2e7e, transparent: true, opacity: 0.85, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(MAGIC_POS.x, 0.005, MAGIC_POS.z);
    markerGroup.add(ring);

    // vertical light column to mark position
    const colGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.6, 16);
    const colMat = new THREE.MeshBasicMaterial({
      color: 0xff2e7e, transparent: true, opacity: 0.45,
    });
    const lightCol = new THREE.Mesh(colGeo, colMat);
    lightCol.position.set(MAGIC_POS.x, 0.8, MAGIC_POS.z);
    markerGroup.add(lightCol);

    // floating eye marker at exact magic camera height
    const eyeGeo = new THREE.SphereGeometry(0.08, 24, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xd4ff3a });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.copy(MAGIC_POS);
    markerGroup.add(eye);

    scene.add(markerGroup);

    // ── Projector frustum visualization (toggleable) ────
    const frustumGroup = new THREE.Group();
    const frustumMat = new THREE.LineBasicMaterial({
      color: 0xd4ff3a, transparent: true, opacity: 0.55,
    });
    const buildFrustumLines = () => {
      frustumGroup.clear();
      const near = 0.1, far = 8;
      const corners = [];
      [near, far].forEach((dist) => {
        const h = 2 * dist * Math.tan((projector.fov * Math.PI / 180) / 2);
        const w = h * projector.aspect;
        for (const sy of [1, -1]) for (const sx of [-1, 1]) {
          const v = new THREE.Vector3(sx * w / 2, sy * h / 2, -dist).applyMatrix4(projector.matrixWorld);
          corners.push(v);
        }
      });
      // edges: connect near-corners (0..3) to far-corners (4..7)
      const edges = [
        [0, 1], [1, 3], [3, 2], [2, 0], // near
        [4, 5], [5, 7], [7, 6], [6, 4], // far
        [0, 4], [1, 5], [2, 6], [3, 7], // sides
      ];
      edges.forEach(([a, b]) => {
        const geo = new THREE.BufferGeometry().setFromPoints([corners[a], corners[b]]);
        frustumGroup.add(new THREE.Line(geo, frustumMat));
      });
    };
    buildFrustumLines();
    frustumGroup.visible = false;
    scene.add(frustumGroup);

    // ── Apply a scene config: rebuild obstacles, retarget projector & markers ──
    const applyScene = (idx) => {
      const cfg = SCENES[idx] || SCENES[0];
      // Clear old obstacles
      while (obstacleGroup.children.length) {
        const m = obstacleGroup.children[0];
        obstacleGroup.remove(m);
        if (m.geometry) m.geometry.dispose();
        if (m.material) m.material.dispose();
      }
      // Build new obstacles
      (cfg.obstacles || []).forEach((o) => {
        const m = makeObstacle(o);
        if (m) obstacleGroup.add(m);
      });
      // Update magic position/look in place so all closures stay in sync
      MAGIC_POS.set(...cfg.magicPos);
      MAGIC_LOOK.set(...cfg.magicLook);
      // Update projector
      projector.position.copy(MAGIC_POS);
      projector.lookAt(MAGIC_LOOK);
      projector.fov = cfg.fov;
      projector.updateProjectionMatrix();
      projector.updateMatrixWorld(true);
      updateProjMatrix();
      // Reposition markers
      ring.position.set(MAGIC_POS.x, 0.005, MAGIC_POS.z);
      lightCol.position.set(MAGIC_POS.x, 0.8, MAGIC_POS.z);
      eye.position.copy(MAGIC_POS);
      // Rebuild frustum lines
      buildFrustumLines();
    };
    applyScene(0);

    // ── Mouse / touch orbit controls ─────────────────────
    const dom = renderer.domElement;
    let isDown = false;
    let lastX = 0, lastY = 0;

    const onDown = (e) => {
      isDown = true;
      setDragging(true);
      const pt = e.touches ? e.touches[0] : e;
      lastX = pt.clientX; lastY = pt.clientY;
    };
    const onMove = (e) => {
      if (!isDown) return;
      const pt = e.touches ? e.touches[0] : e;
      const dx = pt.clientX - lastX;
      const dy = pt.clientY - lastY;
      lastX = pt.clientX; lastY = pt.clientY;
      orbit.theta -= dx * 0.005;
      orbit.phi -= dy * 0.005;
      orbit.phi = Math.max(0.18, Math.min(Math.PI - 0.18, orbit.phi));
      // cancel any in-progress snap
      stateRef.current.snapping = null;
      applyOrbit();
    };
    const onUp = () => { isDown = false; setDragging(false); };
    const onWheel = (e) => {
      e.preventDefault();
      orbit.radius *= 1 + e.deltaY * 0.0012;
      orbit.radius = Math.max(1.2, Math.min(9, orbit.radius));
      stateRef.current.snapping = null;
      applyOrbit();
    };

    dom.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    dom.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    applyOrbit();

    // ── Animation loop ────────────────────────────────
    let t0 = performance.now();
    let raf = 0;
    const tmpV = new THREE.Vector3();
    const camDir = new THREE.Vector3();
    const magicDir = new THREE.Vector3();

    const tick = () => {
      const now = performance.now();
      const dt = (now - t0) / 1000;
      t0 = now;

      // Recompute magic direction each frame (scene may have changed)
      magicDir.subVectors(MAGIC_LOOK, MAGIC_POS).normalize();

      // Snap animation
      const snap = stateRef.current.snapping;
      if (snap) {
        snap.t += dt / snap.duration;
        const k = easeInOut(Math.min(1, snap.t));
        if (snap.fromTarget && snap.toTarget) {
          orbit.target.lerpVectors(snap.fromTarget, snap.toTarget, k);
        }
        orbit.theta = lerp(snap.from.theta, snap.to.theta, k);
        orbit.phi = lerp(snap.from.phi, snap.to.phi, k);
        orbit.radius = lerp(snap.from.radius, snap.to.radius, k);
        applyOrbit();
        if (snap.t >= 1) stateRef.current.snapping = null;
      }

      // Pulse marker
      const pulse = 1 + 0.12 * Math.sin(now * 0.005);
      ring.scale.setScalar(pulse);
      eye.scale.setScalar(0.8 + 0.2 * Math.sin(now * 0.004));

      // Alignment metric
      const posDist = camera.position.distanceTo(MAGIC_POS);
      camera.getWorldDirection(camDir);
      const dirDot = camDir.dot(magicDir);
      const posScore = Math.max(0, 1 - posDist / 2.0);
      const dirScore = Math.max(0, (dirDot - 0.85) / 0.15);
      const align = Math.pow(posScore * dirScore, 0.65); // 0..1
      const alignPct = Math.round(align * 100);

      // smoothed
      if (stateRef.current.alignSmooth == null) stateRef.current.alignSmooth = alignPct;
      stateRef.current.alignSmooth += (alignPct - stateRef.current.alignSmooth) * 0.18;
      const smoothed = Math.round(stateRef.current.alignSmooth);
      if (smoothed !== stateRef.current.lastReportedAlign) {
        stateRef.current.lastReportedAlign = smoothed;
        setAlignment(smoothed);
        setLocked(smoothed >= 92);
      }

      // Fade marker as you get close (don't block the view)
      const fade = Math.max(0.05, 1 - Math.max(0, smoothed - 60) / 40);
      ringMat.opacity = 0.85 * fade;
      colMat.opacity = 0.45 * fade;
      eyeMat.opacity = fade;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    // ── Resize ────────────────────────────────────────
    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    // ── Expose handles to React ───────────────────────
    stateRef.current = {
      ...stateRef.current,
      orbit, applyOrbit,
      MAGIC_POS, MAGIC_LOOK,
      camera, projector, projTex, artCanvas,
      frustumGroup, markerGroup,
      buildFrustumLines, updateProjMatrix,
      setSnap: (toPos, toLook, duration = 1.4) => {
        // Compute target orbit (relative to NEW look-at point)
        const targetRadius = toPos.distanceTo(toLook);
        const targetTheta = Math.atan2(toPos.x - toLook.x, toPos.z - toLook.z);
        const targetPhi = Math.acos((toPos.y - toLook.y) / targetRadius);
        // shortest angular path
        let dt = targetTheta - orbit.theta;
        while (dt > Math.PI) dt -= Math.PI * 2;
        while (dt < -Math.PI) dt += Math.PI * 2;
        const targetThetaWrapped = orbit.theta + dt;
        stateRef.current.snapping = {
          t: 0, duration,
          fromTarget: orbit.target.clone(),
          toTarget: toLook.clone(),
          from: { theta: orbit.theta, phi: orbit.phi, radius: orbit.radius },
          to: { theta: targetThetaWrapped, phi: targetPhi, radius: targetRadius },
        };
      },
      applyScene,
    };

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
      dom.removeEventListener('mousedown', onDown);
      dom.removeEventListener('touchstart', onDown);
      dom.removeEventListener('wheel', onWheel);
      renderer.dispose();
      projTex.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  /* ── Swap scene + artwork when imageIndex changes ───── */
  const firstSceneRef = useRef(true);
  useEffect(() => {
    const s = stateRef.current;
    if (!s || !s.projTex || !s.applyScene) return;
    // Pick the canvas for this slot
    let newCanvas;
    if (imageIndex === 5) {
      if (!userImage) return; // wait for upload
      newCanvas = userImage;
    } else {
      newCanvas = makeArtwork(imageIndex);
    }
    // Rebuild the room layout for this scene
    s.applyScene(imageIndex);
    // Update projected texture
    s.projTex.image = newCanvas;
    s.projTex.needsUpdate = true;
    s.artCanvas = newCanvas;
    // Animate camera to this scene's wide view (skip on first mount)
    if (firstSceneRef.current) {
      firstSceneRef.current = false;
      return;
    }
    const cfg = SCENES[imageIndex] || SCENES[0];
    if (cfg.wide && s.setSnap) {
      s.setSnap(
        new THREE.Vector3(...cfg.wide.pos),
        new THREE.Vector3(...cfg.wide.look),
        1.1,
      );
    }
  }, [imageIndex, userImage]);

  /* ── Toggle frustum lines ───────────────────────────── */
  useEffect(() => {
    const s = stateRef.current;
    if (!s || !s.frustumGroup) return;
    s.frustumGroup.visible = showFrustum;
  }, [showFrustum]);

  /* ── Toggle marker ──────────────────────────────────── */
  useEffect(() => {
    const s = stateRef.current;
    if (!s || !s.markerGroup) return;
    s.markerGroup.visible = showMarker;
  }, [showMarker]);

  /* ── Snap handlers ──────────────────────────────────── */
  const snapToMagic = () => {
    const s = stateRef.current;
    if (!s.setSnap) return;
    s.setSnap(s.MAGIC_POS, s.MAGIC_LOOK, 1.4);
  };
  const snapToWide = () => {
    const s = stateRef.current;
    if (!s.setSnap) return;
    const wide = (SCENES[imageIndex] || SCENES[0]).wide;
    s.setSnap(
      new THREE.Vector3(...wide.pos),
      new THREE.Vector3(...wide.look),
      1.2,
    );
  };

  /* ── Hint copy keyed to alignment ───────────────────── */
  const hint =
    locked ? { title: 'Locked in', body: 'This is the magic viewpoint. The artwork lives here.' } :
    alignment > 70 ? { title: 'Almost there', body: 'A small movement separates fragments from a finished image.' } :
    alignment > 35 ? { title: 'Getting warm', body: 'You can feel pieces wanting to line up. Keep adjusting.' } :
    { title: 'Drag to explore', body: 'The artwork is shattered across walls, the floor, and props. One viewpoint resolves it. The pink ring marks where to stand.' };

  const alignClass =
    locked ? 'locked' :
    alignment > 60 ? '' :
    alignment > 25 ? 'warm' : 'cold';

  return (
    <>
      <style>{STYLES}</style>
      <div className="pp-root">
        <div
          ref={mountRef}
          style={{ position: 'absolute', inset: 0 }}
          className={dragging ? 'dragging' : ''}
        />

        {/* Scene picker */}
        <div className="pp-picker">
          {[
            { label: 'L', title: 'PHOTOPARK wordmark' },
            { label: 'H', title: 'Love heart' },
            { label: 'S', title: 'Scan-me decal' },
            { label: 'B', title: 'Beach paradise' },
            { label: 'P', title: 'Leaning Tower of Pisa' },
          ].map((t, i) => (
            <button
              key={i}
              className={`pp-tab ${i === imageIndex ? 'active' : ''}`}
              onClick={() => setImageIndex(i)}
              title={t.title}
            >
              {t.label}
            </button>
          ))}
          <button
            className={`pp-tab pp-tab-upload ${5 === imageIndex ? 'active' : ''} ${userImage ? 'has' : ''}`}
            onClick={() => {
              if (userImage && imageIndex !== 5) {
                setImageIndex(5);
              } else {
                fileInputRef.current?.click();
              }
            }}
            title={
              userImage
                ? (imageIndex === 5 ? 'Click to load a different image' : 'Your image — click to view, click again to swap')
                : 'Upload your own image'
            }
          >
            +
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>

        {/* Top HUD */}
        <div className="pp-hud-top">
          <div className="pp-badge">
            PHOTOPARK
            <div className="pp-sub">AR · FORCED PERSPECTIVE · PROTOTYPE</div>
          </div>
          <div className={`pp-align ${alignClass}`}>
            <div className="pp-l">Alignment</div>
            <div className="pp-v">
              {alignment}<span className="pp-pct">%</span>
            </div>
            <div className="pp-bar">
              <div
                className="pp-bar-fill"
                style={{ transform: `scaleX(${alignment / 100})` }}
              />
            </div>
          </div>
        </div>

        {/* Lock-on banner */}
        <div className={`pp-lock ${locked ? 'show' : ''}`}>
          <div className="pp-lock-t">PERFECT SHOT</div>
          <div className="pp-lock-s">FOUND THE ANGLE</div>
        </div>

        {/* Bottom HUD */}
        <div className="pp-hud-bot">
          <div className={`pp-hint ${alignClass}`}>
            <b>{hint.title}</b>
            {hint.body}
          </div>
          <div className="pp-controls">
            <button
              className={`pp-btn ghost ${showMarker ? 'on' : ''}`}
              onClick={() => setShowMarker(s => !s)}
            >
              Marker
            </button>
            <button
              className={`pp-btn ghost ${showFrustum ? 'on' : ''}`}
              onClick={() => setShowFrustum(s => !s)}
            >
              Show rays
            </button>
            <button className="pp-btn" onClick={snapToWide}>
              Wide view
            </button>
            <button className="pp-btn primary" onClick={snapToMagic}>
              Snap to spot
            </button>
          </div>
        </div>

        {/* Intro */}
        {showIntro && (
          <div className="pp-intro">
            <div className="pp-intro-card">
              <h1>FIND THE<br />MAGIC ANGLE</h1>
              <div className="pp-kicker">PHOTOPARK · AR ATTRACTION PROTOTYPE</div>
              <p>
                A single artwork is "painted" across walls, floor, a column, and a hoop —
                fragmented from every angle except one.
              </p>
              <ul>
                <li><b>Drag</b> to look around the room</li>
                <li><b>Scroll</b> to move closer or further</li>
                <li>Find the <b>pink ring</b> on the floor — that's where to stand</li>
                <li>Hit <b>Snap to spot</b> for the pitch reveal</li>
                <li>Use the <b>+</b> tab to project <b>your own image</b></li>
              </ul>
              <button className="pp-intro-go" onClick={() => setShowIntro(false)}>
                Enter the installation →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
