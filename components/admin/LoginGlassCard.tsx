"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

interface Props {
  logo: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}

function LoginCardClipDefs() {
  return (
    <svg aria-hidden width="0" height="0" className="oa-login-clip-svg">
      <defs>
        <clipPath id="oa-login-card-clip" clipPathUnits="objectBoundingBox">
          <path d="
            M 0.035,0.162
            H 0.31
            A 0.19,0.162 0 0,1 0.5,0
            A 0.19,0.162 0 0,1 0.69,0.162
            H 0.965
            C 0.986,0.162 1,0.178 1,0.205
            V 0.965
            C 1,0.986 0.986,1 0.965,1
            H 0.035
            C 0.014,1 0,0.986 0,0.965
            V 0.205
            C 0,0.178 0.014,0.162 0.035,0.162
            Z
          " />
        </clipPath>
      </defs>
    </svg>
  );
}

export default function LoginGlassCard({ logo, children, footer }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 40 });
  const [glareOn, setGlareOn] = useState(false);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    const tiltEl = wrapRef.current;
    if (!card || !tiltEl) return;

    const cardRect = card.getBoundingClientRect();
    const px = (e.clientX - cardRect.left) / cardRect.width;
    const py = (e.clientY - cardRect.top) / cardRect.height;
    setGlare({
      x: Math.max(4, Math.min(96, px * 100)),
      y: Math.max(4, Math.min(96, py * 100)),
    });
    setGlareOn(true);

    const tiltRect = tiltEl.getBoundingClientRect();
    const tx = (e.clientX - tiltRect.left) / tiltRect.width;
    const ty = (e.clientY - tiltRect.top) / tiltRect.height;
    setTilt({ rx: (0.5 - ty) * 10, ry: (tx - 0.5) * 14 });
  }, []);

  const onPointerLeave = useCallback(() => {
    setTilt({ rx: 0, ry: 0 });
    setGlare({ x: 50, y: 40 });
    setGlareOn(false);
  }, []);

  return (
    <div
      ref={wrapRef}
      className="oa-login-tilt-root"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <LoginCardClipDefs />
      <div
        className="oa-login-glass-wrap"
        style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
      >
        <div className="oa-login-card-glow">
          <div ref={cardRef} className="oa-login-card-shell">
            <div className="oa-login-card-surface" aria-hidden />
            <div
              className={`oa-login-panel-glare${glareOn ? " oa-login-panel-glare--on" : ""}`}
              aria-hidden
              style={{
                ["--oa-glare-x" as string]: `${glare.x}%`,
                ["--oa-glare-y" as string]: `${glare.y}%`,
              }}
            />
            <div className="oa-login-logo-crest">{logo}</div>
            <div className="oa-login-card-body">
              {children}
              {footer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
