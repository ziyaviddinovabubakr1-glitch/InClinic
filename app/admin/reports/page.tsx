"use client";

import { useState } from "react";
import { useDashboard, useAnalytics } from "@/lib/admin/query/hooks";
import { exportData, money } from "@/lib/admin/services";
import { SectionHeader, SkeletonCard, StatTile } from "@/components/admin/ui";
import { MotionPage, MotionGrid, MotionItem } from "@/components/admin/motion";
import { AreaChart } from "@/components/admin/charts";
import AdminIcon3d from "@/components/admin/AdminIcon3d";
import { IReports, IDownload } from "@/components/admin/icons";

type ReportKind = "daily" | "weekly" | "monthly" | "yearly";

const REPORTS: { id: ReportKind; label: string; sub: string; preset: "today" | "week" | "month" | "year" }[] = [
  { id: "monthly", label: "Ежемесячный отчёт", sub: "Полная картина текущего месяца — доход, записи и рейтинг", preset: "month" },
  { id: "daily", label: "Ежедневный отчёт", sub: "Доход, записи и пациенты за сегодня", preset: "today" },
  { id: "weekly", label: "Еженедельный отчёт", sub: "Сводка за последние 7 дней", preset: "week" },
  { id: "yearly", label: "Годовой отчёт", sub: "Тренды и итоги за 12 месяцев", preset: "year" },
];

const REPORT_ORDER: ReportKind[] = ["monthly", "daily", "weekly", "yearly"];

export default function ReportsPage() {
  const { data: dashboard, isLoading: dashLoading } = useDashboard();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics({ preset: "month" });
  const [active, setActive] = useState<ReportKind>("monthly");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loading = dashLoading || analyticsLoading;

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
  const secondaryReports = REPORT_ORDER.filter((id) => id !== active).map(
    (id) => REPORTS.find((r) => r.id === id)!,
  );

  return (
    <MotionPage style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 980, margin: "0 auto", width: "100%" }}>
      <div className="oa-card oa-card-pad">
        <SectionHeader
          title="Отчёты"
          sub="Автоматические сводки по доходам, пациентам, записям и рейтингам"
          action={<span className="oa-badge oa-badge-confirmed"><span className="oa-badge-dot" /> Актуально</span>}
        />
        <div className="oa-reports-picker">
          <button
            type="button"
            className="oa-report-card oa-report-card--hero"
            onClick={() => setActive(activeMeta.id)}
          >
            <AdminIcon3d icon={IReports} size={44} iconSize={20} />
            <div className="oa-report-card-body">
              <span className="oa-report-card-badge">Основной отчёт</span>
              <div className="oa-report-card-title">{activeMeta.label}</div>
              <div className="oa-report-card-sub">{activeMeta.sub}</div>
            </div>
          </button>
          <div className="oa-reports-picker-row">
            {secondaryReports.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActive(r.id)}
                className="oa-report-card oa-report-card--compact"
              >
                <AdminIcon3d icon={IReports} size={32} iconSize={15} />
                <div className="oa-report-card-title">{r.label}</div>
                <div className="oa-report-card-sub">{r.sub}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading || !dashboard || !analytics ? (
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
