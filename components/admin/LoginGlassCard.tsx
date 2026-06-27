"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

interface Props {
  logo: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}

export default function LoginGlassCard({ logo, children, footer }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 30 });

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const ry = (px - 0.5) * 14;
    const rx = (0.5 - py) * 10;
    setTilt({ rx, ry });
    setGlare({ x: px * 100, y: py * 100 });
  }, []);

  const onPointerLeave = useCallback(() => {
    setTilt({ rx: 0, ry: 0 });
    setGlare({ x: 50, y: 30 });
  }, []);

  return (
    <div
      ref={wrapRef}
      className="oa-login-tilt-root"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div
        className="oa-login-glass-wrap"
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          ["--oa-glare-x" as string]: `${glare.x}%`,
          ["--oa-glare-y" as string]: `${glare.y}%`,
        }}
      >
        <div className="oa-login-card-shell">
          <div className="oa-login-panel-glare" aria-hidden />
          <div className="oa-login-logo-crest">{logo}</div>
          <div className="oa-login-card-body">
            {children}
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}
