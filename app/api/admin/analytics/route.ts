import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClinicId } from "@/lib/clinic-context";
import { assertAdminApiSession } from "@/lib/admin-api-guard";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/auth-guard";
import {
  loadClinicBookings,
  presetFromDate,
  presetSpan,
  bucketSeries,
} from "@/lib/admin/db/aggregations";
import {
  activePatientWhere,
  loadPatientRegistrationsByDay,
} from "@/lib/admin/db/patient-stats";

export const dynamic = "force-dynamic";

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
    const preset = request.nextUrl.searchParams.get("preset") ?? "month";
    const fromDate = presetFromDate(preset);
    const span = presetSpan(preset);

    const [bookings, doctors, services, patientRegs, allPatients] = await Promise.all([
      loadClinicBookings(clinicId, fromDate),
      prisma.doctor.findMany({
        where: { clinicId, active: true },
        include: { _count: { select: { bookings: true } } },
      }),
      prisma.service.findMany({
        where: { clinicId },
        include: { _count: { select: { bookings: true } } },
      }),
      loadPatientRegistrationsByDay(clinicId, fromDate),
      prisma.patient.findMany({
        where: activePatientWhere(clinicId),
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const revenue = bucketSeries(bookings, span, (key) =>
      bookings
        .filter((b) => b.date === key && b.status === "COMPLETED")
        .reduce((s, b) => s + (b.service.price ?? 0), 0),
    );

    const appointments = bucketSeries(bookings, span, (key) =>
      bookings.filter((b) => b.date === key).length,
    );

    const patients = bucketSeries(bookings, span, (key) => patientRegs.get(key) ?? 0);

    const repeatVisits = bucketSeries(bookings, span, (key) => {
      const dayAppts = bookings.filter(
        (b) => b.date === key && b.status === "COMPLETED" && b.patientId,
      );
      let count = 0;
      for (const a of dayAppts) {
        const earlier = bookings.some(
          (o) =>
            o.patientId === a.patientId &&
            o.status === "COMPLETED" &&
            o.date < a.date,
        );
        if (earlier) count++;
      }
      return count;
    });

    const doctorLoad = doctors
      .map((d) => ({
        label: d.nameRu.split(" ")[0],
        value: d._count.bookings,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const servicePopularity = services
      .map((s) => ({ label: s.nameRu, value: s._count.bookings }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const clinicGrowth: { label: string; value: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const cumulative = allPatients.filter((p) => p.createdAt <= end).length;
      clinicGrowth.push({ label: MONTHS[d.getMonth()], value: cumulative });
    }

    return NextResponse.json({
      revenue,
      patients,
      appointments,
      repeatVisits,
      doctorLoad,
      servicePopularity,
      clinicGrowth,
    });
  } catch (err) {
    console.error("[admin/analytics]", err);
    return NextResponse.json({ error: "Ошибка загрузки аналитики" }, { status: 500 });
  }
}
