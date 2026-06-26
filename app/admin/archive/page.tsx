"use client";

import { useArchiveSummary } from "@/lib/admin/query/hooks";
import { money } from "@/lib/admin/services";
import { SkeletonCard } from "@/components/admin/ui";
import { MotionPage, MotionGrid, MotionItem } from "@/components/admin/motion";
import {
  IAppointments, IPatients, IMoney, IReviews, IDoctors, IShield,
} from "@/components/admin/icons";

export default function ArchivePage() {
  const { data: summary, isLoading } = useArchiveSummary();

  return (
    <MotionPage style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="oa-callout oa-callout-success">
        <IShield style={{ width: 20, height: 20, color: "var(--oa-success)", flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: "var(--oa-text-soft)" }}>
          Архив — неизменяемое хранилище. Завершённые приёмы, история пациентов, доходы и отзывы сохраняются навсегда и доступны для аналитики.
        </span>
      </div>

      {isLoading || !summary ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} height={110} />)}
        </div>
      ) : (
        <MotionGrid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
          <MotionItem><ArchiveCard icon={IAppointments} tone="blue" label="Завершённые приёмы" value={String(summary.completedAppointments)} /></MotionItem>
          <MotionItem><ArchiveCard icon={IPatients} tone="violet" label="Историч. пациенты" value={String(summary.historicalPatients)} /></MotionItem>
          <MotionItem><ArchiveCard icon={IMoney} tone="green" label="Архив дохода" value={money(summary.totalArchivedRevenue)} /></MotionItem>
          <MotionItem><ArchiveCard icon={IMoney} tone="sky" label="Записей о платежах" value={String(summary.revenueRecords)} /></MotionItem>
          <MotionItem><ArchiveCard icon={IReviews} tone="amber" label="Отзывов в архиве" value={String(summary.reviewsArchived)} /></MotionItem>
          <MotionItem><ArchiveCard icon={IDoctors} tone="blue" label="Снимков врачей" value={String(summary.doctorPerformanceSnapshots)} /></MotionItem>
        </MotionGrid>
      )}
    </MotionPage>
  );
}

function ArchiveCard({ icon: Icon, tone, label, value }: {
  icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element; tone: string; label: string; value: string;
}) {
  return (
    <div className="oa-kpi">
      <div className={`oa-kpi-icon oa-tone-${tone}`}><Icon style={{ width: 19, height: 19 }} /></div>
      <div className="oa-kpi-label">{label}</div>
      <div className="oa-kpi-value" style={{ fontSize: 22 }}>{value}</div>
    </div>
  );
}
