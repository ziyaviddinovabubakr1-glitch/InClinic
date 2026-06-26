"use client";

import type { ReactNode, SVGProps } from "react";
import type {
  AppointmentStatus,
  PatientSegment,
  ReviewStatus,
  ReviewVisibility,
} from "@/lib/admin/types";
import { Sparkline } from "./charts";
import { IStar, ITrendUp, ITrendDown } from "./icons";

/* ───────────────────────────  KPI card (Stripe-style compact)  ─────────── */
export function KpiCard({
  label, value, tone = "blue", delta, deltaDir, sparkData,
}: {
  label: string;
  value: string;
  icon?: (p: SVGProps<SVGSVGElement>) => JSX.Element;
  tone?: "blue" | "green" | "amber" | "red" | "violet" | "sky";
  delta?: string;
  deltaDir?: "up" | "down" | "flat";
  sparkData?: number[];
  hero?: boolean;
}) {
  const sparkColors: Record<string, string> = {
    blue: "#5e6ad2", green: "#30a46c", amber: "#f5a623",
    red: "#e5484d", violet: "#8b5cf6", sky: "#38bdf8",
  };
  return (
    <div className={`oa-kpi oa-kpi-v3 oa-kpi--${tone}`}>
      <div className="oa-kpi-v3-inner">
        <div className="oa-kpi-v3-main">
          <div className="oa-kpi-label">{label}</div>
          <div className="oa-kpi-v3-value-row">
            <div className="oa-kpi-value">{value}</div>
            {delta && (
              <div className={`oa-kpi-delta ${deltaDir === "down" ? "oa-delta-down" : deltaDir === "flat" ? "oa-delta-flat" : "oa-delta-up"}`}>
                {deltaDir === "down" ? <ITrendDown style={{ width: 9, height: 9 }} /> : deltaDir === "flat" ? null : <ITrendUp style={{ width: 9, height: 9 }} />}
                {delta}
              </div>
            )}
          </div>
        </div>
        {sparkData && sparkData.length > 1 && (
          <div className="oa-kpi-v3-spark">
            <Sparkline data={sparkData} color={sparkColors[tone]} width={52} height={16} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────  Stars  ───────────────────────────────────── */
export function Stars({ rating, size = 15 }: { rating: number; size?: number }) {
  return (
    <span className="oa-stars" title={`${rating.toFixed(1)} из 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <IStar key={s} filled={s <= Math.round(rating)} style={{ width: size, height: size }} />
      ))}
    </span>
  );
}

/* ───────────────────────────  Status badges  ───────────────────────────── */
const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: "Ожидает",
  CONFIRMED: "Подтверждена",
  COMPLETED: "Завершена",
  CANCELLED: "Отменена",
};
const STATUS_CLASS: Record<AppointmentStatus, string> = {
  PENDING: "oa-badge-pending",
  CONFIRMED: "oa-badge-confirmed",
  COMPLETED: "oa-badge-completed",
  CANCELLED: "oa-badge-cancelled",
};
export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={`oa-badge ${STATUS_CLASS[status]}`}>
      <span className="oa-badge-dot" />
      {STATUS_LABEL[status]}
    </span>
  );
}

const SEGMENT_LABEL: Record<PatientSegment, string> = {
  NEW: "Новый",
  REGULAR: "Постоянный",
  VIP: "VIP",
  INACTIVE: "Неактивный",
};
const SEGMENT_CLASS: Record<PatientSegment, string> = {
  NEW: "oa-badge-new",
  REGULAR: "oa-badge-regular",
  VIP: "oa-badge-vip",
  INACTIVE: "oa-badge-inactive",
};
export function SegmentBadge({ segment }: { segment: PatientSegment }) {
  return <span className={`oa-badge ${SEGMENT_CLASS[segment]}`}>{SEGMENT_LABEL[segment]}</span>;
}

const VIS_LABEL: Record<ReviewVisibility, string> = {
  PUBLISHED: "Опубликован",
  PENDING: "На модерации",
  HIDDEN: "Скрыт",
};
const VIS_CLASS: Record<ReviewVisibility, string> = {
  PUBLISHED: "oa-badge-published",
  PENDING: "oa-badge-pending",
  HIDDEN: "oa-badge-hidden",
};
export function VisibilityBadge({ visibility }: { visibility: ReviewVisibility }) {
  return <span className={`oa-badge ${VIS_CLASS[visibility]}`}>{VIS_LABEL[visibility]}</span>;
}

const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  PENDING: "На модерации",
  APPROVED: "Одобрен",
  REJECTED: "Отклонён",
};
const REVIEW_STATUS_CLASS: Record<ReviewStatus, string> = {
  PENDING: "oa-badge-pending",
  APPROVED: "oa-badge-published",
  REJECTED: "oa-badge-hidden",
};
export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <span className={`oa-badge ${REVIEW_STATUS_CLASS[status]}`}>
      {REVIEW_STATUS_LABEL[status]}
    </span>
  );
}

/* ───────────────────────────  Avatar  ──────────────────────────────────── */
export function Avatar({ name, size = 38, tone = "blue" }: { name: string; size?: number; tone?: string }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const gradients: Record<string, string> = {
    blue: "linear-gradient(135deg,#5e6ad2,#4338ca)",
    violet: "linear-gradient(135deg,#8b5cf6,#6d28d9)",
    green: "linear-gradient(135deg,#30a46c,#059669)",
    amber: "linear-gradient(135deg,#f5a623,#ea580c)",
  };
  return (
    <span style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: gradients[tone] ?? gradients.blue, color: "#fff",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontWeight: 600, fontSize: size * 0.34,
      border: "1px solid var(--oa-border-strong)",
      boxShadow: "var(--oa-shadow-sm)",
    }}>
      {initials}
    </span>
  );
}

/* ───────────────────────────  Section header  ──────────────────────────── */
export function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="oa-section-header">
      <div>
        <div className="oa-section-title">{title}</div>
        {sub && <div className="oa-section-sub">{sub}</div>}
      </div>
      {action}
    </div>
  );
}

/* ───────────────────────────  Skeletons  ───────────────────────────────── */
export function SkeletonCard({ height = 100 }: { height?: number }) {
  return <div className="oa-skeleton" style={{ height }} />;
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="oa-skeleton" style={{ height: 44 }} />
      ))}
    </div>
  );
}

/* ───────────────────────────  Empty state  ─────────────────────────────── */
export function EmptyState({ icon, title, sub }: { icon?: ReactNode; title: string; sub?: string }) {
  return (
    <div className="oa-empty">
      {icon && <div className="oa-empty-icon">{icon}</div>}
      <div style={{ fontWeight: 700, color: "var(--oa-text)", fontSize: 15 }}>{title}</div>
      {sub && <div style={{ marginTop: 6, fontSize: 13, maxWidth: 360, color: "var(--oa-text-soft)" }}>{sub}</div>}
    </div>
  );
}

/* ───────────────────────────  Stat tile  ─────────────────────────────── */
export function StatTile({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div className="oa-stat-tile">
      <div className={`oa-stat-tile-value ${large ? "oa-stat-tile-value--lg" : ""}`}>{value}</div>
      <div className="oa-stat-tile-label">{label}</div>
    </div>
  );
}

/* ───────────────────────────  Pagination  ──────────────────────────────── */
export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="oa-pagination">
      <button className="oa-btn oa-btn-ghost oa-btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Назад</button>
      <span style={{ fontSize: 13, color: "var(--oa-text-soft)" }}>Стр. {page} из {pages}</span>
      <button className="oa-btn oa-btn-ghost oa-btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>Вперёд</button>
    </div>
  );
}

/* ───────────────────────────  Doctor performance  ──────────────────────── */
export function doctorPerformanceScore(d: {
  rating: number;
  patientsCount: number;
  appointmentsCount: number;
}): number {
  const ratingPart = (d.rating / 5) * 45;
  const patientsPart = Math.min(d.patientsCount / 80, 1) * 30;
  const apptPart = Math.min(d.appointmentsCount / 120, 1) * 25;
  return Math.min(100, Math.round(ratingPart + patientsPart + apptPart));
}

