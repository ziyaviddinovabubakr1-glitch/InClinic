"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface RunawayLoginButtonProps {
  blocked: boolean;
  loading: boolean;
  onBlockedAttempt?: () => void;
}

const FLEE_RADIUS = 130;
const FLEE_STRENGTH = 105;

export default function RunawayLoginButton({
  blocked,
  loading,
  onBlockedAttempt,
}: RunawayLoginButtonProps) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [shake, setShake] = useState(false);
  const [tease, setTease] = useState(false);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(() => {
    if (!blocked) {
      setPos({ x: 0, y: 0 });
      posRef.current = { x: 0, y: 0 };
    }
  }, [blocked]);

  const fleeFrom = useCallback((clientX: number, clientY: number) => {
    if (!zoneRef.current) return;

    const zone = zoneRef.current.getBoundingClientRect();
    const cur = posRef.current;
    const centerX = zone.left + zone.width / 2 + cur.x;
    const centerY = zone.top + zone.height / 2 + cur.y;
    const dx = centerX - clientX;
    const dy = centerY - clientY;
    const dist = Math.hypot(dx, dy) || 1;

    if (dist >= FLEE_RADIUS) return;

    const push = ((FLEE_RADIUS - dist) / FLEE_RADIUS) * FLEE_STRENGTH;
    let nx = cur.x + (dx / dist) * push;
    let ny = cur.y + (dy / dist) * push;

    const maxX = Math.max(28, zone.width / 2 - 64);
    const maxY = Math.max(20, zone.height / 2 - 20);
    nx = Math.max(-maxX, Math.min(maxX, nx));
    ny = Math.max(-maxY, Math.min(maxY, ny));

    const next = { x: nx, y: ny };
    posRef.current = next;
    setPos(next);
    setTease(true);
  }, []);

  useEffect(() => {
    if (!blocked) return;

    function onDocPointerMove(e: PointerEvent) {
      fleeFrom(e.clientX, e.clientY);
    }

    document.addEventListener("pointermove", onDocPointerMove, { passive: true });
    return () => document.removeEventListener("pointermove", onDocPointerMove);
  }, [blocked, fleeFrom]);

  function handlePointerLeave() {
    if (!blocked) return;
    setTease(false);
    const drift = { x: posRef.current.x * 0.4, y: posRef.current.y * 0.4 };
    posRef.current = drift;
    setPos(drift);
  }

  function jumpAway() {
    const zone = zoneRef.current;
    if (!zone) return;
    const maxX = Math.max(28, zone.clientWidth / 2 - 64);
    const maxY = Math.max(20, zone.clientHeight / 2 - 20);
    const next = {
      x: (Math.random() > 0.5 ? 1 : -1) * (maxX * (0.6 + Math.random() * 0.4)),
      y: (Math.random() > 0.5 ? 1 : -1) * (maxY * (0.5 + Math.random() * 0.45)),
    };
    posRef.current = next;
    setPos(next);
    setTease(true);
  }

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!blocked || loading) return;
    e.preventDefault();
    setShake(true);
    onBlockedAttempt?.();
    jumpAway();
    window.setTimeout(() => setShake(false), 480);
  }

  return (
    <div
      ref={zoneRef}
      className={`oa-login-btn-zone${blocked ? " oa-login-btn-zone--blocked" : ""}`}
      onPointerLeave={handlePointerLeave}
    >
      <button
        type="submit"
        className={[
          "oa-btn",
          "oa-btn-gold",
          "oa-login-btn",
          blocked ? "oa-login-btn--flee" : "oa-login-btn--ready",
          shake ? "oa-login-btn--shake" : "",
          tease ? "oa-login-btn--tease" : "",
          loading ? "oa-login-btn--loading" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={loading}
        onClick={handleClick}
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      >
        <span className="oa-login-btn-label">{loading ? "Вход…" : "Войти в панель"}</span>
      </button>
    </div>
  );
}
