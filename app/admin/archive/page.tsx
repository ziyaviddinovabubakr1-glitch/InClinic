"use client";

import { useArchiveSummary } from "@/lib/admin/query/hooks";
import { money } from "@/lib/admin/services";
import { SkeletonCard } from "@/components/admin/ui";
import { MotionPage, MotionGrid, MotionItem } from "@/components/admin/motion";
import AdminIcon3d from "@/components/admin/AdminIcon3d";
import PageHeader from "@/components/admin/PageHeader";
import {
  IAppointments, IPatients, IMoney, IReviews, IDoctors,
} from "@/components/admin/icons";

export default function ArchivePage() {
  const { data: summary, isLoading } = useArchiveSummary();

  return (
    <MotionPage style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <PageHeader title="Архив" sub="Завершённые данные клиники · постоянное хранение" />

      {isLoading || !summary ? (
        <div className="oa-archive-grid">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} height={150} />)}
        </div>
      ) : (
        <MotionGrid className="oa-archive-grid">
          <MotionItem><ArchiveCard icon={IAppointments} label="Завершённые приёмы" value={String(summary.completedAppointments)} /></MotionItem>
          <MotionItem><ArchiveCard icon={IPatients} label="Историч. пациенты" value={String(summary.historicalPatients)} /></MotionItem>
          <MotionItem><ArchiveCard icon={IMoney} label="Архив дохода" value={money(summary.totalArchivedRevenue)} /></MotionItem>
          <MotionItem><ArchiveCard icon={IMoney} label="Записей о платежах" value={String(summary.revenueRecords)} /></MotionItem>
          <MotionItem><ArchiveCard icon={IReviews} label="Отзывов в архиве" value={String(summary.reviewsArchived)} /></MotionItem>
          <MotionItem><ArchiveCard icon={IDoctors} label="Снимков врачей" value={String(summary.doctorPerformanceSnapshots)} /></MotionItem>
        </MotionGrid>
      )}
    </MotionPage>
  );
}

function ArchiveCard({ icon: Icon, label, value }: {
  icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element; label: string; value: string;
}) {
  return (
    <div className="oa-stat-card oa-archive-card">
      <AdminIcon3d icon={Icon} size={32} iconSize={15} />
      <div className="oa-kpi-label">{label}</div>
      <div className="oa-kpi-value">{value}</div>
    </div>
  );
}
