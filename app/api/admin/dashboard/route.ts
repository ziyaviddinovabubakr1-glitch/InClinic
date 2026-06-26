import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClinicId } from "@/lib/clinic-context";
import { assertAdminApiSession } from "@/lib/admin-api-guard";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/auth-guard";
import {
  loadAllBookings,
  seriesByDay,
  todayStr,
  dateOffset,
  bookingRevenue,
} from "@/lib/admin/db/aggregations";
import { loadPatientDashboardStats } from "@/lib/admin/db/patient-stats";
import { mapBookingToAppointment } from "@/lib/admin/mappers";
import { mapDbReviewToUi } from "@/lib/admin/review-mappers";
import { loadClinicReviewStats } from "@/lib/reviews";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTHS = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

export async function GET(request: NextRequest) {
  const sessionErr = await assertAdminApiSession(request);
  if (sessionErr) return sessionErr;

  const ip = getClientIp(request);
  const userId = request.headers.get("x-user-id") ?? ip;
  const rl = await rateLimit("admin", userId, RATE_LIMITS.admin.limit, RATE_LIMITS.admin.windowMs);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const clinicId = await requireClinicId(request);
    const today = todayStr();
    const weekAgo = dateOffset(7);
    const monthAgo = dateOffset(30);

    const [bookings, doctors, services, patientStats, reviewStats, latestReviewRows] =
      await Promise.all([
      loadAllBookings(clinicId),
      prisma.doctor.findMany({
        where: { clinicId },
        include: { _count: { select: { bookings: true } } },
      }),
      prisma.service.findMany({
        where: { clinicId },
        include: { _count: { select: { bookings: true } } },
      }),
      loadPatientDashboardStats(clinicId, today, weekAgo),
      loadClinicReviewStats(clinicId),
      prisma.review.findMany({
        where: { clinicId },
        include: {
          patient: { select: { firstName: true, lastName: true } },
          doctor: { select: { nameRu: true } },
          booking: {
            select: {
              serviceId: true,
              service: { select: { nameRu: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const todays = bookings.filter((b) => b.date === today);
    const weekBookings = bookings.filter((b) => b.date >= weekAgo);
    const monthBookings = bookings.filter((b) => b.date >= monthAgo);
    const completed = bookings.filter((b) => b.status === "COMPLETED");
    const monthCompleted = monthBookings.filter((b) => b.status === "COMPLETED");

    const revenueToday = bookingRevenue(todays);
    const revenueWeek = bookingRevenue(weekBookings);
    const revenueMonth = bookingRevenue(monthBookings);

    const patientsToday = new Set(
      todays.map((b) => b.patientId ?? b.phoneHash).filter(Boolean),
    ).size;

    const kpis = {
      totalPatients: patientStats.totalPatients,
      newPatientsToday: patientStats.newPatientsToday,
      returningPatients: patientStats.returningPatients,
      patientsToday,
      appointmentsToday: todays.length,
      newPatients: patientStats.newPatientsWeek,
      cancelledAppointments: todays.filter((b) => b.status === "REJECTED").length,
      revenueToday,
      revenueWeek,
      revenueMonth,
      avgCheck: monthCompleted.length
        ? Math.round(revenueMonth / monthCompleted.length)
        : 0,
      clinicLoad: Math.min(100, Math.round((todays.length / 24) * 100)),
      averageClinicRating: reviewStats.averageRating,
      reviewsThisMonth: reviewStats.reviewsThisMonth,
      pendingReviews: reviewStats.pendingCount,
    };

    const totalLifetimeRevenue = bookingRevenue(completed);
    const totalLifetimePatients = patientStats.totalPatients;
    const cancelRate = bookings.length
      ? bookings.filter((b) => b.status === "REJECTED").length / bookings.length
      : 0;
    const completionRate = bookings.length ? completed.length / bookings.length : 0;

    const executive = {
      clinicHealthScore: Math.min(
        100,
        Math.round(completionRate * 50 + (1 - cancelRate) * 50),
      ),
      totalLifetimeRevenue,
      totalLifetimePatients,
      totalCompletedAppointments: completed.length,
      averageDoctorRating: reviewStats.averageRating,
    };

    const activeDoctors = doctors.filter((d) => d.active);
    const bestDoctor = [...activeDoctors].sort(
      (a, b) => b._count.bookings - a._count.bookings,
    )[0];
    const busiestDoctor = bestDoctor;
    const topService = [...services].sort(
      (a, b) => b._count.bookings - a._count.bookings,
    )[0];

    const dayCounts = new Array(7).fill(0);
    for (const b of bookings) {
      const d = new Date(`${b.date}T12:00:00`);
      dayCounts[d.getDay()]++;
    }
    const busiestDayIdx = dayCounts.indexOf(Math.max(...dayCounts, 0));

    const monthRevenue = new Map<string, number>();
    for (const b of completed) {
      const d = new Date(`${b.date}T12:00:00`);
      const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      monthRevenue.set(key, (monthRevenue.get(key) ?? 0) + (b.service.price ?? 0));
    }
    let bestMonth = { label: "—", value: 0 };
    monthRevenue.forEach((value, label) => {
      if (value > bestMonth.value) bestMonth = { label, value };
    });

    const overview = {
      bestDoctor: {
        id: bestDoctor?.id ?? "",
        name: bestDoctor?.nameRu ?? "—",
        metric: `${bestDoctor?._count.bookings ?? 0} приёмов`,
      },
      topService: {
        id: topService?.id ?? "",
        name: topService?.nameRu ?? "—",
        metric: `${topService?._count.bookings ?? 0} продаж`,
      },
      busiestDoctor: {
        id: busiestDoctor?.id ?? "",
        name: busiestDoctor?.nameRu ?? "—",
        metric: `${busiestDoctor?._count.bookings ?? 0} приёмов`,
      },
      busiestDay: {
        label: WEEKDAYS[busiestDayIdx] ?? "—",
        metric: `${dayCounts[busiestDayIdx] ?? 0} записей`,
      },
      mostProfitableMonth: {
        label: bestMonth.label,
        metric: `${bestMonth.value.toLocaleString("ru-RU")} c.`,
      },
      clinicRating: reviewStats.averageRating,
      topRatedDoctor: reviewStats.topRatedDoctor ?? {
        id: "",
        name: "—",
        rating: 0,
        reviews: 0,
      },
    };

    const recentAppointments = bookings
      .slice(0, 6)
      .map(mapBookingToAppointment);

    return NextResponse.json({
      kpis,
      executive,
      overview,
      revenueSeries: seriesByDay(bookings, 14, "revenue"),
      appointmentsSeries: seriesByDay(bookings, 14, "count"),
      recentAppointments,
      latestReviews: latestReviewRows.map(mapDbReviewToUi),
    });
  } catch (err) {
    console.error("[admin/dashboard]", err);
    return NextResponse.json({ error: "Ошибка загрузки дашборда" }, { status: 500 });
  }
}
