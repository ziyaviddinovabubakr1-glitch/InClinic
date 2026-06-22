"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme";
/*
  ╔══════════════════════════════════════════════════════════════════╗
  ║   InClinic Signature Visual Environment                         ║
  ║                                                                  ║
  ║   Layer 0 — Static hero image (composition locked)              ║
  ║   Layer 1 — Animated stars + meteors (sky)                    ║
  ║   Layer 2 — Animated atmosphere (orbs, particles, glow)       ║
  ║   Layer 3 — Animated ocean surface (ripples below horizon)    ║
  ║   Layer 4 — Animated moon reflections (shimmer on water)      ║
  ╚══════════════════════════════════════════════════════════════════╝
*/

/* ── Scene constants (aligned with hero-scene-base.png) ─────────── */
export const OCEAN_HORIZON = 0.50;
const BASE_SCENE_SRC = "/hero-scene-base.png";
const MOON_CENTER_X  = 0.50;

function n2(x: number, y: number, t: number): number {
  return (
    Math.sin(x * 2.13 + t * 0.31) * Math.cos(y * 1.87 + t * 0.23) * 0.50 +
    Math.sin(x * 1.13 - y * 2.27 + t * 0.19) * 0.28 +
    Math.cos(x * 3.07 + y * 0.91 + t * 0.17) * 0.22
  );
}

/* ── Types ───────────────────────────────────────────────────────── */
interface Orb {
  ox: number; oy: number;   // orbit origin (fraction relative to centre)
  ax: number; ay: number;   // orbit amplitude
  fx: number; fy: number;   // orbit frequency (rad/s)
  px: number; py: number;   // phase offset
  radius: number;           // fraction of max(w,h)
  r: number; g: number; b: number;
  baseAlpha: number;
}
interface LightSpot {
  ox: number; oy: number;
  ax: number; ay: number;
  fx: number; fy: number;
  px: number; py: number;
  radius: number;
  baseAlpha: number;
}
interface Particle {
  x: number; y: number;
  px: number; py: number;
  life: number; maxLife: number;
  speed: number;
}
interface Star {
  x: number; y: number;
  size: number;
  phase: number;
  speed: number;
  bright: number;
  rays: boolean;
}
interface Meteor {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  maxLife: number;
  len: number;
}

/* ── Scene data ──────────────────────────────────────────────────── */

/* Three soft orbs — calm medical atmosphere */
const ORBS: Orb[] = [
  { ox: 0.00, oy: 0.00, ax: 0.22, ay: 0.22, fx: 0.028, fy: 0.032, px: 0.52, py: 5.00, radius: 0.72, r:  2, g:  9, b:  52, baseAlpha: 0.07 },
  { ox:-0.10, oy:-0.06, ax: 0.18, ay: 0.20, fx: 0.042, fy: 0.055, px: 1.05, py: 0.52, radius: 0.58, r:  3, g: 15, b:  80, baseAlpha: 0.06 },
  { ox: 0.08, oy: 0.12, ax: 0.16, ay: 0.18, fx: 0.050, fy: 0.062, px: 3.14, py: 0.78, radius: 0.48, r:  0, g: 68, b: 148, baseAlpha: 0.05 },
];

/* Four drifting clinical light focuses (periods 50–100 s) */
const LIGHTS: LightSpot[] = [
  { ox: 0.05, oy:-0.10, ax: 0.22, ay: 0.18, fx: 0.100, fy: 0.075, px: 0.00, py: 2.09, radius: 0.21, baseAlpha: 0.062 },
  { ox:-0.10, oy: 0.08, ax: 0.18, ay: 0.20, fx: 0.078, fy: 0.110, px: 1.57, py: 0.79, radius: 0.18, baseAlpha: 0.052 },
  { ox: 0.10, oy: 0.12, ax: 0.15, ay: 0.17, fx: 0.120, fy: 0.068, px: 3.14, py: 3.49, radius: 0.16, baseAlpha: 0.048 },
  { ox:-0.05, oy:-0.14, ax: 0.20, ay: 0.15, fx: 0.058, fy: 0.092, px: 4.19, py: 1.18, radius: 0.17, baseAlpha: 0.042 },
];

/* ── Intensity export type (backwards-compatible) ────────────────── */
export type WaveIntensity = "hero" | "strong" | "medium" | "subtle";

