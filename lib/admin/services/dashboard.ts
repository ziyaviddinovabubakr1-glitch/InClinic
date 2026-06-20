import type {
  DashboardData,
  DashboardKpis,
  ExecutiveKpis,
  SmartOverview,
  TimeSeriesPoint,
} from "@/lib/admin/types";
import { getDataset } from "@/lib/admin/mock/dataset";
import { clone, delay, NOW } from "./util";

const WEEKDAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTHS = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

function todayStr(): string {
  const p = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${NOW.getFullYear()}-${p(NOW.getMonth() + 1)}-${p(NOW.getDate())}`;
}

function computeKpis(): DashboardKpis {
  const { appointments, patients } = getDataset();
  const today = todayStr();
  const todays = appointments.filter((a) => a.date === today);

  const weekAgo = new Date(NOW);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(NOW);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const completed = appointments.filter((a) => a.status === "COMPLETED" && a.completedAt);
  const revenueIn = (since: Date) =>
    completed
      .filter((a) => new Date(a.completedAt as string) >= since)
      .reduce((s, a) => s + a.price, 0);

  const revenueToday = completed
    .filter((a) => a.date === today)
    .reduce((s, a) => s + a.price, 0);
  const revenueMonth = revenueIn(monthAgo);
  const monthCompleted = completed.filter(
    (a) => new Date(a.completedAt as string) >= monthAgo,
  ).length;

  const newPatients = patients.filter((p) => {
    const reg = new Date(p.registeredAt);
    return reg >= weekAgo;
  }).length;

  return {
    patientsToday: new Set(todays.map((a) => a.patientId)).size,
    appointmentsToday: todays.length,
    newPatients,
    cancelledAppointments: appointments.filter(
      (a) => a.status === "CANCELLED" && a.date === today,
    ).length,
    revenueToday,
    revenueWeek: revenueIn(weekAgo),
    revenueMonth,
    avgCheck: monthCompleted ? Math.round(revenueMonth / monthCompleted) : 0,
    clinicLoad: Math.min(100, Math.round((todays.length / 24) * 100)),
  };
}

function computeExecutive(): ExecutiveKpis {
  const { appointments, patients, doctors } = getDataset();
  const completed = appointments.filter((a) => a.status === "COMPLETED");
  const totalLifetimeRevenue = completed.reduce((s, a) => s + a.price, 0);
  const activeDoctors = doctors.filter((d) => d.status === "ACTIVE");
  const averageDoctorRating = activeDoctors.length
    ? Math.round(
        (activeDoctors.reduce((s, d) => s + d.rating, 0) / activeDoctors.length) * 10,
      ) / 10
    : 0;

  // Composite health score: rating (40%), completion rate (35%), load (25%)
  const completionRate = appointments.length
    ? completed.length / appointments.length
    : 0;
  const cancelled = appointments.filter((a) => a.status === "CANCELLED").length;
  const cancelRate = appointments.length ? cancelled / appointments.length : 0;
  const healthScore = Math.round(
    (averageDoctorRating / 5) * 40 +
      completionRate * 35 +
      (1 - cancelRate) * 25,
  );

  return {
    clinicHealthScore: Math.min(100, healthScore),
    totalLifetimeRevenue,
    totalLifetimePatients: patients.length,
    totalCompletedAppointments: completed.length,
    averageDoctorRating,
  };
}

function computeOverview(): SmartOverview {
  const { doctors, services, appointments } = getDataset();
  const active = doctors.filter((d) => d.status === "ACTIVE");

  const bestDoctor = [...active].sort((a, b) => b.rating - a.rating)[0];
  const busiestDoctor = [...active].sort(
    (a, b) => b.appointmentsCount - a.appointmentsCount,
  )[0];
  const topService = [...services].sort((a, b) => b.revenue - a.revenue)[0];

  // Busiest weekday
  const dayCounts = new Array(7).fill(0);
  for (const a of appointments) {
    const d = new Date(`${a.date}T00:00:00`);
    dayCounts[d.getDay()]++;
  }
  const busiestDayIdx = dayCounts.indexOf(Math.max(...dayCounts));

  // Most profitable month
  const monthRevenue = new Map<string, number>();
  for (const a of appointments) {
    if (a.status !== "COMPLETED") continue;
    const d = new Date(`${a.date}T00:00:00`);
    const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    monthRevenue.set(key, (monthRevenue.get(key) ?? 0) + a.price);
  }
  let bestMonth = { label: "—", value: 0 };
  monthRevenue.forEach((value, label) => {
    if (value > bestMonth.value) bestMonth = { label, value };
  });

  const clinicRating = active.length
    ? Math.round((active.reduce((s, d) => s + d.rating, 0) / active.length) * 10) / 10
    : 0;

  return {
    bestDoctor: {
      id: bestDoctor.id,
      name: bestDoctor.fullName,
      metric: `${bestDoctor.rating.toFixed(1)} ★`,
    },
    topService: {
      id: topService.id,
      name: topService.name,
      metric: `${topService.revenue.toLocaleString("ru-RU")} c.`,
    },
    busiestDoctor: {
      id: busiestDoctor.id,
      name: busiestDoctor.fullName,
      metric: `${busiestDoctor.appointmentsCount} приёмов`,
    },
    busiestDay: {
      label: WEEKDAYS[busiestDayIdx],
      metric: `${dayCounts[busiestDayIdx]} записей`,
    },
    mostProfitableMonth: {
      label: bestMonth.label,
      metric: `${bestMonth.value.toLocaleString("ru-RU")} c.`,
    },
    clinicRating,
  };
}

function revenueSeries(days = 14): TimeSeriesPoint[] {
  const { appointments } = getDataset();
  const points: TimeSeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(NOW);
    d.setDate(d.getDate() - i);
    const p = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const key = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    const value = appointments
      .filter((a) => a.date === key && a.status === "COMPLETED")
      .reduce((s, a) => s + a.price, 0);
    points.push({ label: `${d.getDate()} ${MONTHS[d.getMonth()]}`, value });
  }
  return points;
}

function appointmentsSeries(days = 14): TimeSeriesPoint[] {
  const { appointments } = getDataset();
  const points: TimeSeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(NOW);
    d.setDate(d.getDate() - i);
    const p = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const key = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    points.push({
      label: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
      value: appointments.filter((a) => a.date === key).length,
    });
  }
  return points;
}

export function getDashboardData(): Promise<DashboardData> {
  const { appointments, reviews } = getDataset();

  const recentAppointments = [...appointments]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 6);

  const latestReviews = [...reviews]
    .filter((r) => r.visibility !== "HIDDEN")
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  return delay(
    clone({
      kpis: computeKpis(),
      executive: computeExecutive(),
      overview: computeOverview(),
      revenueSeries: revenueSeries(),
      appointmentsSeries: appointmentsSeries(),
      recentAppointments,
      latestReviews,
    }),
  );
}
