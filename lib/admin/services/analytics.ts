import type {
  CategoryPoint,
  DateRangePreset,
  TimeSeriesPoint,
} from "@/lib/admin/types";
import { getDataset } from "@/lib/admin/mock/dataset";
import { clone, delay, NOW } from "./util";

const MONTHS = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

export interface AnalyticsRange {
  preset: DateRangePreset;
  from?: string; // ISO date for custom
  to?: string;
}

function presetDays(preset: DateRangePreset): number {
  switch (preset) {
    case "today": return 1;
    case "week": return 7;
    case "month": return 30;
    case "quarter": return 90;
    case "year": return 365;
    default: return 30;
  }
}

function bucketLabel(d: Date, span: number): string {
  if (span <= 31) return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return `${MONTHS[d.getMonth()]}`;
}

function dailySeries(
  span: number,
  reducer: (dateKey: string) => number,
): TimeSeriesPoint[] {
  const pts: TimeSeriesPoint[] = [];
  const step = span <= 31 ? 1 : Math.ceil(span / 12);
  for (let i = span - 1; i >= 0; i -= step) {
    const d = new Date(NOW);
    d.setDate(d.getDate() - i);
    const p = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const key = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    pts.push({ label: bucketLabel(d, span), value: reducer(key) });
  }
  return pts;
}

export interface AnalyticsData {
  revenue: TimeSeriesPoint[];
  patients: TimeSeriesPoint[];
  appointments: TimeSeriesPoint[];
  repeatVisits: TimeSeriesPoint[];
  doctorLoad: CategoryPoint[];
  servicePopularity: CategoryPoint[];
  clinicGrowth: TimeSeriesPoint[];
}

export function getAnalytics(range: AnalyticsRange): Promise<AnalyticsData> {
  const { appointments, doctors, services, patients } = getDataset();
  const span = presetDays(range.preset);

  const revenue = dailySeries(span, (key) =>
    appointments
      .filter((a) => a.date === key && a.status === "COMPLETED")
      .reduce((s, a) => s + a.price, 0),
  );

  const appts = dailySeries(span, (key) =>
    appointments.filter((a) => a.date === key).length,
  );

  const pat = dailySeries(span, (key) => {
    const ids = new Set(
      appointments.filter((a) => a.date === key).map((a) => a.patientId),
    );
    return ids.size;
  });

  // Repeat visits: completed appts whose patient had an earlier completed appt
  const repeatVisits = dailySeries(span, (key) => {
    const dayAppts = appointments.filter(
      (a) => a.date === key && a.status === "COMPLETED",
    );
    let count = 0;
    for (const a of dayAppts) {
      const earlier = appointments.some(
        (o) =>
          o.patientId === a.patientId &&
          o.status === "COMPLETED" &&
          o.date < a.date,
      );
      if (earlier) count++;
    }
    return count;
  });

  const doctorLoad: CategoryPoint[] = doctors
    .filter((d) => d.status === "ACTIVE")
    .map((d) => ({ label: d.fullName.split(" ")[0], value: d.appointmentsCount }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const servicePopularity: CategoryPoint[] = services
    .map((s) => ({ label: s.name, value: s.salesCount }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Clinic growth: cumulative registered patients over 12 months
  const clinicGrowth: TimeSeriesPoint[] = [];
  let cumulative = 0;
  for (let i = 11; i >= 0; i--) {
    const d = new Date(NOW.getFullYear(), NOW.getMonth() - i, 1);
    const before = patients.filter((p) => {
      const reg = new Date(p.registeredAt);
      return reg <= new Date(d.getFullYear(), d.getMonth() + 1, 0);
    }).length;
    cumulative = before;
    clinicGrowth.push({ label: MONTHS[d.getMonth()], value: cumulative });
  }

  return delay(
    clone({
      revenue,
      patients: pat,
      appointments: appts,
      repeatVisits,
      doctorLoad,
      servicePopularity,
      clinicGrowth,
    }),
  );
}
