"use client";

/**
 * Dependency-free SVG charts for the owner panel.
 * Bespoke, lightweight and styled to match the premium SaaS theme.
 * All charts are responsive (viewBox-based) and theme-driven.
 */
import { useId } from "react";
import type { CategoryPoint, TimeSeriesPoint } from "@/lib/admin/types";

const ACCENT = "#1e40af";
const ACCENT2 = "#2563eb";
const GRID = "rgba(148, 163, 184, 0.12)";

const MONTH_NUM: Record<string, string> = {
  Янв: "01", Фев: "02", Мар: "03", Апр: "04", Май: "05", Июн: "06",
  Июл: "07", Авг: "08", Сен: "09", Окт: "10", Ноя: "11", Дек: "12",
};

function pickTickIndices(count: number, maxTicks = 7): number[] {
  if (count <= 0) return [];
  if (count <= maxTicks) return Array.from({ length: count }, (_, i) => i);
  const indices: number[] = [0];
  const step = (count - 1) / (maxTicks - 1);
  for (let i = 1; i < maxTicks - 1; i++) {
    indices.push(Math.round(i * step));
  }
  indices.push(count - 1);
  return [...new Set(indices)].sort((a, b) => a - b);
}

function formatTickLabel(label: string): string {
  const m = label.match(/^(\d{1,2})\s+(\S+)/);
  if (m) {
    const mon = MONTH_NUM[m[2]] ?? m[2];
    return `${m[1].padStart(2, "0")}.${mon}`;
  }
  return label;
}

function tickAnchor(index: number, count: number): "start" | "middle" | "end" {
  if (index <= 0) return "start";
  if (index >= count - 1) return "end";
  return "middle";
}

