import { prisma } from "@/lib/prisma";
import type { DoctorAnalytics, TimeSeriesPoint } from "@/lib/admin/types";

const MONTHS = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

type BookingRow = {
  id: string;
  patientId: string | null;
  date: string;
  status: string;
  service: { price: number | null };
};

function seriesLastDays(
  bookings: BookingRow[],
  days: number,
  mode: "visits" | "revenue",
): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const day = bookings.filter((b) => b.date === key);
    const value =
      mode === "visits"
        ? day.length
        : day
            .filter((b) => b.status === "COMPLETED")
            .reduce((s, b) => s + (b.service.price ?? 0), 0);
    points.push({
      label: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
      value,
    });
  }
  return points;
}

function monthlyRevenue(completed: BookingRow[]): TimeSeriesPoint[] {
  const now = new Date();
  const points: TimeSeriesPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = completed
      .filter((b) => {
        const bd = new Date(`${b.date}T12:00:00`);
        return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
      })
      .reduce((s, b) => s + (b.service.price ?? 0), 0);
    points.push({ label: MONTHS[d.getMonth()], value });
  }
  return points;
}

function patientsGrowthSeries(bookings: BookingRow[]): TimeSeriesPoint[] {
  const now = new Date();
  const points: TimeSeriesPoint[] = [];

  for (let i = 5; i >= 0; i--) {
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const endKey = end.toISOString().slice(0, 10);
    const seen = new Set<string>();
    for (const b of bookings) {
      if (b.date <= endKey && b.patientId) seen.add(b.patientId);
    }
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    points.push({ label: MONTHS[monthDate.getMonth()], value: seen.size });
  }

  return points;
}

function estimateLoad(
  workDays: number[],
  workStart: string,
  workEnd: string,
  completedCount: number,
): number {
  const slotsPerDay = Math.max(1, Math.floor(
    (parseInt(workEnd.slice(0, 2), 10) - parseInt(workStart.slice(0, 2), 10)) * 2,
  ));
  const capacity = workDays.length * slotsPerDay * 26;
  return Math.min(100, Math.round((completedCount / Math.max(1, capacity)) * 100));
}

export interface DoctorAnalyticsPayload extends DoctorAnalytics {
  doctorName: string;
  doctorSpecialty: string;
  photoUrl: string | null;
}

export async function loadDoctorAnalytics(
  clinicId: string,
  doctorId: string,
): Promise<DoctorAnalyticsPayload | null> {
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, clinicId },
    select: {
      id: true,
      nameRu: true,
      specialtyRu: true,
      photoUrl: true,
      workDays: true,
      workStart: true,
      workEnd: true,
    },
  });

  if (!doctor) return null;

  const [bookings, reviewAgg] = await Promise.all([
    prisma.booking.findMany({
      where: { clinicId, doctorId },
      select: {
        id: true,
        patientId: true,
        date: true,
        status: true,
        service: { select: { price: true } },
      },
      orderBy: { date: "asc" },
    }),
    prisma.review.aggregate({
      where: { clinicId, doctorId, status: "APPROVED" },
      _avg: { rating: true },
      _count: { id: true },
    }),
  ]);

  const completed = bookings.filter((b) => b.status === "COMPLETED");
  const cancelled = bookings.filter((b) => b.status === "REJECTED");

  const revenue = completed.reduce((s, b) => s + (b.service.price ?? 0), 0);

  const byPatient = new Map<string, number>();
  for (const b of completed) {
    if (b.patientId) {
      byPatient.set(b.patientId, (byPatient.get(b.patientId) ?? 0) + 1);
    }
  }

  const uniquePatients = new Set(
    bookings.map((b) => b.patientId).filter(Boolean) as string[],
  );

  const repeatPatients = Array.from(byPatient.values()).filter((c) => c > 1).length;
  const rating = Math.round((reviewAgg._avg.rating ?? 0) * 10) / 10;
  const reviewCount = reviewAgg._count.id;

  return {
    doctorId: doctor.id,
    doctorName: doctor.nameRu,
    doctorSpecialty: doctor.specialtyRu,
    photoUrl: doctor.photoUrl,
    revenue,
    appointments: bookings.length,
    completedVisits: completed.length,
    cancelledVisits: cancelled.length,
    patients: uniquePatients.size,
    rating,
    reviewCount,
    repeatPatients,
    load: estimateLoad(doctor.workDays, doctor.workStart, doctor.workEnd, completed.length),
    performance: monthlyRevenue(completed),
    visitsSeries: seriesLastDays(bookings, 14, "visits"),
    revenueSeries: seriesLastDays(bookings, 14, "revenue"),
    patientsGrowth: patientsGrowthSeries(bookings),
  };
}

/** Lightweight summary for list views (no series). */
export async function loadDoctorAnalyticsSummary(
  clinicId: string,
  doctorId: string,
): Promise<Pick<
  DoctorAnalytics,
  "doctorId" | "revenue" | "appointments" | "patients" | "rating" | "completedVisits" | "cancelledVisits" | "reviewCount"
> | null> {
  const full = await loadDoctorAnalytics(clinicId, doctorId);
  if (!full) return null;
  return {
    doctorId: full.doctorId,
    revenue: full.revenue,
    appointments: full.appointments,
    patients: full.patients,
    rating: full.rating,
    completedVisits: full.completedVisits,
    cancelledVisits: full.cancelledVisits,
    reviewCount: full.reviewCount,
  };
}
