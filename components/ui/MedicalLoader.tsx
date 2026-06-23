"use client";

type LoaderVariant = "site" | "admin";

/** ЭКГ: маленький пульс слева и справа, крупнее в центре — без фона */
const ECG_PATH =
  "M0,24 L18,24 L22,24 L24,21 L26,24 L28,27 L30,24 L40,24 " +
  "L78,24 L88,24 L92,24 L96,10 L100,38 L104,24 L114,24 " +
  "L172,24 L182,24 L186,24 L188,21 L190,24 L192,27 L194,24 L204,24 L240,24";

const ECG_LENGTH = 300;

export default function MedicalLoader({ variant = "site" }: { variant?: LoaderVariant }) {
  const isAdmin = variant === "admin";
  const gradStart = isAdmin ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.55)";
  const gradMid = isAdmin ? "rgba(232,201,106,0.98)" : "rgba(186,230,253,0.98)";
  const gradEnd = isAdmin ? "rgba(96,165,250,0.55)" : "rgba(56,189,248,0.95)";

  return (
    <div className={`medical-loader medical-loader--${variant}`} role="status" aria-label="Загрузка">
      <svg viewBox="0 0 240 48" className="medical-loader-svg" aria-hidden="true">
        <defs>
          <linearGradient id={`ecgGrad-${variant}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradStart} />
            <stop offset="45%" stopColor={gradMid} />
            <stop offset="100%" stopColor={gradEnd} />
          </linearGradient>
          <filter id={`ecgGlow-${variant}`}>
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d={ECG_PATH}
          fill="none"
          stroke={`url(#ecgGrad-${variant})`}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={ECG_LENGTH}
          filter={`url(#ecgGlow-${variant})`}
          className="ecg-trace"
        />
      </svg>
    </div>
  );
}
