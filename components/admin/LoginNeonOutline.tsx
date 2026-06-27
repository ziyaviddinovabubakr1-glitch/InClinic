"use client";

import { useEffect, useId, useRef, useState } from "react";

function buildOutlinePath(
  logoEl: Element,
  cardEl: Element,
  wrapEl: Element
): string {
  const wrap = wrapEl.getBoundingClientRect();
  const logo = logoEl.getBoundingClientRect();
  const card = cardEl.getBoundingClientRect();

  const pad = 2.5;
  const logoCx = logo.left + logo.width / 2 - wrap.left;
  const logoCy = logo.top + logo.height / 2 - wrap.top;
  const logoR = logo.width / 2 + pad;

  const leftX = card.left - wrap.left - pad;
  const rightX = card.right - wrap.left + pad;
  const cardB = card.bottom - wrap.top + pad;
  const radius = 22;

  const joinY = card.top - wrap.top + 10;
  const topX = logoCx;
  const topY = logoCy - logoR;

  const leftConnectX = logoCx - logoR * 0.98;
  const leftConnectY = logoCy + logoR * 0.08;
  const rightConnectX = logoCx + logoR * 0.98;
  const rightConnectY = logoCy + logoR * 0.08;

  return [
    `M ${topX.toFixed(2)} ${topY.toFixed(2)}`,
    `A ${logoR.toFixed(2)} ${logoR.toFixed(2)} 0 0 0 ${leftConnectX.toFixed(2)} ${leftConnectY.toFixed(2)}`,
    `L ${leftX.toFixed(2)} ${joinY.toFixed(2)}`,
    `L ${leftX.toFixed(2)} ${(cardB - radius).toFixed(2)}`,
    `A ${radius} ${radius} 0 0 1 ${(leftX + radius).toFixed(2)} ${cardB.toFixed(2)}`,
    `L ${(rightX - radius).toFixed(2)} ${cardB.toFixed(2)}`,
    `A ${radius} ${radius} 0 0 1 ${rightX.toFixed(2)} ${(cardB - radius).toFixed(2)}`,
    `L ${rightX.toFixed(2)} ${joinY.toFixed(2)}`,
    `L ${rightConnectX.toFixed(2)} ${rightConnectY.toFixed(2)}`,
    `A ${logoR.toFixed(2)} ${logoR.toFixed(2)} 0 0 0 ${topX.toFixed(2)} ${topY.toFixed(2)}`,
  ].join(" ");
}

interface Props {
  wrapRef: React.RefObject<HTMLDivElement | null>;
}

export default function LoginNeonOutline({ wrapRef }: Props) {
  const uid = useId().replace(/:/g, "");
  const gradId = `oa-login-outline-grad-${uid}`;
  const glowId = `oa-login-outline-glow-${uid}`;
  const [path, setPath] = useState("");
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    function update() {
      const w = wrapRef.current;
      if (!w) return;
      const logo = w.querySelector(".oa-login-logo-neon-wrap");
      const card = w.querySelector(".oa-login-card");
      if (!logo || !card) return;

      const rect = w.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
      setPath(buildOutlinePath(logo, card, w));
    }

    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [wrapRef]);

  if (!path || size.w <= 0) return null;

  return (
    <svg
      className="oa-login-unified-neon"
      width={size.w}
      height={size.h}
      viewBox={`0 0 ${size.w} ${size.h}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffef5" />
          <stop offset="35%" stopColor="#fce588" />
          <stop offset="70%" stopColor="#e4b84a" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
        <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        className="oa-login-unified-neon-glow"
        d={path}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="4"
        strokeLinecap="round"
        pathLength={100}
        filter={`url(#${glowId})`}
      />
      <path
        className="oa-login-unified-neon-stroke"
        d={path}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="1.8"
        strokeLinecap="round"
        pathLength={100}
      />
    </svg>
  );
}
