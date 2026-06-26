"use client";

import Link from "next/link";
import { useDashboard } from "@/lib/admin/query/hooks";
import { money } from "@/lib/admin/services";
import type { DashboardData } from "@/lib/admin/types";
import { AreaChart, BarChart, Gauge } from "@/components/admin/charts";
import {
  KpiCard, Stars, StatusBadge, Avatar, SkeletonCard, ReviewStatusBadge,
} from "@/components/admin/ui";
import { MotionPage, StaggerGrid, StaggerItem } from "@/components/admin/motion";
import PageHeader from "@/components/admin/PageHeader";
import {
  IDoctors, IAppointments, IMoney, IServices, ICalendar, IChevronRight, IReviews,
} from "@/components/admin/icons";

function toSpark(series: { value: number }[]) {
  return series.map((p) => p.value);
}

const PRIMARY_KPIS = (data: DashboardData, revenueSpark: number[], apptSpark: number[]) => [
  { label: "Доход за месяц", value: money(data.kpis.revenueMonth), tone: "green" as const, delta: "+12%", deltaDir: "up" as const, spark: revenueSpark },
  { label: "Новых сегодня", value: String(data.kpis.newPatientsToday), tone: "blue" as const, delta: "регистрации", deltaDir: "up" as const, spark: apptSpark },
  { label: "Записей сегодня", value: String(data.kpis.appointmentsToday), tone: "violet" as const, delta: `${data.kpis.cancelledAppointments} отм.`, deltaDir: (data.kpis.cancelledAppointments ? "down" : "flat") as "down" | "flat", spark: apptSpark },
  { label: "Всего пациентов", value: String(data.kpis.totalPatients), tone: "sky" as const, delta: `${data.kpis.returningPatients} повтор.`, deltaDir: "flat" as const, spark: revenueSpark },
  { label: "Health Score", value: String(data.executive.clinicHealthScore), tone: "amber" as const, delta: "из 100", deltaDir: "up" as const, spark: apptSpark },
];

const REVIEW_KPIS = (data: DashboardData, revenueSpark: number[]) => [
  { label: "Рейтинг клиники", value: data.kpis.averageClinicRating.toFixed(1), tone: "amber" as const, delta: "из 5", deltaDir: "up" as const, spark: revenueSpark },
  { label: "Отзывов за месяц", value: String(data.kpis.reviewsThisMonth), tone: "violet" as const, delta: `${data.kpis.pendingReviews} ожид.`, deltaDir: "flat" as const, spark: revenueSpark },
  { label: "Лучший врач", value: data.overview.topRatedDoctor.name.split(" ")[0] ?? "—", tone: "blue" as const, delta: `${data.overview.topRatedDoctor.rating.toFixed(1)} ★`, deltaDir: "up" as const, spark: revenueSpark },
];

