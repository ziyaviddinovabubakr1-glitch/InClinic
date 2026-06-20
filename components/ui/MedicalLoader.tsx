"use client";

type LoaderVariant = "site" | "admin";

/** Классическая ЭКГ-волна — анимация прорисовки, без точки и отдельной базовой линии */
const ECG_PATH =
  "M0,24 L30,24 L38,24 L42,8 L46,40 L50,24 L58,24 L66,24 L70,14 L74,34 L78,24 L110,24 L118,24 L122,6 L126,42 L130,24 L138,24 L146,24 L150,16 L154,32 L158,24 L190,24 L198,24 L202,10 L206,38 L210,24 L220,24";

export default function MedicalLoader({ variant = "site" }: { variant?: LoaderVariant }) {
  const isAdmin = variant === "admin";
  const gradStart = isAdmin ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.55)";
  const gradMid = isAdmin ? "rgba(232,201,106,0.98)" : "rgba(186,230,253,0.98)";
  const gradEnd = isAdmin ? "rgba(96,165,250,0.55)" : "rgba(56,189,248,0.95)";
  const glowSoft = isAdmin ? "rgba(212,175,55,0.65)" : "rgba(186,230,253,0.85)";
  const glowStroke = isAdmin ? "rgba(232,201,106,0.22)" : "rgba(56,189,248,0.28)";

  return (
    <div className={`medical-loader medical-loader--${variant}`} role="status" aria-label="Загрузка">
      <svg viewBox="0 0 220 48" className="medical-loader-svg" aria-hidden="true">
        <defs>
          <linearGradient id={`ecgGrad-${variant}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradStart} />
            <stop offset="45%" stopColor={gradMid} />
            <stop offset="100%" stopColor={gradEnd} />
          </linearGradient>
          <filter id={`ecgGlow-${variant}`}>
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Мягкое свечение под основной волной */}
        <path
          d={ECG_PATH}
          fill="none"
          stroke={glowStroke}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#ecgGlow-${variant})`}
          className="ecg-trace ecg-trace-glow"
        />

        {/* Основная ЭКГ-линия сердцебиения */}
        <path
          d={ECG_PATH}
          fill="none"
          stroke={`url(#ecgGrad-${variant})`}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#ecgGlow-${variant})`}
          className="ecg-trace"
        />
      </svg>
      <div
        className="medical-loader-glow"
        style={{ background: `radial-gradient(circle, ${glowSoft} 0%, transparent 70%)` }}
      />
    </div>
  );
}
