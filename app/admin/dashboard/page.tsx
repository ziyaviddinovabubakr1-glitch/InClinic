"use client";

import Link from "next/link";
import { useDashboard } from "@/lib/admin/query/hooks";
import { money } from "@/lib/admin/services";
import { AreaChart, BarChart, Gauge } from "@/components/admin/charts";
import {
  KpiCard, Stars, StatusBadge, Avatar, SkeletonCard, ReviewStatusBadge,
} from "@/components/admin/ui";
import { MotionPage, StaggerItem } from "@/components/admin/motion";
import PageHeader from "@/components/admin/PageHeader";
import { IChevronRight } from "@/components/admin/icons";

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) return <DashboardSkeleton />;

  const {
    kpis,
    executive,
    overview,
    revenueSeries,
    appointmentsSeries,
    recentAppointments,
    latestReviews,
  } = data;

  const summary = [
    `${kpis.appointmentsToday} ${pluralRecords(kpis.appointmentsToday)} сегодня`,
    `${kpis.totalPatients} ${pluralPatients(kpis.totalPatients)}`,
    `рейтинг ${overview.clinicRating.toFixed(1)}`,
  ].join(" · ");

  return (
    <MotionPage className="oa-dash-v3">
      <PageHeader
        title="Обзор клиники"
        sub={summary}
        action={
          <Link href="/admin/analytics" className="oa-btn oa-btn-ghost oa-btn-sm" style={{ textDecoration: "none" }}>
            Подробнее <IChevronRight style={{ width: 12, height: 12 }} />
          </Link>
        }
      />

      <section className="oa-dash-v3-kpi oa-dash-v3-kpi--solo">
        <StaggerItem>
          <KpiCard
            label="Доход за месяц"
            value={money(kpis.revenueMonth)}
            tone="green"
            delta={`сегодня ${money(kpis.revenueToday)}`}
            deltaDir="up"
            hero
          />
        </StaggerItem>
      </section>

      <section className="oa-dash-v3-body oa-dash-v3-body--simple">
        <div className="oa-dash-v3-main">
          <div className="oa-dash-v3-charts">
            <div className="oa-panel oa-panel-chart">
              <div className="oa-panel-head">
                <span className="oa-panel-title">Доход</span>
                <span className="oa-panel-meta">14 дней</span>
              </div>
              <AreaChart data={revenueSeries} color="#30a46c" height={80} />
            </div>
            <div className="oa-panel oa-panel-chart">
              <div className="oa-panel-head">
                <span className="oa-panel-title">Записи</span>
                <span className="oa-panel-meta">14 дней</span>
              </div>
              <BarChart data={appointmentsSeries} height={80} />
            </div>
          </div>
        </div>

        <aside className="oa-dash-v3-rail">
          <div className="oa-panel oa-panel-rail oa-panel-rail--solo">
            <div className="oa-panel-head">
              <span className="oa-panel-title">Состояние</span>
            </div>
            <div className="oa-rail-gauge">
              <Gauge value={executive.clinicHealthScore} size={64} label="Клиника" captionBelow />
            </div>
          </div>
        </aside>
      </section>

      <section className="oa-dash-v3-split">
        <div className="oa-panel oa-panel-table">
          <div className="oa-panel-head oa-panel-head--row">
            <span className="oa-panel-title">Ближайшие записи</span>
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
                      <div className="oa-cell-user oa-appointment-user" title={`${a.patientName} · ${a.serviceName}`}>
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
            <span className="oa-panel-title">Новые отзывы</span>
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

function pluralRecords(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "запись";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "записи";
  return "записей";
}

function pluralPatients(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "пациент";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "пациента";
  return "пациентов";
}

function DashboardSkeleton() {
  return (
    <div className="oa-dash-v3">
      <SkeletonCard height={36} />
      <SkeletonCard height={88} />
      <div className="oa-dash-v3-body">
        <SkeletonCard height={180} />
        <SkeletonCard height={180} />
      </div>
    </div>
  );
}
