"use client";

import { useState, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { useSplash } from "@/lib/splash";
import BrandLogo from "@/components/ui/BrandLogo";
import MedicalLoader from "@/components/ui/MedicalLoader";

const LOADER_DURATION = 4_000;
const FADE_OUT_MS = 450;

export default function SplashScreen() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { setActive } = useSplash();
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  /* Скрыть при переходе в админку (клиентская навигация) */
  useLayoutEffect(() => {
    if (!pathname?.startsWith("/admin")) return;
    setVisible(false);
    setExiting(false);
    setActive(false);
    document.documentElement.setAttribute("data-splash", "skip");
  }, [pathname, setActive]);

  /* Запуск при каждой полной загрузке страницы (F5). Пустой deps — Strict Mode безопасен */
  useLayoutEffect(() => {
    if (pathname?.startsWith("/admin")) return;

    setVisible(true);
    setExiting(false);
    setActive(true);
    document.documentElement.setAttribute("data-splash", "show");

    const exitTimer = window.setTimeout(() => setExiting(true), LOADER_DURATION - FADE_OUT_MS);
    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      setActive(false);
      document.documentElement.setAttribute("data-splash", "done");
    }, LOADER_DURATION);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- только при mount / hard refresh
  }, []);

  if (pathname?.startsWith("/admin")) return null;
  if (!visible) return null;

  return (
    <div
      className="splash-screen"
      style={{
        opacity: exiting ? 0 : 1,
        transition: `opacity ${FADE_OUT_MS}ms cubic-bezier(0.4,0,0.2,1)`,
      }}
    >
      <div
        className="splash-screen-panel center-frost-panel"
        style={{
          opacity: exiting ? 0 : 1,
          transform: exiting ? "scale(1.02)" : "scale(1)",
          transition: `opacity ${FADE_OUT_MS}ms ease, transform ${FADE_OUT_MS}ms ease`,
          animation: "fadeInUp 0.5s ease-out both",
        }}
      >
        <BrandLogo size="hero" animate />

        <h1 className="neon-title mt-6 mb-2" style={{ fontSize: "clamp(2.4rem, 5.5vw, 3.6rem)" }}>
          <span className="brand-in font-extrabold">In</span>
          <span className="brand-clinic font-extrabold">Clinic</span>
        </h1>

        <p className="neon-subtitle neon-white tracking-[0.18em] mb-8">{t.tagline}</p>

        <MedicalLoader variant="site" />
      </div>
    </div>
  );
}
