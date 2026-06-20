"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Session timeout + secure logout for the OWNER panel.
 *
 * Automatically logs the owner out after a period of inactivity (clears the
 * httpOnly cookie via the logout endpoint and redirects to the login screen).
 * A short warning is shown before the session expires.
 */
const IDLE_MS = 30 * 60 * 1000; // 30 min of inactivity
const WARN_MS = 60 * 1000; // warn 60s before logout

export default function OwnerSessionGuard() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [warning, setWarning] = useState(false);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/login", { method: "DELETE", credentials: "include" });
    } catch {
      /* ignore network error on logout */
    }
    router.push("/admin");
    router.refresh();
  }, [router]);

  const reset = useCallback(() => {
    setWarning(false);
    if (timer.current) clearTimeout(timer.current);
    if (warnTimer.current) clearTimeout(warnTimer.current);
    warnTimer.current = setTimeout(() => setWarning(true), IDLE_MS - WARN_MS);
    timer.current = setTimeout(logout, IDLE_MS);
  }, [logout]);

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const onActivity = () => reset();
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      if (timer.current) clearTimeout(timer.current);
      if (warnTimer.current) clearTimeout(warnTimer.current);
    };
  }, [reset]);

  if (!warning) return null;

  return (
    <div
      style={{
        position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
        zIndex: 80,
      }}
      className="oa-card oa-card-pad oa-fade-up"
    >
      <div className="flex items-center gap-4">
        <div className="oa-kpi-icon oa-tone-amber" style={{ margin: 0 }}>
          <span style={{ fontSize: 18 }}>⏳</span>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5 }}>Сессия скоро завершится</div>
          <div style={{ fontSize: 12.5, color: "var(--oa-text-faint)" }}>
            Из-за неактивности вы будете автоматически выведены.
          </div>
        </div>
        <button className="oa-btn oa-btn-primary oa-btn-sm" onClick={reset}>
          Остаться
        </button>
      </div>
    </div>
  );
}
