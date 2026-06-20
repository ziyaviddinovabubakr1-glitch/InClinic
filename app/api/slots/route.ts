import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { allowMockFallback } from "@/lib/env";
import { getDefaultClinicId, parseDateOnly, isBeyondHorizon } from "@/lib/booking-rules";
import { getClientIp } from "@/lib/auth-guard";
import { MOCK_DOCTORS } from "@/lib/mockData";
import { buildSlotTimeline } from "@/lib/slot-availability";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit("slots", ip, RATE_LIMITS.slots.limit, RATE_LIMITS.slots.windowMs);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Слишком много запросов" }, { status: 429 });
  }

  const { searchParams } = request.nextUrl;
  const doctorId = searchParams.get("doctorId");
  const date = searchParams.get("date");

  if (!doctorId || !date) {
    return NextResponse.json({ error: "Требуются параметры doctorId и date" }, { status: 400 });
  }

  if (!parseDateOnly(date)) {
    return NextResponse.json({ error: "Неверный формат даты" }, { status: 400 });
  }

  if (isBeyondHorizon(date)) {
    return NextResponse.json({ error: "Дата вне допустимого диапазона" }, { status: 400 });
  }

  try {
    const clinicId = await getDefaultClinicId();
    const doctor = await prisma.doctor.findFirst({
      where: { id: doctorId, clinicId, active: true },
      select: { workDays: true, workStart: true, workEnd: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Врач не найден" }, { status: 404 });
    }

    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
    if (!doctor.workDays.includes(dayOfWeek)) {
      return NextResponse.json({ slots: [], timeline: [] });
    }

    const booked = await prisma.booking.findMany({
      where: { clinicId, doctorId, date, status: { in: ["PENDING", "ACCEPTED"] } },
      select: { timeSlot: true },
    });
    const bookedSet = new Set(booked.map((b) => b.timeSlot));
    const { timeline, available } = buildSlotTimeline(
      date,
      doctor.workStart,
      doctor.workEnd,
      bookedSet
    );

    return NextResponse.json({ slots: available, timeline });
  } catch {
    if (!allowMockFallback()) {
      return NextResponse.json({ error: "Ошибка загрузки слотов" }, { status: 503 });
    }
    const mockDoc = MOCK_DOCTORS.find((d) => d.id === doctorId);
    if (!mockDoc) {
      return NextResponse.json({ error: "Врач не найден" }, { status: 404 });
    }
    const dow = new Date(`${date}T12:00:00`).getDay();
    if (!mockDoc.workDays.includes(dow)) {
      return NextResponse.json({ slots: [], timeline: [] });
    }
    const { timeline, available } = buildSlotTimeline(
      date,
      mockDoc.workStart,
      mockDoc.workEnd,
      new Set()
    );
    return NextResponse.json({ slots: available, timeline });
  }
}
