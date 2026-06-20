"use client";

import { useState, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import AdminBrandLogo from "@/components/admin/AdminBrandLogo";
import PremiumAdminLoader from "@/components/admin/PremiumAdminLoader";

const DURATION_MS = 1100;
const FADE_MS = 280;
const SESSION_KEY = "inclinic-admin-boot";

function isLoginRoute(pathname: string | null): boolean {
  return !pathname || pathname === "/admin";
}

function bootAlreadyDone(): boolean {
  if (typeof window === "undefined") return true;
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

function markBootDone(): void {
  sessionStorage.setItem(SESSION_KEY, "1");
}

export default function AdminBootLoader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = isLoginRoute(pathname);
  const [ready, setReady] = useState(() => isLogin || bootAlreadyDone());
  const [exiting, setExiting] = useState(false);

  useLayoutEffect(() => {
    if (isLogin) {
      setReady(true);
      setExiting(false);
      return;
    }

    if (bootAlreadyDone()) {
      setReady(true);
      setExiting(false);
      return;
    }

    setReady(false);
    setExiting(false);

    const fadeTimer = window.setTimeout(() => setExiting(true), DURATION_MS - FADE_MS);
    const hideTimer = window.setTimeout(() => {
      markBootDone();
      setReady(true);
    }, DURATION_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [isLogin]);

  const showLoader = !isLogin && !ready;

  return (
    <>
      {showLoader && (
        <div
          className="oa-boot-loader"
          role="status"
          aria-live="polite"
          aria-label="Загрузка панели управления"
          style={{
            opacity: exiting ? 0 : 1,
            transition: `opacity ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        >
          <div className="oa-boot-loader-panel">
            <div className="oa-boot-loader-logo">
              <AdminBrandLogo variant="icon" size="hero" animate />
            </div>
            <div className="oa-brand-title" style={{ marginTop: 12 }}>
              In<span className="oa-brand-title-gold">Clinic</span>
            </div>
            <p className="oa-boot-loader-text">Загрузка панели управления…</p>
            <PremiumAdminLoader />
          </div>
        </div>
      )}
      <div className={`oa-boot-content${showLoader ? " oa-boot-content-pending" : ""}`}>{children}</div>
    </>
  );
}
