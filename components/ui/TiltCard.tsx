"use client";

import { useRef, MouseEvent, ReactNode, CSSProperties } from "react";

interface TiltCardProps {
  children:   ReactNode;
  className?: string;
  style?:     CSSProperties;
  intensity?: number;   // tilt angle in degrees, default 14
  glowColor?: string;   // e.g. "rgba(56,189,248,0.35)"
}

export default function TiltCard({
  children,
  className = "",
  style,
  intensity = 14,
  glowColor = "rgba(56,189,248,0.25)",
}: TiltCardProps) {
  const cardRef  = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x  = (e.clientX - rect.left)  / rect.width  - 0.5;
    const y  = (e.clientY - rect.top)   / rect.height - 0.5;
    const rx = -y * intensity;
    const ry =  x * intensity;

    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.04,1.04,1.04)`;

    if (glareRef.current) {
      const gx = (x + 0.5) * 100;
      const gy = (y + 0.5) * 100;
      glareRef.current.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.24) 0%, transparent 65%)`;
      glareRef.current.style.opacity    = "1";
    }

    el.style.boxShadow = [
      `0 ${18 + y * 22}px ${52 + Math.abs(y) * 32}px rgba(0,0,0,0.48)`,
      `0 0 0 1px rgba(125,211,252,0.18)`,
      `0 0 32px rgba(14,165,233,0.16)`,
      `${-x * 16}px ${-y * 16}px 44px ${glowColor}`,
    ].join(", ");
  }

  function onLeave() {
    const el = cardRef.current;
    if (!el) return;
    el.style.transition  = "transform 0.55s cubic-bezier(0.23,1,0.32,1), box-shadow 0.55s ease";
    el.style.transform   = "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    el.style.boxShadow   = "";

    if (glareRef.current) glareRef.current.style.opacity = "0";

    setTimeout(() => {
      if (el) el.style.transition = "transform 0.12s ease-out, box-shadow 0.12s ease-out";
    }, 560);
  }

  return (
    <div
      ref={cardRef}
      className={className}
      style={{
        ...style,
        transformStyle:  "preserve-3d",
        willChange:      "transform",
        transition:      "transform 0.12s ease-out, box-shadow 0.12s ease-out",
        position:        "relative",
        overflow:        "hidden",
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {/* Moving glare / light refraction */}
      <div
        ref={glareRef}
        aria-hidden="true"
        style={{
          position:       "absolute",
          inset:          0,
          borderRadius:   "inherit",
          pointerEvents:  "none",
          zIndex:         30,
          opacity:        0,
          transition:     "opacity 0.25s ease, background 0.08s ease",
        }}
      />
      {children}
    </div>
  );
}
