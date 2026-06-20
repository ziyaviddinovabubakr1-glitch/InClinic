import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { allowMockFallback } from "@/lib/env";
import { getDefaultClinicId, parseDateOnly, isBeyondHorizon } from "@/lib/booking-rules";
import { getClientIp } from "@/lib/auth-guard";
import { MOCK_DOCTORS } from "@/lib/mockData";
import { buildWeekDays, getMondayOfWeek } from "@/lib/slot-availability";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit("slots-week", ip, RATE_LIMITS.slots.limit, RATE_LIMITS.slots.windowMs);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Слишком много запросов" }, { status: 429 });
  }

  const { searchParams } = request.nextUrl;
  const doctorId = searchParams.get("doctorId");
  const weekStartParam = searchParams.get("weekStart");

  if (!doctorId) {
    return NextResponse.json({ error: "Требуется doctorId" }, { status: 400 });
  }

  const weekStart = weekStartParam && parseDateOnly(weekStartParam)
    ? getMondayOfWeek(weekStartParam)
    : getMondayOfWeek();

  if (isBeyondHorizon(weekStart)) {
    return NextResponse.json({ error: "Неделя вне диапазона" }, { status: 400 });
  }

  const weekEnd = (() => {
    const d = new Date(`${weekStart}T12:00:00`);
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  })();

  try {
    const clinicId = await getDefaultClinicId();
    const doctor = await prisma.doctor.findFirst({
      where: { id: doctorId, clinicId, active: true },
      select: { workDays: true, workStart: true, workEnd: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Врач не найден" }, { status: 404 });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        clinicId,
        doctorId,
        date: { gte: weekStart, lte: weekEnd },
        status: { in: ["PENDING", "ACCEPTED"] },
      },
      select: { date: true, timeSlot: true },
    });

    const byDate = new Map<string, Set<string>>();
    for (const b of bookings) {
      if (!byDate.has(b.date)) byDate.set(b.date, new Set());
      byDate.get(b.date)!.add(b.timeSlot);
    }

    const days = buildWeekDays(
      weekStart,
      doctor.workDays,
      doctor.workStart,
      doctor.workEnd,
      byDate,
      ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
    );

    return NextResponse.json({ weekStart, days });
  } catch {
    if (!allowMockFallback()) {
      return NextResponse.json({ error: "Ошибка загрузки" }, { status: 503 });
    }
    const mockDoc = MOCK_DOCTORS.find((d) => d.id === doctorId);
    if (!mockDoc) {
      return NextResponse.json({ error: "Врач не найден" }, { status: 404 });
    }
    const days = buildWeekDays(
      weekStart,
      mockDoc.workDays,
      mockDoc.workStart,
      mockDoc.workEnd,
      new Map(),
      ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
    );
    return NextResponse.json({ weekStart, days });
  }
}
