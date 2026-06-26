"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useDoctorAnalytics } from "@/lib/admin/query/hooks";
import { money } from "@/lib/admin/services";
import { AreaChart, BarChart } from "@/components/admin/charts";
import {
  Avatar, Stars, StatTile, SkeletonCard, EmptyState,
} from "@/components/admin/ui";
import { MotionPage } from "@/components/admin/motion";
import PageHeader from "@/components/admin/PageHeader";
import { IArrowLeft, IDoctors } from "@/components/admin/icons";

export default function DoctorAnalyticsPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading, isError } = useDoctorAnalytics(id);

  if (isError || (!isLoading && !data)) {
    return (
      <MotionPage>
        <EmptyState icon={<IDoctors />} title="Аналитика недоступна" sub="Врач не найден или ошибка загрузки" />
        <Link href="/admin/doctors" className="oa-btn oa-btn-ghost oa-btn-sm" style={{ marginTop: 16 }}>
          <IArrowLeft style={{ width: 14, height: 14 }} /> К списку врачей
        </Link>
      </MotionPage>
    );
  }

  if (isLoading || !data) return <AnalyticsSkeleton />;

  return (
    <MotionPage className="oa-doctor-analytics">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <Link href="/admin/doctors" className="oa-btn oa-btn-ghost oa-btn-icon" aria-label="Назад">
          <IArrowLeft />
        </Link>
        <Avatar name={data.doctorName ?? "—"} size={44} tone="blue" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <PageHeader
            title={data.doctorName ?? "Врач"}
            sub={`${data.doctorSpecialty ?? ""} · загрузка ${data.load}%`}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Stars rating={data.rating} size={14} />
          <span className="oa-cell-strong">{data.rating.toFixed(1)}</span>
          <span className="oa-cell-soft" style={{ fontSize: 12 }}>({data.reviewCount})</span>
        </div>
      </div>

      <div className="oa-profile-stats">
        <StatTile label="Пациенты" value={String(data.patients)} large />
        <StatTile label="Записи" value={String(data.appointments)} large />
        <StatTile label="Завершено" value={String(data.completedVisits)} large />
        <StatTile label="Отменено" value={String(data.cancelledVisits)} large />
        <StatTile label="Доход" value={money(data.revenue)} large />
        <StatTile label="Повторные" value={String(data.repeatPatients)} large />
      </div>

      <div className="oa-dash-v3-charts">
        <div className="oa-panel oa-panel-chart">
          <div className="oa-panel-head">
            <span className="oa-panel-title">Визиты</span>
            <span className="oa-panel-meta">14 дней</span>
          </div>
          <BarChart data={data.visitsSeries} height={120} />
        </div>
        <div className="oa-panel oa-panel-chart">
          <div className="oa-panel-head">
            <span className="oa-panel-title">Доход</span>
            <span className="oa-panel-meta">14 дней</span>
          </div>
          <AreaChart data={data.revenueSeries} color="#30a46c" height={120} />
        </div>
      </div>

      <div className="oa-dash-v3-charts">
        <div className="oa-panel oa-panel-chart">
          <div className="oa-panel-head">
            <span className="oa-panel-title">Рост пациентов</span>
            <span className="oa-panel-meta">6 месяцев</span>
          </div>
          <AreaChart data={data.patientsGrowth} color="#5e6ad2" height={120} />
        </div>
        <div className="oa-panel oa-panel-chart">
          <div className="oa-panel-head">
            <span className="oa-panel-title">Доход по месяцам</span>
            <span className="oa-panel-meta">6 месяцев</span>
          </div>
          <AreaChart data={data.performance} color="#3b82f6" height={120} />
        </div>
      </div>
    </MotionPage>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="oa-doctor-analytics">
      <SkeletonCard height={48} />
      <div className="oa-profile-stats">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} height={72} />
        ))}
      </div>
      <div className="oa-dash-v3-charts">
        <SkeletonCard height={160} />
        <SkeletonCard height={160} />
      </div>
    </div>
  );
}
