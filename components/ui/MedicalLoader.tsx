"use client";

type LoaderVariant = "site" | "admin";

/**
 * Симметричная ЭКГ: малый пульс слева · крупный QRS в центре · малый пульс справа.
 * viewBox центрирован вокруг главного пика (x=150).
 */
const BASELINE_Y = 40;
const ECG_FULL =
  `M 0,${BASELINE_Y} L 48,${BASELINE_Y} ` +
  `L 66,${BASELINE_Y} L 69,${BASELINE_Y - 4} L 72,${BASELINE_Y} L 75,${BASELINE_Y + 4} L 78,${BASELINE_Y} L 96,${BASELINE_Y} ` +
  `L 118,${BASELINE_Y} ` +
  `L 136,${BASELINE_Y} L 140,${BASELINE_Y} L 144,${BASELINE_Y - 30} L 148,${BASELINE_Y + 32} L 152,${BASELINE_Y - 6} L 156,${BASELINE_Y} L 164,${BASELINE_Y} ` +
  `L 204,${BASELINE_Y} ` +
  `L 222,${BASELINE_Y} L 225,${BASELINE_Y - 4} L 228,${BASELINE_Y} L 231,${BASELINE_Y + 4} L 234,${BASELINE_Y} L 252,${BASELINE_Y} ` +
  `L 300,${BASELINE_Y}`;

const ECG_CENTER =
  `M 136,${BASELINE_Y} L 140,${BASELINE_Y} L 144,${BASELINE_Y - 30} L 148,${BASELINE_Y + 32} L 152,${BASELINE_Y - 6} L 156,${BASELINE_Y}`;

const PATH_LEN = 520;

export default function MedicalLoader({ variant = "site" }: { variant?: LoaderVariant }) {
  const isAdmin = variant === "admin";
  const id = `ecg-${variant}`;

  const core = isAdmin ? "#e8c96a" : "#e0f2fe";
  const glow = isAdmin ? "rgba(232,201,106,0.55)" : "rgba(125,211,252,0.65)";
  const ghost = isAdmin ? "rgba(212,175,55,0.14)" : "rgba(186,230,253,0.14)";
  const scan = isAdmin ? "#f5e6a8" : "#f0f9ff";

  return (
    <div className={`medical-loader medical-loader--${variant}`} role="status" aria-label="Загрузка">
      <svg viewBox="0 0 300 80" className="medical-loader-svg" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-scan`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={scan} stopOpacity="0" />
            <stop offset="35%" stopColor={core} stopOpacity="0.85" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="65%" stopColor={core} stopOpacity="0.85" />
            <stop offset="100%" stopColor={scan} stopOpacity="0" />
          </linearGradient>
          <filter id={`${id}-blur`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`${id}-center`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Тонкая базовая линия — всегда видна */}
        <path
          d={ECG_FULL}
          fill="none"
          stroke={ghost}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ecg-trace-ghost"
        />

        {/* Мягкое свечение — бегущий луч */}
        <path
          d={ECG_FULL}
          fill="none"
          stroke={glow}
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={PATH_LEN}
          filter={`url(#${id}-blur)`}
          className="ecg-trace-glow"
        />

        {/* Основная линия — бегущий луч */}
        <path
          d={ECG_FULL}
          fill="none"
          stroke={`url(#${id}-scan)`}
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={PATH_LEN}
          className="ecg-trace-core"
        />

        {/* Акцент на центральном QRS — пульс в такт */}
        <path
          d={ECG_CENTER}
          fill="none"
          stroke={core}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${id}-center)`}
          className="ecg-trace-center"
        />

        {/* Точка-сканер в центре */}
        <circle cx="148" cy={BASELINE_Y - 8} r="2.5" fill="#ffffff" className="ecg-scan-dot" />
      </svg>
    </div>
  );
}
