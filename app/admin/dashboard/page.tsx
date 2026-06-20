"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardData, money } from "@/lib/admin/services";
import type { DashboardData } from "@/lib/admin/types";
import { AreaChart, BarChart, Gauge } from "@/components/admin/charts";
import {
  KpiCard, Stars, StatusBadge, Avatar, SectionHeader, SkeletonCard, SkeletonRows,
} from "@/components/admin/ui";
import { MotionPage, MotionGrid, MotionItem } from "@/components/admin/motion";
import {
  IPatients, IAppointments, IMoney, ISpark, IHeart, ITrendUp, IDoctors, IReviews,
  IServices, ICalendar, IChevronRight, IActivity,
} from "@/components/admin/icons";

function toSpark(series: { value: number }[]) {
  return series.map((p) => p.value);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    getDashboardData().then(setData);
  }, []);

  if (!data) return <DashboardSkeleton />;

  const { kpis, executive, overview, revenueSeries, appointmentsSeries, recentAppointments, latestReviews } = data;
  const revenueSpark = toSpark(revenueSeries);
  const apptSpark = toSpark(appointmentsSeries);

  return (
    <MotionPage style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Executive KPI hero row */}
      <MotionGrid className="oa-kpi-hero-grid">
        <MotionItem>
          <KpiCard hero label="Доход за месяц" value={money(kpis.revenueMonth)} icon={IMoney} tone="green" delta="+12% к прошлому" deltaDir="up" sparkData={revenueSpark} />
        </MotionItem>
        <MotionItem>
          <KpiCard hero label="Пациентов сегодня" value={String(kpis.patientsToday)} icon={IPatients} tone="blue" delta="за сутки" deltaDir="flat" sparkData={apptSpark} />
        </MotionItem>
        <MotionItem>
          <KpiCard hero label="Записей сегодня" value={String(kpis.appointmentsToday)} icon={IAppointments} tone="sky" delta={`${kpis.cancelledAppointments} отменён.`} deltaDir={kpis.cancelledAppointments ? "down" : "flat"} sparkData={apptSpark} />
        </MotionItem>
        <MotionItem>
          <KpiCard hero label="Рейтинг клиники" value={overview.clinicRating.toFixed(1)} icon={IReviews} tone="amber" delta="средняя оценка" deltaDir="up" sparkData={revenueSpark} />
        </MotionItem>
        <MotionItem>
          <KpiCard hero label="Health Score" value={String(executive.clinicHealthScore)} icon={IActivity} tone="green" delta="из 100" deltaDir="up" sparkData={apptSpark} />
        </MotionItem>
      </MotionGrid>

      {/* Secondary metrics */}
      <MotionGrid className="oa-kpi-grid-secondary">
        <MotionItem><KpiCard label="Доход сегодня" value={money(kpis.revenueToday)} icon={IMoney} tone="green" sparkData={revenueSpark} /></MotionItem>
        <MotionItem><KpiCard label="Доход за неделю" value={money(kpis.revenueWeek)} icon={ITrendUp} tone="blue" sparkData={revenueSpark} /></MotionItem>
        <MotionItem><KpiCard label="Новых пациентов" value={String(kpis.newPatients)} icon={ISpark} tone="violet" delta="за неделю" deltaDir="up" sparkData={revenueSpark} /></MotionItem>
        <MotionItem><KpiCard label="Средний чек" value={money(kpis.avgCheck)} icon={IServices} tone="amber" sparkData={revenueSpark} /></MotionItem>
        <MotionItem><KpiCard label="Загрузка клиники" value={`${kpis.clinicLoad}%`} icon={IHeart} tone="red" sparkData={apptSpark} /></MotionItem>
      </MotionGrid>

      {/* Lifetime executive panel */}
      <MotionItem>
        <div className="oa-executive-panel">
          <SectionHeader title="Итоговые показатели" sub="Накопительные данные за всё время работы клиники" />
          <div className="oa-executive-panel-inner">
            <div className="oa-health-block">
              <Gauge value={executive.clinicHealthScore} size={168} label="Health Score" />
              <span className="oa-health-label">Индекс здоровья клиники</span>
            </div>
            <div className="oa-lifetime-grid">
              <LifetimeStat label="Общий доход" value={money(executive.totalLifetimeRevenue)} tone="green" />
              <LifetimeStat label="Всего пациентов" value={String(executive.totalLifetimePatients)} tone="blue" />
              <LifetimeStat label="Завершённых приёмов" value={String(executive.totalCompletedAppointments)} tone="violet" />
              <LifetimeStat label="Средний рейтинг врачей" value={executive.averageDoctorRating.toFixed(1)} tone="amber" />
            </div>
          </div>
        </div>
      </MotionItem>

      <div>
        <SectionHeader title="Бизнес-обзор" sub="Ключевые лидеры и закономерности" />
        <MotionGrid style={gridAuto(240)}>
          <MotionItem><OverviewCard icon={IDoctors} tone="blue" title="Лучший врач" name={overview.bestDoctor.name} metric={overview.bestDoctor.metric} /></MotionItem>
          <MotionItem><OverviewCard icon={IServices} tone="green" title="Прибыльная услуга" name={overview.topService.name} metric={overview.topService.metric} /></MotionItem>
          <MotionItem><OverviewCard icon={IAppointments} tone="violet" title="Самый загруженный врач" name={overview.busiestDoctor.name} metric={overview.busiestDoctor.metric} /></MotionItem>
          <MotionItem><OverviewCard icon={ICalendar} tone="amber" title="Загруженный день" name={overview.busiestDay.label} metric={overview.busiestDay.metric} /></MotionItem>
          <MotionItem><OverviewCard icon={IMoney} tone="sky" title="Прибыльный месяц" name={overview.mostProfitableMonth.label} metric={overview.mostProfitableMonth.metric} /></MotionItem>
          <MotionItem><OverviewCard icon={IReviews} tone="amber" title="Рейтинг клиники" name={`${overview.clinicRating.toFixed(1)} из 5`} metric="средняя оценка" /></MotionItem>
        </MotionGrid>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 20 }}>
        <MotionItem>
          <div className="oa-chart-card">
            <SectionHeader title="Доход" sub="Последние 14 дней" />
            <AreaChart data={revenueSeries} color="#059669" />
          </div>
        </MotionItem>
        <MotionItem>
          <div className="oa-chart-card">
            <SectionHeader title="Записи" sub="Последние 14 дней" />
            <BarChart data={appointmentsSeries} />
          </div>
        </MotionItem>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 20 }}>
        <MotionItem>
          <div className="oa-card">
            <div className="oa-card-pad" style={{ paddingBottom: 4 }}>
              <SectionHeader title="Последние записи" action={<Link href="/admin/appointments" className="oa-btn oa-btn-soft oa-btn-sm">Все <IChevronRight style={{ width: 14, height: 14 }} /></Link>} />
            </div>
            <div className="oa-table-wrap">
              <table className="oa-table">
                <tbody>
                  {recentAppointments.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar name={a.patientName} size={34} />
                          <div>
                            <div className="oa-cell-strong">{a.patientName}</div>
                            <div className="oa-cell-soft" style={{ fontSize: 12 }}>{a.serviceName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="oa-cell-soft">{a.date}</td>
                      <td><StatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </MotionItem>

        <MotionItem>
          <div className="oa-card">
            <div className="oa-card-pad" style={{ paddingBottom: 4 }}>
              <SectionHeader title="Последние отзывы" action={<Link href="/admin/reviews" className="oa-btn oa-btn-soft oa-btn-sm">Все <IChevronRight style={{ width: 14, height: 14 }} /></Link>} />
            </div>
            <div style={{ padding: "4px 22px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
              {latestReviews.map((r) => (
                <div key={r.id} style={{ display: "flex", gap: 11, paddingBottom: 12, borderBottom: "1px solid var(--oa-border)" }}>
                  <Avatar name={r.patientName} size={34} tone="violet" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span className="oa-cell-strong" style={{ fontSize: 13 }}>{r.patientName}</span>
                      <Stars rating={r.rating} size={13} />
                    </div>
                    <div className="oa-cell-soft" style={{ fontSize: 12.5, marginTop: 3 }}>{r.comment}</div>
                    <div style={{ fontSize: 11.5, color: "var(--oa-text-faint)", marginTop: 3 }}>→ {r.doctorName}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MotionItem>
      </div>
    </MotionPage>
  );
}

function gridAuto(min: number): React.CSSProperties {
  return { display: "grid", gridTemplateColumns: `repeat(auto-fit,minmax(${min}px,1fr))`, gap: 16 };
}

function LifetimeStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="oa-lifetime-stat">
      <div style={{ fontSize: 12.5, color: "var(--oa-text-soft)", fontWeight: 500 }}>{label}</div>
      <div className={`oa-lifetime-stat-value oa-lifetime-stat-value--${tone}`}>{value}</div>
    </div>
  );
}

function OverviewCard({ icon: Icon, tone, title, name, metric }: {
  icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element; tone: string; title: string; name: string; metric: string;
}) {
  return (
    <div className="oa-overview-card">
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div className={`oa-kpi-icon oa-tone-${tone}`} style={{ margin: 0, width: 40, height: 40 }}>
          <Icon style={{ width: 19, height: 19 }} />
        </div>
        <span style={{ fontSize: 12.5, color: "var(--oa-text-faint)", fontWeight: 600, letterSpacing: "0.02em" }}>{title}</span>
      </div>
      <div className="oa-overview-card-name">{name}</div>
      <div style={{ fontSize: 13, color: "var(--oa-text-soft)", marginTop: 5 }}>{metric}</div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="oa-kpi-hero-grid">{Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} height={148} />)}</div>
      <div style={gridAuto(220)}>{Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} height={120} />)}</div>
      <SkeletonCard height={220} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 20 }}>
        <SkeletonCard height={300} /><SkeletonCard height={300} />
      </div>
      <SkeletonRows rows={6} />
    </div>
  );
}