interface Props {
  fixed?:     boolean;
  intensity?: WaveIntensity;
}

/* ═══════════════════════════════════════════════════════════════════
   Component
═══════════════════════════════════════════════════════════════════ */
export default function WaveBackground({ fixed = false, intensity }: Props) {
  const { theme } = useTheme();
  const isLight   = theme === "light";
  const preset    = intensity ?? (fixed ? "strong" : "hero");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const ctxRaw = canvasEl.getContext("2d");
    if (!ctxRaw) return;
    // Capture into non-null consts so narrowing survives inside nested draw fns.
    const canvas = canvasEl;
    const ctx = ctxRaw;

    /* intensity scale factor */
    const IM = preset === "subtle" ? 0.35 : preset === "medium" ? 0.55 : 0.75;

    /* particle count — capped for performance */
    const pCount = Math.floor(
      (preset === "subtle" ? 18 : preset === "medium" ? 24 : 30) * (isLight ? 0.45 : 1),
    );

    /* ── Initialise scene objects ──────────────────────────────── */
    const particles: Particle[] = Array.from({ length: pCount }, () => {
      const ml = 260 + Math.random() * 380;
      return {
        x: Math.random(), y: Math.random(),
        px: 0, py: 0,
        life: Math.random() * ml, maxLife: ml,
        speed: 0.00022 + Math.random() * 0.00042,
      };
    });

    const stars: Star[] = Array.from({ length: isLight ? 24 : 30 }, () => {
      const tier = Math.random();
      if (isLight) {
        return {
          x: Math.random(),
          y: Math.random() * 0.55,
          size: tier < 0.45
            ? 1.0 + Math.random() * 1.0
            : tier < 0.82
              ? 1.6 + Math.random() * 1.3
              : 2.4 + Math.random() * 1.6,
          phase: Math.random() * Math.PI * 2,
          speed: 0.55 + Math.random() * 1.6,
          bright: 0.62 + Math.random() * 0.38,
          rays: tier > 0.55,
        };
      }
      return {
        x: Math.random(),
        y: Math.random() * 0.55,
        size: tier < 0.55
          ? 0.75 + Math.random() * 0.85
          : tier < 0.88
            ? 1.35 + Math.random() * 1.15
            : 2.1 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        speed: 0.55 + Math.random() * 1.6,
        bright: 0.55 + Math.random() * 0.45,
        rays: tier > 0.55,
      };
    });

    const meteors: Meteor[] = [];
    const enableMeteors = false;
    let spawnTimer = 999;
    let showerCooldown = 999;

    /* ── Canvas sizing ─────────────────────────────────────────── */
    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);
    resize();

    /* ══════════════════════════════════════════════════════════
       LAYER 0 — Medical-grade dark base
       Painted first every frame to clear the canvas.
       This is what makes the canvas self-contained
       (html/body can be transparent).
    ══════════════════════════════════════════════════════════ */
    function drawBase() {
      const g = ctx.createLinearGradient(0, 0, w, h);
      if (isLight) {
        g.addColorStop(0.00, "#f6fbfd");
        g.addColorStop(0.35, "#f8fcfe");
        g.addColorStop(0.65, "#f3f9fc");
        g.addColorStop(1.00, "#f6fbfd");
      } else {
        g.addColorStop(0.00, "#061428");
        g.addColorStop(0.40, "#0a2240");
        g.addColorStop(0.70, "#0c2d52");
        g.addColorStop(1.00, "#061428");
      }
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const skyG = ctx.createLinearGradient(0, 0, 0, h * 0.56);
      if (isLight) {
        skyG.addColorStop(0, "rgba(56,189,248,0.28)");
        skyG.addColorStop(0.35, "rgba(125,211,252,0.16)");
        skyG.addColorStop(0.7, "rgba(186,230,253,0.06)");
        skyG.addColorStop(1, "rgba(186,230,253,0)");
      } else {
        skyG.addColorStop(0, "rgba(14,165,233,0.14)");
        skyG.addColorStop(0.4, "rgba(56,189,248,0.06)");
        skyG.addColorStop(1, "rgba(56,189,248,0)");
      }
      ctx.fillStyle = skyG;
      ctx.fillRect(0, 0, w, h * 0.56);
    }

    /* ══════════════════════════════════════════════════════════
       LAYER 0.5 — Living sinusoidal waves (blue + white)
    ══════════════════════════════════════════════════════════ */
    function drawWaves(t: number) {
      const layers = isLight
        ? [
            { amp: 22, freq: 0.0042, speed: 0.42, yOff: 0.68, alpha: 0.10, color: "56,189,248" },
            { amp: 28, freq: 0.0035, speed: 0.32, yOff: 0.82, alpha: 0.12, color: "14,165,233" },
          ]
        : [
            { amp: 22, freq: 0.0042, speed: 0.42, yOff: 0.68, alpha: 0.08, color: "186,230,253" },
            { amp: 28, freq: 0.0035, speed: 0.32, yOff: 0.82, alpha: 0.10, color: "56,189,248" },
          ];

      for (const layer of layers) {
        const baseY = h * layer.yOff;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 4) {
          const y = baseY +
            Math.sin(x * layer.freq + t * layer.speed) * layer.amp +
            Math.sin(x * layer.freq * 1.7 + t * layer.speed * 0.6 + 1.2) * layer.amp * 0.35;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, baseY - layer.amp, 0, h);
        g.addColorStop(0, `rgba(${layer.color},${layer.alpha})`);
        g.addColorStop(1, `rgba(${layer.color},0)`);
        ctx.fillStyle = g;
        ctx.fill();
      }

      if (!isLight && preset !== "subtle") {
        ctx.lineWidth = 1;
        const baseY = h * 0.62;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const y = baseY + Math.sin(x * 0.004 + t * 0.35) * 16;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.stroke();
      }
    }

    /* ══════════════════════════════════════════════════════════
       LAYER 3 — Animated ocean surface (overlay on base image)
    ══════════════════════════════════════════════════════════ */
    function drawOceanSurface(t: number) {
      const horizon = h * OCEAN_HORIZON;
      ctx.save();
      ctx.globalCompositeOperation = "soft-light";

      const bands = [
        { yOff: 0.02, amp: 5,  freq: 0.009, speed: 0.9, alpha: 0.22 },
        { yOff: 0.10, amp: 8,  freq: 0.007, speed: 0.65, alpha: 0.18 },
        { yOff: 0.22, amp: 11, freq: 0.0055, speed: 0.48, alpha: 0.14 },
        { yOff: 0.38, amp: 14, freq: 0.0042, speed: 0.35, alpha: 0.10 },
      ];

      for (const band of bands) {
        const baseY = horizon + (h - horizon) * band.yOff;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 3) {
          const y = baseY +
            Math.sin(x * band.freq + t * band.speed) * band.amp +
            Math.sin(x * band.freq * 1.6 + t * band.speed * 0.55 + 1.4) * band.amp * 0.35;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, baseY - band.amp, 0, h);
        g.addColorStop(0, `rgba(56,189,248,${band.alpha})`);
        g.addColorStop(1, "rgba(14,165,233,0)");
        ctx.fillStyle = g;
        ctx.fill();
      }

      ctx.globalCompositeOperation = "overlay";
      for (let i = 0; i < 5; i++) {
        const rowY = horizon + (h - horizon) * (0.06 + i * 0.17);
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const y = rowY + Math.sin(x * (0.006 + i * 0.0015) + t * (0.7 + i * 0.12) + i) * (4 + i * 2);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(186,230,253,${0.05 + i * 0.015})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.restore();
    }

    /* ══════════════════════════════════════════════════════════
       LAYER 4 — Animated moon reflections (shimmer column)
    ══════════════════════════════════════════════════════════ */
    function drawReflections(t: number) {
      const horizon = h * OCEAN_HORIZON;
      const mx = w * MOON_CENTER_X;
      const waterH = h - horizon;

      ctx.save();
      ctx.globalCompositeOperation = "screen";

      for (let row = 0; row < Math.floor(waterH / 5); row++) {
        const y = horizon + row * 5;
        const depth = row * 5 / waterH;
        const wave = Math.sin(y * 0.055 + t * 2.4) * 10 +
                     Math.sin(y * 0.11 - t * 1.6 + 2) * 5;
        const breathe = 0.55 + 0.45 * Math.sin(t * 1.8 + row * 0.18);
        const alpha = Math.max(0, (0.34 - depth * 0.30) * breathe * IM);
        const halfW = (w * 0.11) * (1 - depth * 0.55) + wave * 0.15;

        const rg = ctx.createLinearGradient(mx - halfW, y, mx + halfW, y);
        rg.addColorStop(0, "rgba(210,235,255,0)");
        rg.addColorStop(0.35, `rgba(224,242,254,${alpha * 0.55})`);
        rg.addColorStop(0.5, `rgba(255,255,255,${alpha})`);
        rg.addColorStop(0.65, `rgba(224,242,254,${alpha * 0.55})`);
        rg.addColorStop(1, "rgba(210,235,255,0)");
        ctx.fillStyle = rg;
        ctx.fillRect(mx - halfW - 2, y, halfW * 2 + 4, 4);
      }

      for (let i = 0; i < 28; i++) {
        const gy = horizon + ((i * 47 + 13) % Math.floor(waterH * 0.92)) + 8;
        const gx = mx + Math.sin(t * 2.8 + i * 0.9) * (w * 0.04) +
                   Math.sin(gy * 0.08 + t * 1.4) * 18;
        const ga = 0.12 + 0.18 * Math.sin(t * 4.2 + i * 1.7);
        const gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, 6 + (i % 4));
        gg.addColorStop(0, `rgba(255,255,255,${ga * IM})`);
        gg.addColorStop(1, "rgba(186,230,253,0)");
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(gx, gy, 6 + (i % 4), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    /* ══════════════════════════════════════════════════════════
       LAYER 2b — Horizon atmosphere mist
    ══════════════════════════════════════════════════════════ */
    function drawHorizonMist(t: number) {
      const horizon = h * OCEAN_HORIZON;
      const drift = Math.sin(t * 0.22) * w * 0.02;

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const g = ctx.createLinearGradient(0, horizon - h * 0.12, 0, horizon + h * 0.08);
      g.addColorStop(0, "rgba(56,189,248,0)");
      g.addColorStop(0.45, `rgba(125,211,252,${0.06 * IM})`);
      g.addColorStop(0.72, `rgba(186,230,253,${0.10 * IM})`);
      g.addColorStop(1, "rgba(56,189,248,0)");
      ctx.fillStyle = g;
      ctx.fillRect(drift - w * 0.05, horizon - h * 0.12, w * 1.1, h * 0.2);

      const moonGlow = ctx.createRadialGradient(
        w * MOON_CENTER_X + drift * 0.3, horizon,
        0,
        w * MOON_CENTER_X, horizon,
        w * 0.22,
      );
      moonGlow.addColorStop(0, `rgba(224,242,254,${0.14 * IM})`);
      moonGlow.addColorStop(0.5, `rgba(56,189,248,${0.05 * IM})`);
      moonGlow.addColorStop(1, "rgba(56,189,248,0)");
      ctx.fillStyle = moonGlow;
      ctx.fillRect(0, horizon - h * 0.06, w, h * 0.14);
      ctx.restore();
    }


    /* ══════════════════════════════════════════════════════════
       LAYER 1 — Aurora atmosphere orbs
       10 large soft radial gradients drifting on independent
       Lissajous-like orbits.  Periods range 65–160 s so the
       pattern never visibly repeats.
    ══════════════════════════════════════════════════════════ */
    function drawOrbs(t: number, breathe: number) {
      const cx = w / 2, cy = h / 2;
      for (const orb of ORBS) {
        const ox = cx + (orb.ox + Math.sin(t * orb.fx + orb.px) * orb.ax) * w;
        const oy = cy + (orb.oy + Math.cos(t * orb.fy + orb.py) * orb.ay) * h;
        const r  = orb.radius * Math.max(w, h);
        const a  = orb.baseAlpha * IM * breathe * (isLight ? 0.4 : 1);
        const or = isLight ? 56  : orb.r;
        const og = isLight ? 189 : orb.g;
        const ob = isLight ? 248 : orb.b;

        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, r);
        g.addColorStop(0.00, `rgba(${or},${og},${ob},${a})`);
        g.addColorStop(0.45, `rgba(${or},${og},${ob},${a * 0.33})`);
        g.addColorStop(1.00, `rgba(${or},${og},${ob},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
    }

    /* ══════════════════════════════════════════════════════════
       LAYER 2 — Organic energy forms
       6 slow-rotating ellipses with in-canvas radial gradient
       fills — inspired by cellular cross-sections and bio-
       energy fields without literally drawing them.
    ══════════════════════════════════════════════════════════ */
    function drawEnergyForms(_t: number) {
      /* disabled — calm UI */
    }

    /* ══════════════════════════════════════════════════════════
       LAYER 3 — Cellular flow-field particles
       Organic drifting micro-elements following a smooth noise
       vector field — inspired by cells in biological fluid and
       blood-flow dynamics.
    ══════════════════════════════════════════════════════════ */
    function drawFlowParticles(t: number) {
      for (const p of particles) {
        p.life += 1;
        if (p.life > p.maxLife) {
          p.x = Math.random(); p.y = Math.random(); p.life = 0;
        }
        p.px = p.x; p.py = p.y;

        const angle = (n2(p.x * 3.1, p.y * 3.1, t * 0.14) +
                       n2(p.x * 3.1 + 55, p.y * 3.1 + 55, t * 0.14)) * Math.PI * 2;
        p.x += Math.cos(angle) * p.speed;
        p.y += Math.sin(angle) * p.speed;

        if (p.x < -0.01) p.x = 1.01;  if (p.x > 1.01) p.x = -0.01;
        if (p.y < -0.01) p.y = 1.01;  if (p.y > 1.01) p.y = -0.01;

        const lifeRatio = p.life / p.maxLife;
        const a = Math.sin(lifeRatio * Math.PI) * 0.22 * IM;
        const px = p.x * w;
        const py = p.y * h;

        ctx.beginPath();
        ctx.arc(px, py, 0.9, 0, Math.PI * 2);
        ctx.fillStyle = isLight
          ? `rgba(14,165,233,${a})`
          : `rgba(186,230,253,${a})`;
        ctx.fill();
      }
    }

    /* ══════════════════════════════════════════════════════════
       LAYER 4 — Twinkling stars (sky above waves)
    ══════════════════════════════════════════════════════════ */
    const SKY_LIMIT = isLight ? 0.58 : OCEAN_HORIZON;

    function drawStars(t: number) {
      const skyH = h * SKY_LIMIT;

      for (const star of stars) {
        const sx = star.x * w;
        const sy = star.y * h;
        if (sy > skyH) continue;

        if (isLight) {
          const twinkle = 0.65 + 0.35 * Math.sin(t * star.speed + star.phase);
          const a = star.bright * twinkle * IM * 2.2;
          const r = star.size;
          const tintRgb = "14,165,233";
          const rayRgb  = "2,132,199";
          const haloRgb = "56,189,248";

          const haloR = r * 1.4;
          const hg = ctx.createRadialGradient(sx, sy, 0, sx, sy, haloR);
          hg.addColorStop(0, `rgba(255,255,255,${Math.min(1, a * 0.95)})`);
          hg.addColorStop(0.3, `rgba(${tintRgb},${a * 0.55})`);
          hg.addColorStop(0.65, `rgba(${haloRgb},${a * 0.28})`);
          hg.addColorStop(1, `rgba(${haloRgb},0)`);
          ctx.fillStyle = hg;
          ctx.beginPath();
          ctx.arc(sx, sy, haloR, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(0.75, r * 0.3), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rayRgb},${Math.min(1, a * 1.1)})`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(0.4, r * 0.14), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${Math.min(1, a * 1.4)})`;
          ctx.fill();

          const rayLen = star.rays
            ? r * (1.35 + twinkle * 0.85) * (star.bright > 0.8 ? 1.4 : 1)
            : r * (0.75 + twinkle * 0.45);

          if (rayLen > 0.6) {
            ctx.lineCap = "round";
            for (let i = 0; i < 4; i++) {
              const ang = i * (Math.PI / 2) + star.phase * 0.25;
              const ex = sx + Math.cos(ang) * rayLen;
              const ey = sy + Math.sin(ang) * rayLen;
              const rg = ctx.createLinearGradient(sx, sy, ex, ey);
              rg.addColorStop(0,   `rgba(255,255,255,${Math.min(1, a * 1.15)})`);
              rg.addColorStop(0.3, `rgba(${tintRgb},${a * 0.85})`);
              rg.addColorStop(0.7, `rgba(${rayRgb},${a * 0.5})`);
              rg.addColorStop(1,   `rgba(${haloRgb},0)`);
              ctx.strokeStyle = rg;
              ctx.lineWidth = Math.max(0.55, r * 0.17);
              ctx.beginPath();
              ctx.moveTo(sx, sy);
              ctx.lineTo(ex, ey);
              ctx.stroke();
            }
          }
          continue;
        }

        const tintRgb  = "255,255,255";
        const rayRgb   = "224,242,254";
        const haloRgb  = "186,230,253";
        const twinkle = 0.5 + 0.5 * Math.sin(t * star.speed + star.phase);
        const a = star.bright * twinkle * IM * 1.3;
        const r = star.size;

        const haloR = r * 1.15;
        const hg = ctx.createRadialGradient(sx, sy, 0, sx, sy, haloR);
        hg.addColorStop(0, `rgba(${tintRgb},${Math.min(1, a * 1.1)})`);
        hg.addColorStop(0.4, `rgba(${haloRgb},${a * 0.28})`);
        hg.addColorStop(1, `rgba(${haloRgb},0)`);
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(sx, sy, haloR, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.5, r * 0.2), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${tintRgb},${Math.min(1, a * 1.55)})`;
        ctx.fill();

        const rayLen = star.rays
          ? r * (1.1 + twinkle * 0.7) * (star.bright > 0.75 ? 1.35 : 1)
          : r * (0.55 + twinkle * 0.35);

        if (rayLen > 0.6) {
          ctx.lineCap = "round";
          for (let i = 0; i < 4; i++) {
            const ang = i * (Math.PI / 2) + star.phase * 0.25;
            const ex = sx + Math.cos(ang) * rayLen;
            const ey = sy + Math.sin(ang) * rayLen;
            const rg = ctx.createLinearGradient(sx, sy, ex, ey);
            rg.addColorStop(0,   `rgba(${tintRgb},${Math.min(1, a * 1.2)})`);
            rg.addColorStop(0.35, `rgba(${rayRgb},${a * 0.7})`);
            rg.addColorStop(1,   `rgba(${haloRgb},0)`);
            ctx.strokeStyle = rg;
            ctx.lineWidth = Math.max(0.4, r * 0.13);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
            ctx.stroke();
          }
        }
      }
    }

    function spawnMeteor() {
      const skyH = h * SKY_LIMIT;
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.4;
      const speed = isLight ? 280 + Math.random() * 220 : 240 + Math.random() * 200;
      meteors.push({
        x: Math.random() * w * 1.05 - w * 0.05,
        y: Math.random() * skyH * 0.42 + skyH * 0.02,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.7 + Math.random() * 0.55,
        len: isLight ? 90 + Math.random() * 110 : 65 + Math.random() * 95,
      });
    }

    function updateMeteors(dt: number) {
      if (!enableMeteors) return;
      spawnTimer -= dt;
      showerCooldown -= dt;

      const maxActive = isLight ? 3 : 2;
      const spawnGap  = isLight ? 2 + Math.random() * 3 : 3.5 + Math.random() * 5;
      const showerGap = isLight ? 14 + Math.random() * 12 : 22 + Math.random() * 18;

      if (spawnTimer <= 0 && meteors.length < maxActive) {
        spawnMeteor();
        spawnTimer = spawnGap;
      }

      if (showerCooldown <= 0 && meteors.length < maxActive + 1) {
        const burst = isLight ? 2 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < burst; i++) spawnMeteor();
        showerCooldown = showerGap;
        spawnTimer = isLight ? 1.2 : 2;
      }

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.life += dt;
        const skyH = h * SKY_LIMIT;
        if (m.life > m.maxLife || m.y > skyH + 40 || m.x > w + 120 || m.x < -120) {
          meteors.splice(i, 1);
        }
      }
    }

    function drawMeteors() {
      const skyH = h * SKY_LIMIT;

      for (const m of meteors) {
        if (m.y > skyH + 20) continue;

        const fade = 1 - (m.life / m.maxLife) ** 1.6;
        const spd  = Math.hypot(m.vx, m.vy) || 1;
        const tailX = m.x - (m.vx / spd) * m.len;
        const tailY = m.y - (m.vy / spd) * m.len;

        if (isLight) {
          const alpha = fade * IM * 1.2;
          const headRgb = "14,165,233";
          const midRgb  = "2,132,199";
          const tailRgb = "56,189,248";

          const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
          grad.addColorStop(0,   `rgba(${tailRgb},0)`);
          grad.addColorStop(0.35, `rgba(${tailRgb},${alpha * 0.45})`);
          grad.addColorStop(0.7, `rgba(${midRgb},${alpha * 0.8})`);
          grad.addColorStop(1,   `rgba(255,255,255,${alpha})`);

          ctx.strokeStyle = grad;
          ctx.lineWidth = 2.4;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(m.x, m.y);
          ctx.stroke();

          const glow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 8);
          glow.addColorStop(0, `rgba(255,255,255,${alpha * 0.95})`);
          glow.addColorStop(0.4, `rgba(${headRgb},${alpha * 0.7})`);
          glow.addColorStop(1, `rgba(${midRgb},0)`);
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(m.x, m.y, 8, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }

        const headRgb = "255,255,255";
        const midRgb  = "186,230,253";
        const tailRgb = "56,189,248";
        const alpha = fade * IM * 0.85;

        const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        grad.addColorStop(0,   `rgba(${tailRgb},0)`);
        grad.addColorStop(0.4, `rgba(${midRgb},${alpha * 0.35})`);
        grad.addColorStop(0.85, `rgba(${midRgb},${alpha * 0.65})`);
        grad.addColorStop(1,   `rgba(${headRgb},${alpha})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();

        const glow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 5);
        glow.addColorStop(0, `rgba(${headRgb},${alpha * 0.9})`);
        glow.addColorStop(1, `rgba(${midRgb},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* ══════════════════════════════════════════════════════════
       LAYER 5 — Premium light focus
       4 soft clinical-grade light sources drifting across the
       canvas.  Near-white at centre → soft ice-blue → transparent.
       Evokes the quality-of-light in premium medical environments.
    ══════════════════════════════════════════════════════════ */
    function drawGlowFocus(t: number, breathe: number) {
      if (isLight) return;
      const cx = w / 2, cy = h / 2;
      for (const ls of LIGHTS) {
        const ox = cx + (ls.ox + Math.sin(t * ls.fx + ls.px) * ls.ax) * w;
        const oy = cy + (ls.oy + Math.cos(t * ls.fy + ls.py) * ls.ay) * h;
        const r  = ls.radius * Math.min(w, h);
        const a  = ls.baseAlpha * IM * breathe;

        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, r);
        g.addColorStop(0.00, `rgba(195,238,255,${a})`);        // near-white
        g.addColorStop(0.38, `rgba(90,190,235,${a * 0.42})`);  // ice blue
        g.addColorStop(1.00, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
    }

    /* ══════════════════════════════════════════════════════════
       LAYER 6 — Edge vignette
       Darkens the perimeter slightly, pulling focus inward and
       increasing the perceived depth of the environment.
    ══════════════════════════════════════════════════════════ */
    function drawVignette() {
      const g = ctx.createRadialGradient(
        w / 2, h / 2, Math.min(w, h) * 0.32,
        w / 2, h / 2, Math.max(w, h) * 0.78,
      );
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, isLight ? "rgba(14,165,233,0.06)" : "rgba(0,0,0,0.38)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    /* ══════════════════════════════════════════════════════════
       Animation loop
    ══════════════════════════════════════════════════════════ */
    let start = 0;
    let lastTs = 0;
    function loop(ts: number) {
      if (!start) { start = ts; lastTs = ts; }
      const t  = (ts - start) / 1000;
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;

      /* Breathing rhythm — 7 s cycle, extremely subtle (±4 %).
         Creates the sensation of the environment being alive.  */
      const breathe = 0.96 + 0.04 * Math.sin(t * (Math.PI * 2 / 7));

      if (isLight) {
        drawBase();
        if (preset !== "subtle") drawOrbs(t, breathe);
        drawFlowParticles(t);
        drawWaves(t);
        if (preset === "hero") drawStars(t);
        drawVignette();
      } else {
        ctx.clearRect(0, 0, w, h);
        drawFlowParticles(t);
        if (preset !== "subtle") drawGlowFocus(t, breathe);
      }

      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [preset, isLight]);

  const pos = fixed ? "fixed" : "absolute";

  return (
    <div
      aria-hidden
      style={{
        position: pos,
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: fixed ? -1 : 0,
        willChange: "transform",
      }}
    >
      {!isLight && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={BASE_SCENE_SRC}
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center center",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      )}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
