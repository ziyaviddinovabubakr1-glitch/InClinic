"use client";

import { useEffect, useState } from "react";
import { getAnalytics, money } from "@/lib/admin/services";
import type { AnalyticsData } from "@/lib/admin/services";
import type { DateRangePreset } from "@/lib/admin/types";
import { AreaChart, BarChart } from "@/components/admin/charts";
import { SectionHeader, SkeletonCard } from "@/components/admin/ui";
import { MotionPage, MotionGrid, MotionItem } from "@/components/admin/motion";

const PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: "today", label: "Сегодня" },
  { id: "week", label: "Неделя" },
  { id: "month", label: "Месяц" },
  { id: "quarter", label: "Квартал" },
  { id: "year", label: "Год" },
];

export default function AnalyticsPage() {
  const [preset, setPreset] = useState<DateRangePreset>("month");
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    setData(null);
    getAnalytics({ preset }).then(setData);
  }, [preset]);

  return (
    <MotionPage style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div className="oa-chips">
        {PRESETS.map((p) => (
          <button key={p.id} className={`oa-chip ${preset === p.id ? "oa-chip-active" : ""}`} onClick={() => setPreset(p.id)}>{p.label}</button>
        ))}
      </div>

      {!data ? (
        <div className="oa-grid-charts">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} height={280} />)}
        </div>
      ) : (
        <>
          <MotionGrid className="oa-grid-charts">
            <MotionItem>
              <ChartCard title="Доход" sub={`Итого: ${money(data.revenue.reduce((s, p) => s + p.value, 0))}`}>
                <AreaChart data={data.revenue} color="#22c55e" />
              </ChartCard>
            </MotionItem>
            <MotionItem>
              <ChartCard title="Записи" sub={`Всего: ${data.appointments.reduce((s, p) => s + p.value, 0)}`}>
                <BarChart data={data.appointments} />
              </ChartCard>
            </MotionItem>
            <MotionItem>
              <ChartCard title="Пациенты" sub="Уникальные за период">
                <AreaChart data={data.patients} color="#3b82f6" />
              </ChartCard>
            </MotionItem>
            <MotionItem>
              <ChartCard title="Повторные посещения" sub="Возвращающиеся пациенты">
                <AreaChart data={data.repeatVisits} color="#8b5cf6" />
              </ChartCard>
            </MotionItem>
          </MotionGrid>

          <MotionGrid className="oa-grid-charts">
            <MotionItem>
              <ChartCard title="Загрузка врачей" sub="По количеству приёмов">
                <BarChart data={data.doctorLoad} horizontal />
              </ChartCard>
            </MotionItem>
            <MotionItem>
              <ChartCard title="Популярность услуг" sub="По числу продаж">
                <BarChart data={data.servicePopularity} horizontal />
              </ChartCard>
            </MotionItem>
          </MotionGrid>

          <MotionItem>
            <ChartCard title="Рост клиники" sub="Накопительная база пациентов за 12 месяцев">
              <AreaChart data={data.clinicGrowth} color="#60a5fa" height={240} />
            </ChartCard>
          </MotionItem>
        </>
      )}
    </MotionPage>
  );
}

function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="oa-chart-card oa-card-hover" style={{ minWidth: 0, overflow: "hidden" }}>
      <SectionHeader title={title} sub={sub} />
      <div style={{ minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>{children}</div>
    </div>
  );
}
