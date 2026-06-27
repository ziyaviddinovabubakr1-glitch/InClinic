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
import { IChevronRight } from "@/components/admin/icons";

function DASHBOARD_KPIS(data: DashboardData) {
  const { kpis, overview } = data;
  return [
    {
      label: "Доход за месяц",
      value: money(kpis.revenueMonth),
      tone: "green" as const,
      delta: "+12%",
      deltaDir: "up" as const,
      hero: true,
    },
    {
      label: "Записей сегодня",
      value: String(kpis.appointmentsToday),
      tone: "violet" as const,
      delta: kpis.cancelledAppointments ? `${kpis.cancelledAppointments} отм.` : "активные",
      deltaDir: (kpis.cancelledAppointments ? "down" : "flat") as "down" | "flat",
    },
    {
      label: "Пациентов",
      value: String(kpis.totalPatients),
      tone: "sky" as const,
      delta: `${kpis.newPatientsToday} новых`,
      deltaDir: "up" as const,
    },
    {
      label: "Рейтинг",
      value: overview.clinicRating.toFixed(1),
      tone: "amber" as const,
      delta: `${kpis.reviewsThisMonth} отз.`,
      deltaDir: "flat" as const,
    },
    {
      label: "Загрузка",
      value: `${kpis.clinicLoad}%`,
      tone: "red" as const,
      delta: `ср. чек ${money(kpis.avgCheck)}`,
      deltaDir: "flat" as const,
    },
  ];
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) return <DashboardSkeleton />;

  const { kpis, executive, revenueSeries, appointmentsSeries, recentAppointments, latestReviews } = data;
  const kpisList = DASHBOARD_KPIS(data);
  const [hero, ...rest] = kpisList;

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
        <StaggerGrid className="oa-kpi-grid oa-kpi-grid--compact">
          <StaggerItem key={hero.label} className="oa-kpi-hero-slot">
            <KpiCard
              label={hero.label}
              value={hero.value}
              tone={hero.tone}
              delta={hero.delta}
              deltaDir={hero.deltaDir}
              hero
            />
          </StaggerItem>
          {rest.map((k) => (
            <StaggerItem key={k.label}>
              <KpiCard
                label={k.label}
                value={k.value}
                tone={k.tone}
                delta={k.delta}
                deltaDir={k.deltaDir}
              />
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
        </div>

        <aside className="oa-dash-v3-rail">
          <div className="oa-panel oa-panel-rail">
            <div className="oa-panel-head">
              <span className="oa-panel-title">Здоровье</span>
            </div>
            <div className="oa-rail-gauge">
              <Gauge value={executive.clinicHealthScore} size={58} label="Клиника" captionBelow />
            </div>
            <div className="oa-rail-stats">
              <RailStat label="Доход сегодня" value={money(kpis.revenueToday)} tone="green" />
              <RailStat label="Приёмов всего" value={String(executive.totalCompletedAppointments)} tone="violet" />
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
      <div className="oa-dash-v3-kpi">
        <div className="oa-kpi-grid oa-kpi-grid--compact">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} height={76} />)}
        </div>
      </div>
      <div className="oa-dash-v3-body">
        <SkeletonCard height={180} />
        <SkeletonCard height={180} />
      </div>
    </div>
  );
}