const SECONDARY_KPIS = (data: DashboardData, revenueSpark: number[], apptSpark: number[]) => [
  { label: "Доход сегодня", value: money(data.kpis.revenueToday), tone: "green" as const, spark: revenueSpark },
  { label: "Доход за неделю", value: money(data.kpis.revenueWeek), tone: "blue" as const, spark: revenueSpark },
  { label: "Новых за неделю", value: String(data.kpis.newPatients), tone: "violet" as const, delta: "регистрации", deltaDir: "up" as const, spark: revenueSpark },
  { label: "С визитами сегодня", value: String(data.kpis.patientsToday), tone: "amber" as const, spark: apptSpark },
  { label: "Средний чек", value: money(data.kpis.avgCheck), tone: "sky" as const, spark: revenueSpark },
  { label: "Загрузка", value: `${data.kpis.clinicLoad}%`, tone: "red" as const, spark: apptSpark },
];

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) return <DashboardSkeleton />;

  const { kpis, executive, overview, revenueSeries, appointmentsSeries, recentAppointments, latestReviews } = data;
  const revenueSpark = toSpark(revenueSeries);
  const apptSpark = toSpark(appointmentsSeries);

  const insights = [
    { icon: IDoctors, tone: "blue", title: "Лучший врач", name: overview.bestDoctor.name, metric: overview.bestDoctor.metric },
    { icon: IServices, tone: "green", title: "Топ услуга", name: overview.topService.name, metric: overview.topService.metric },
    { icon: IAppointments, tone: "violet", title: "Загрузка", name: overview.busiestDoctor.name, metric: overview.busiestDoctor.metric },
    { icon: ICalendar, tone: "amber", title: "Пиковый день", name: overview.busiestDay.label, metric: overview.busiestDay.metric },
    { icon: IMoney, tone: "sky", title: "Лучший месяц", name: overview.mostProfitableMonth.label, metric: overview.mostProfitableMonth.metric },
    { icon: IReviews, tone: "amber", title: "Топ врач", name: overview.topRatedDoctor.name, metric: `${overview.topRatedDoctor.rating.toFixed(1)} ★ · ${overview.topRatedDoctor.reviews} отз.` },
  ];

  return (
    <MotionPage className="oa-dash-v3">
      <PageHeader
        title="Обзор клиники"
        sub={`${kpis.appointmentsToday} записей сегодня · загрузка ${kpis.clinicLoad}%`}
        action={
          <Link href="/admin/analytics" className="oa-btn oa-btn-ghost oa-btn-sm" style={{ textDecoration: "none" }}>
            Аналитика <IChevronRight style={{ width: 12, height: 12 }} />
          </Link>
        }
      />

      <section className="oa-dash-v3-kpi">
        <StaggerGrid className="oa-kpi-strip oa-kpi-strip--hero">
          {PRIMARY_KPIS(data, revenueSpark, apptSpark).map((k) => (
            <StaggerItem key={k.label}>
              <KpiCard label={k.label} value={k.value} tone={k.tone} delta={k.delta} deltaDir={k.deltaDir} sparkData={k.spark} />
            </StaggerItem>
          ))}
        </StaggerGrid>
        <StaggerGrid className="oa-kpi-strip oa-kpi-strip--muted oa-kpi-strip--3 oa-kpi-strip--mid">
          {REVIEW_KPIS(data, revenueSpark).map((k) => (
            <StaggerItem key={k.label}>
              <KpiCard label={k.label} value={k.value} tone={k.tone} delta={k.delta} deltaDir={k.deltaDir} sparkData={k.spark} />
            </StaggerItem>
          ))}
        </StaggerGrid>
        <StaggerGrid className="oa-kpi-strip oa-kpi-strip--muted oa-kpi-strip--3">
          {SECONDARY_KPIS(data, revenueSpark, apptSpark).map((k) => (
            <StaggerItem key={k.label}>
              <KpiCard label={k.label} value={k.value} tone={k.tone} delta={k.delta} deltaDir={k.deltaDir} sparkData={k.spark} />
            </StaggerItem>
          ))}
        </StaggerGrid>
      </section>

      <section className="oa-dash-v3-body">
        <div className="oa-dash-v3-main">
          <div className="oa-dash-v3-charts">
            <div className="oa-panel oa-panel-chart">
              <div className="oa-panel-head">
                <span className="oa-panel-title">Доход</span>
                <span className="oa-panel-meta">14 дней</span>
              </div>
              <AreaChart data={revenueSeries} color="#30a46c" height={72} />
            </div>
            <div className="oa-panel oa-panel-chart">
              <div className="oa-panel-head">
                <span className="oa-panel-title">Записи</span>
                <span className="oa-panel-meta">14 дней</span>
              </div>
              <BarChart data={appointmentsSeries} height={72} />
            </div>
          </div>

          <div className="oa-dash-v3-insights">
            {insights.map(({ icon: Icon, tone, title, name, metric }) => (
              <div key={title} className="oa-insight-tile">
                <div className={`oa-insight-icon oa-tone-${tone}`}>
                  <Icon style={{ width: 12, height: 12 }} />
                </div>
                <div className="oa-insight-body">
                  <div className="oa-insight-label">{title}</div>
                  <div className="oa-insight-name">{name}</div>
                  <div className="oa-insight-metric">{metric}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="oa-dash-v3-rail">
          <div className="oa-panel oa-panel-rail">
            <div className="oa-panel-head">
              <span className="oa-panel-title">Показатели</span>
            </div>
            <div className="oa-rail-gauge">
              <Gauge value={executive.clinicHealthScore} size={52} label="Здоровье" />
            </div>
            <div className="oa-rail-stats">
              <RailStat label="Общий доход" value={money(executive.totalLifetimeRevenue)} tone="green" />
              <RailStat label="Всего пациентов" value={String(kpis.totalPatients)} tone="blue" />
              <RailStat label="Приёмов" value={String(executive.totalCompletedAppointments)} tone="violet" />
              <RailStat label="Рейтинг врачей" value={executive.averageDoctorRating.toFixed(1)} tone="amber" />
            </div>
          </div>
        </aside>
      </section>

      <section className="oa-dash-v3-split">
        <div className="oa-panel oa-panel-table">
          <div className="oa-panel-head oa-panel-head--row">
            <span className="oa-panel-title">Последние записи</span>
            <Link href="/admin/appointments" className="oa-link-sm">
              Все <IChevronRight style={{ width: 11, height: 11 }} />
            </Link>
          </div>
          <div className="oa-table-wrap">
            <table className="oa-table oa-table-dense oa-table-appointments">
              <thead>
                <tr>
                  <th>Пациент</th>
                  <th>Дата</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="oa-cell-user oa-appointment-user" title={`${a.patientName} · ${a.patientPhone} · ${a.serviceName}`}>
                        <Avatar name={a.patientName} size={22} />
                        <div className="oa-appointment-line">
                          {a.patientId ? (
                            <Link href={`/admin/patients/${a.patientId}`} className="oa-cell-link oa-appointment-name">
                              {a.patientName}
                            </Link>
                          ) : (
                            <span className="oa-appointment-name">{a.patientName}</span>
                          )}
                          <span className="oa-appointment-sep">·</span>
                          <span className="oa-appointment-meta">{a.serviceName}</span>
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

        <div className="oa-panel oa-panel-table">
          <div className="oa-panel-head oa-panel-head--row">
            <span className="oa-panel-title">Последние отзывы</span>
            <Link href="/admin/reviews" className="oa-link-sm">
              Все <IChevronRight style={{ width: 11, height: 11 }} />
            </Link>
          </div>
          <div className="oa-reviews-dense">
            {latestReviews.map((r) => (
              <div key={r.id} className="oa-review-dense">
                <Avatar name={r.patientName} size={24} tone="violet" />
                <div className="oa-review-dense-body">
                  <div className="oa-review-dense-top">
                    <span className="oa-cell-strong">{r.patientName}</span>
                    <div className="oa-review-dense-meta">
                      <Stars rating={r.rating} size={10} />
                      <ReviewStatusBadge status={r.status} />
                    </div>
                  </div>
                  <div className="oa-cell-soft oa-review-dense-text">{r.comment}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MotionPage>
  );
}

function RailStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="oa-rail-stat">
      <span className="oa-rail-stat-label">{label}</span>
      <span className={`oa-rail-stat-value oa-rail-stat-value--${tone}`}>{value}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="oa-dash-v3">
      <SkeletonCard height={36} />
      <div className="oa-kpi-strip">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} height={44} />)}
      </div>
      <div className="oa-dash-v3-body">
        <SkeletonCard height={180} />
        <SkeletonCard height={180} />
      </div>
    </div>
  );
}
