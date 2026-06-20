"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface HeroNavProps {
  clinicPhone?: string;
}

export default function HeroNav({ clinicPhone }: HeroNavProps) {
  const [badgeVisible, setBadgeVisible] = useState(false);
  const [scrolled,     setScrolled]     = useState(false);

  useEffect(() => {
    const check = () => {
      setBadgeVisible(window.scrollY > 180);
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", check, { passive: true });
    check();
    return () => window.removeEventListener("scroll", check);
  }, []);

  return (
    <>
      {/* ── Sticky nav — light glass ─────────────────── */}
      <nav
        className="relative z-20 flex items-center justify-between px-6 md:px-12 py-4 sticky top-0"
        style={{
          background:           scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.75)",
          backdropFilter:       "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom:         "1px solid rgba(226,232,240,0.8)",
          transition:           "background 0.35s ease",
        }}
      >
        <div className="w-28 flex-shrink-0" />

        <div className="hidden md:flex items-center gap-8">
          {[
            { href:"/services", label:"Услуги" },
            { href:"#doctors",  label:"Врачи" },
            { href:"#how",      label:"Как это работает" },
            { href:"#contact",  label:"Контакты" },
          ].map((l) => (
            <Link key={l.href} href={l.href}
              className="text-sm font-medium text-slate-500 hover:text-sky-600 transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {clinicPhone && (
            <a href={`tel:${clinicPhone.replace(/\s/g,"")}`}
              className="hidden md:flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-600 transition-colors">
              📞 {clinicPhone}
            </a>
          )}
          <Link href="/booking" className="btn-primary text-sm px-5 py-2.5">Записаться</Link>
        </div>
      </nav>

      {/* ── Fixed logo badge (center, appears on scroll) ── */}
      <Link href="/" aria-label="InClinic — на главную"
        style={{
          position:      "fixed",
          top:           "8px",
          left:          "50%",
          transform:     badgeVisible
            ? "translateX(-50%) translateY(0) scale(1)"
            : "translateX(-50%) translateY(-14px) scale(0.85)",
          opacity:       badgeVisible ? 1 : 0,
          pointerEvents: badgeVisible ? "auto" : "none",
          transition:    "opacity 0.35s cubic-bezier(0.4,0,0.2,1), transform 0.4s cubic-bezier(0.34,1.3,0.64,1)",
          zIndex:        9998,
          textDecoration:"none",
          lineHeight:    0,
          animation:     badgeVisible ? "neonBreathe 3s ease-in-out infinite" : "none",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon-512.png" alt="InClinic"
          style={{
            width:"52px", height:"52px", objectFit:"contain", display:"block",
            filter:
              "drop-shadow(0 0 8px  rgba(6,182,212,1)) " +
              "drop-shadow(0 0 18px rgba(6,182,212,0.9)) " +
              "drop-shadow(0 0 36px rgba(14,165,233,0.7)) " +
              "drop-shadow(0 0 60px rgba(6,182,212,0.4))",
          }}
          draggable={false} />
      </Link>
    </>
  );
}
