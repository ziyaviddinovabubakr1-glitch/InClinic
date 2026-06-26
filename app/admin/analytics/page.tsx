"use client";

import { useEffect, useState } from "react";
import { getAnalytics, money } from "@/lib/admin/services";
import type { AnalyticsData } from "@/lib/admin/services";
import type { DateRangePreset } from "@/lib/admin/types";
import { AreaChart, BarChart } from "@/components/admin/charts";
import { SkeletonCard } from "@/components/admin/ui";
import { MotionPage, StaggerItem } from "@/components/admin/motion";
import PageHeader from "@/components/admin/PageHeader";
import SegmentedControl from "@/components/admin/SegmentedControl";

const PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: "today", label: "Сегодня" },
  { id: "week", label: "Неделя" },
  { id: "month", label: "Месяц" },
  { id: "quarter", label: "Квартал" },
  { id: "year", label: "Год" },
];

function sumValues(data: { value: number }[]) {
  return data.reduce((s, p) => s + p.value, 0);
}

export default function AnalyticsPage() {
  const [preset, setPreset] = useState<DateRangePreset>("month");
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    setData(null);
    getAnalytics({ preset }).then(setData);
  }, [preset]);

  const revenueTotal = data ? sumValues(data.revenue) : 0;
  const apptTotal = data ? sumValues(data.appointments) : 0;
  const patientTotal = data ? sumValues(data.patients) : 0;
  const repeatTotal = data ? sumValues(data.repeatVisits) : 0;

  return (
    <MotionPage className="oa-analytics-v3">
      <PageHeader
        title="Аналитика"
        sub="Доход, записи и рост базы пациентов"
        action={
          <SegmentedControl options={PRESETS} value={preset} onChange={setPreset} />
        }
      />

      {!data ? (
        <div className="oa-analytics-v3-grid">
          <div className="oa-analytics-v3-summary">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} height={48} />)}
          </div>
          <div className="oa-analytics-v3-charts">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} height={120} />)}
          </div>
        </div>
      ) : (
        <>
          <div className="oa-analytics-v3-summary">
            <Metric label="Доход" value={money(revenueTotal)} tone="green" />
            <Metric label="Записи" value={String(apptTotal)} />
            <Metric label="Пациенты" value={String(patientTotal)} />
            <Metric label="Повторные" value={String(repeatTotal)} />
          </div>

          <div className="oa-analytics-v3-charts">
            <StaggerItem>
              <ChartPanel title="Доход" meta="за период">
                <AreaChart data={data.revenue} color="#30a46c" height={72} />
              </ChartPanel>
            </StaggerItem>
            <StaggerItem>
              <ChartPanel title="Записи" meta={`${apptTotal} всего`}>
                <BarChart data={data.appointments} height={72} />
              </ChartPanel>
            </StaggerItem>
            <StaggerItem>
              <ChartPanel title="Пациенты" meta="уникальные">
                <AreaChart data={data.patients} color="#5e6ad2" height={72} />
              </ChartPanel>
            </StaggerItem>
            <StaggerItem>
              <ChartPanel title="Повторные" meta="визиты">
                <AreaChart data={data.repeatVisits} color="#8b5cf6" height={72} />
              </ChartPanel>
            </StaggerItem>
          </div>

          <div className="oa-analytics-v3-row">
            <StaggerItem>
              <ChartPanel title="Загрузка врачей" meta="приёмы">
                <BarChart data={data.doctorLoad} horizontal height={64} />
              </ChartPanel>
            </StaggerItem>
            <StaggerItem>
              <ChartPanel title="Популярность услуг" meta="продажи">
                <BarChart data={data.servicePopularity} horizontal height={64} />
              </ChartPanel>
            </StaggerItem>
          </div>

          <StaggerItem>
            <ChartPanel title="Рост клиники" meta="12 месяцев">
              <AreaChart data={data.clinicGrowth} color="#5e6ad2" height={80} />
            </ChartPanel>
          </StaggerItem>
        </>
      )}
    </MotionPage>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="oa-metric-pill">
      <div className="oa-metric-pill-label">{label}</div>
      <div className={`oa-metric-pill-value${tone ? ` oa-metric-pill-value--${tone}` : ""}`}>{value}</div>
    </div>
  );
}

function ChartPanel({ title, meta, children }: { title: string; meta?: string; children: React.ReactNode }) {
  return (
    <div className="oa-panel oa-panel-chart">
      <div className="oa-panel-head">
        <span className="oa-panel-title">{title}</span>
        {meta && <span className="oa-panel-meta">{meta}</span>}
      </div>
      {children}
    </div>
  );
}