/* ───────────────────────────  Area chart  ──────────────────────────────── */
export function AreaChart({
  data, height = 220, format = (n) => `${n}`, color = ACCENT,
}: {
  data: TimeSeriesPoint[];
  height?: number;
  format?: (n: number) => string;
  color?: string;
}) {
  const gid = useId().replace(/:/g, "");
  const W = 720;
  const axisBand = 30;
  const plotH = height - axisBand;
  const padX = 22;
  const padY = 16;
  if (!data.length) return <ChartEmpty height={height} />;

  const max = Math.max(...data.map((d) => d.value), 1);
  const stepX = (W - padX * 2) / Math.max(1, data.length - 1);
  const x = (i: number) => padX + i * stepX;
  const y = (v: number) => padY + (1 - v / max) * (plotH - padY * 2);

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.value)}`).join(" ");
  const area = `${line} L ${x(data.length - 1)} ${plotH - padY} L ${x(0)} ${plotH - padY} Z`;

  const lastIdx = data.length - 1;
  const ticks = pickTickIndices(data.length, 7);
  const labelY = height - 8;

  return (
    <div className="oa-chart-block">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        style={{ display: "block" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={padX}
            x2={W - padX}
            y1={padY + g * (plotH - padY * 2)}
            y2={padY + g * (plotH - padY * 2)}
            stroke={GRID}
            strokeWidth="1"
          />
        ))}
        <path d={area} fill={`url(#fill-${gid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={x(lastIdx)} cy={y(data[lastIdx].value)} r="4.5" fill={color} stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
        <line x1={padX} x2={W - padX} y1={labelY - 14} y2={labelY - 14} stroke={GRID} strokeWidth="1" />
        {ticks.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={labelY}
            textAnchor={tickAnchor(i, data.length)}
            className="oa-chart-axis-svg-text"
          >
            {formatTickLabel(data[i]?.label ?? "")}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ───────────────────────────  Bar chart  ───────────────────────────────── */
export function BarChart({
  data, height = 220, color = ACCENT2, horizontal = false,
}: {
  data: CategoryPoint[];
  height?: number;
  color?: string;
  horizontal?: boolean;
}) {
  if (!data.length) return <ChartEmpty height={height} />;
  const max = Math.max(...data.map((d) => d.value), 1);

  if (horizontal) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data.map((d, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
              <span style={{ color: "var(--oa-text-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "78%" }}>{d.label}</span>
              <span style={{ fontWeight: 700 }}>{d.value}</span>
            </div>
            <div className="oa-progress">
              <div className="oa-progress-bar" style={{ width: `${(d.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const W = 720;
  const axisBand = 30;
  const plotH = height - axisBand;
  const padY = 16;
  const gap = 14;
  const bw = (W - gap * (data.length + 1)) / data.length;
  const ticks = pickTickIndices(data.length, 8);
  const labelY = height - 8;
  const barCenter = (i: number) => gap + i * (bw + gap) + bw / 2;

  return (
    <div className="oa-chart-block">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        style={{ display: "block" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const h = (d.value / max) * (plotH - padY * 2);
          const xPos = gap + i * (bw + gap);
          return (
            <rect
              key={i}
              x={xPos}
              y={plotH - padY - h}
              width={bw}
              height={Math.max(2, h)}
              rx="7"
              fill="url(#barGrad)"
              opacity={0.95}
            />
          );
        })}
        <line x1={gap} x2={W - gap} y1={labelY - 14} y2={labelY - 14} stroke={GRID} strokeWidth="1" />
        {ticks.map((i) => (
          <text
            key={i}
            x={barCenter(i)}
            y={labelY}
            textAnchor={tickAnchor(i, data.length)}
            className="oa-chart-axis-svg-text"
          >
            {formatTickLabel(data[i]?.label ?? "")}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ───────────────────────────  Donut chart  ─────────────────────────────── */
export function DonutChart({
  segments, size = 168, thickness = 22, centerLabel, centerValue,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={GRID} strokeWidth={thickness} />
          {segments.map((s, i) => {
            const len = (s.value / total) * c;
            const circle = (
              <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={s.color} strokeWidth={thickness}
                strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset}
                strokeLinecap="round" />
            );
            offset += len;
            return circle;
          })}
        </g>
        {(centerValue || centerLabel) && (
          <text x="50%" y="47%" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--oa-text)">{centerValue}</text>
        )}
        {centerLabel && (
          <text x="50%" y="60%" textAnchor="middle" fontSize="11" fill="var(--oa-text-faint)">{centerLabel}</text>
        )}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
            <span style={{ color: "var(--oa-text-soft)" }}>{s.label}</span>
            <span style={{ fontWeight: 700, marginLeft: "auto" }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────────  Sparkline  ───────────────────────────────── */
export function Sparkline({ data, color = ACCENT, width = 110, height = 36 }: {
  data: number[]; color?: string; width?: number; height?: number;
}) {
  const gid = useId().replace(/:/g, "");
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => `${i * stepX},${height - ((v - min) / range) * height}`).join(" ");
  const areaPts = `0,${height} ${pts} ${width},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity: 0.95 }}>
      <defs>
        <linearGradient id={`spark-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill={`url(#spark-${gid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ───────────────────────────  Gauge (radial)  ──────────────────────────── */
export function Gauge({
  value, size = 150, label, captionBelow = false,
}: { value: number; size?: number; label?: string; captionBelow?: boolean }) {
  const gid = useId().replace(/:/g, "");
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;
  const track = "rgba(255, 255, 255, 0.1)";
  const gold = "#e4b84a";
  const goldHi = "#fce588";
  const thickness = Math.max(5, size * 0.09);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className={`oa-gauge-block${captionBelow ? " oa-gauge-block--stacked" : ""}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="oa-gauge" aria-hidden="true">
        <defs>
          <linearGradient id={`oa-gauge-gold-${gid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={goldHi} />
            <stop offset="55%" stopColor={gold} />
            <stop offset="100%" stopColor="#9a6b14" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="rgba(0,0,0,0.35)" />
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={track} strokeWidth={thickness} />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={`url(#oa-gauge-gold-${gid})`}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${c - dash}`}
            strokeLinecap="round"
          />
        </g>
        <text
          x={cx}
          y={cy}
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={size * 0.26}
          fontWeight="800"
          fill="#fafafa"
        >
          {pct}
        </text>
        {!captionBelow && label && (
          <text
            x={cx}
            y={cy + size * 0.14}
            textAnchor="middle"
            fontSize={Math.max(9, size * 0.12)}
            fontWeight="600"
            fill="#e4b84a"
          >
            {label}
          </text>
        )}
      </svg>
      {captionBelow && label && (
        <div className="oa-gauge-caption">{label}</div>
      )}
    </div>
  );
}

function ChartEmpty({ height }: { height: number }) {
  return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--oa-text-faint)", fontSize: 13 }}>
      Нет данных за период
    </div>
  );
}
