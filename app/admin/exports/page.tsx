"use client";

import { useState } from "react";
import { exportData, EXPORT_CATEGORIES, EXPORT_FORMATS } from "@/lib/admin/services";
import type { ExportCategory, ExportFormat } from "@/lib/admin/services";
import { SectionHeader } from "@/components/admin/ui";
import { MotionPage } from "@/components/admin/motion";
import { IExports, IPatients, IDoctors, IAppointments, IReviews, IMoney, IServices } from "@/components/admin/icons";

const CATEGORY_META: Record<ExportCategory, { label: string; icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element; tone: string }> = {
  patients: { label: "Пациенты", icon: IPatients, tone: "violet" },
  doctors: { label: "Врачи", icon: IDoctors, tone: "blue" },
  appointments: { label: "Записи", icon: IAppointments, tone: "sky" },
  reviews: { label: "Отзывы", icon: IReviews, tone: "amber" },
  revenue: { label: "Доходы", icon: IMoney, tone: "green" },
  services: { label: "Услуги", icon: IServices, tone: "blue" },
};

export default function ExportsPage() {
  const [category, setCategory] = useState<ExportCategory>("patients");
  const [format, setFormat] = useState<ExportFormat>("CSV");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMessage(null);
    const result = await exportData({ category, format });
    setBusy(false);

    if (result.pending) {
      setMessage(`Формат ${format} будет доступен в следующем релизе. Архитектура экспорта уже готова.`);
      return;
    }
    // Working CSV download
    const blob = new Blob([`\uFEFF${result.content}`], { type: result.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
    setMessage(`Файл ${result.filename} выгружен.`);
  }

  return (
    <MotionPage style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 820, margin: "0 auto", width: "100%" }}>
      <div className="oa-card oa-card-pad">
        <SectionHeader title="Категория данных" sub="Выберите, что нужно выгрузить" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
          {EXPORT_CATEGORIES.map((c) => {
            const meta = CATEGORY_META[c];
            const Icon = meta.icon;
            const active = category === c;
            return (
              <button key={c} onClick={() => setCategory(c)}
                className="oa-card oa-card-hover"
                style={{ padding: 16, textAlign: "left", borderColor: active ? "var(--oa-accent)" : undefined, boxShadow: active ? "0 0 0 3px rgba(37,99,235,0.12)" : undefined, cursor: "pointer", background: "var(--oa-surface)" }}>
                <div className={`oa-kpi-icon oa-tone-${meta.tone}`} style={{ margin: 0, width: 34, height: 34 }}><Icon style={{ width: 17, height: 17 }} /></div>
                <div style={{ fontWeight: 700, fontSize: 14, marginTop: 10 }}>{meta.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="oa-card oa-card-pad">
        <SectionHeader title="Формат" sub="CSV доступен сейчас · XLSX и PDF — скоро" />
        <div className="oa-chips">
          {EXPORT_FORMATS.map((f) => (
            <button key={f} className={`oa-chip ${format === f ? "oa-chip-active" : ""}`} onClick={() => setFormat(f)}>
              {f}{f !== "CSV" ? " · скоро" : ""}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 20, flexWrap: "wrap" }}>
          <button className="oa-btn oa-btn-primary" onClick={run} disabled={busy}>
            <IExports style={{ width: 16, height: 16 }} />
            {busy ? "Подготовка..." : `Выгрузить ${CATEGORY_META[category].label.toLowerCase()}`}
          </button>
          {message && <span style={{ fontSize: 13, color: "var(--oa-text-soft)" }}>{message}</span>}
        </div>
      </div>
    </MotionPage>
  );
}
