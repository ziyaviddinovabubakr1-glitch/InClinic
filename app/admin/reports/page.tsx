"use client";

import { useEffect, useState } from "react";
import { getDashboardData, getAnalytics, exportData, money } from "@/lib/admin/services";
import type { DashboardData } from "@/lib/admin/types";
import type { AnalyticsData } from "@/lib/admin/services/analytics";
import { SectionHeader, SkeletonCard, StatTile } from "@/components/admin/ui";
import { MotionPage, MotionGrid, MotionItem } from "@/components/admin/motion";
import { AreaChart } from "@/components/admin/charts";
import { IReports, IDownload } from "@/components/admin/icons";

type ReportKind = "daily" | "weekly" | "monthly" | "yearly";

const REPORTS: { id: ReportKind; label: string; sub: string; preset: "today" | "week" | "month" | "year" }[] = [
  { id: "daily", label: "Ежедневный отчёт", sub: "Доход, записи и пациенты за сегодня", preset: "today" },
  { id: "weekly", label: "Еженедельный отчёт", sub: "Сводка за последние 7 дней", preset: "week" },
  { id: "monthly", label: "Ежемесячный отчёт", sub: "Полная картина текущего месяца", preset: "month" },
  { id: "yearly", label: "Годовой отчёт", sub: "Тренды и итоги за 12 месяцев", preset: "year" },
];

export default function ReportsPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [active, setActive] = useState<ReportKind>("monthly");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getDashboardData().then(setDashboard);
    getAnalytics({ preset: "month" }).then(setAnalytics);
  }, []);

  async function downloadReport(kind: ReportKind) {
    setBusy(true);
    setMessage(null);
    const result = await exportData({ category: "revenue", format: "CSV" });
    setBusy(false);
    if (result.pending || !result.content) {
      setMessage("Не удалось сформировать отчёт.");
      return;
    }
    const label = REPORTS.find((r) => r.id === kind)?.label ?? "Отчёт";
    const blob = new Blob([`\uFEFF${result.content}`], { type: result.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inclinic-${kind}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage(`${label} выгружен в CSV.`);
  }

  const activeMeta = REPORTS.find((r) => r.id === active)!;

  return (
    <MotionPage style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 980, margin: "0 auto", width: "100%" }}>
      <div className="oa-card oa-card-pad">
        <SectionHeader
          title="Отчёты"
          sub="Автоматические сводки по доходам, пациентам, записям и рейтингам"
          action={<span className="oa-badge oa-badge-confirmed"><span className="oa-badge-dot" /> Актуально</span>}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
          {REPORTS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setActive(r.id)}
              className="oa-card oa-card-hover"
              style={{
                padding: 18,
                textAlign: "left",
                cursor: "pointer",
                borderColor: active === r.id ? "rgba(212,175,55,0.45)" : undefined,
                boxShadow: active === r.id ? "0 0 0 1px rgba(212,175,55,0.25)" : undefined,
              }}
            >
              <div className="oa-kpi-icon oa-tone-gold" style={{ margin: 0, width: 36, height: 36 }}>
                <IReports style={{ width: 18, height: 18 }} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, marginTop: 12 }}>{r.label}</div>
              <div style={{ fontSize: 12.5, color: "var(--oa-text-soft)", marginTop: 4 }}>{r.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {!dashboard || !analytics ? (
        <SkeletonCard height={320} />
      ) : (
        <>
          <MotionGrid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 }}>
            <MotionItem><StatTile label="Доход за месяц" value={money(dashboard.kpis.revenueMonth)} large /></MotionItem>
            <MotionItem><StatTile label="Записей сегодня" value={String(dashboard.kpis.appointmentsToday)} large /></MotionItem>
            <MotionItem><StatTile label="Рейтинг" value={dashboard.overview.clinicRating.toFixed(1)} large /></MotionItem>
            <MotionItem><StatTile label="Health Score" value={String(dashboard.executive.clinicHealthScore)} large /></MotionItem>
          </MotionGrid>

          <MotionItem>
            <div className="oa-card oa-card-pad">
              <SectionHeader title={activeMeta.label} sub={`Лучший врач: ${dashboard.overview.bestDoctor.name} · ${dashboard.overview.bestDoctor.metric}`} />
              <div style={{ height: 220, marginBottom: 18 }}>
                <AreaChart data={analytics.revenue} color="#34d399" height={220} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <button className="oa-btn oa-btn-gold" disabled={busy} onClick={() => downloadReport(active)}>
                  <IDownload style={{ width: 16, height: 16 }} />
                  {busy ? "Формирование…" : "Скачать CSV"}
                </button>
                {message && <span style={{ fontSize: 13, color: "var(--oa-text-soft)" }}>{message}</span>}
              </div>
            </div>
          </MotionItem>
        </>
      )}
    </MotionPage>
  );
}
