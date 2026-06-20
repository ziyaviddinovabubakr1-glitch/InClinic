import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import { requireClinicId } from "@/lib/clinic-context";
import { assertAdminApiSession } from "@/lib/admin-api-guard";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";

const ALLOWED_STATUS = new Set<BookingStatus>([
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "COMPLETED",
]);

const STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["COMPLETED", "REJECTED"],
  REJECTED: [],
  COMPLETED: [],
};

export async function GET(request: NextRequest) {
  const sessionErr = await assertAdminApiSession(request);
  if (sessionErr) return sessionErr;

  const ip = getClientIp(request);
  const userId = request.headers.get("x-user-id") ?? ip;
  const rl = await rateLimit("admin", userId, RATE_LIMITS.admin.limit, RATE_LIMITS.admin.windowMs);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const clinicId = await requireClinicId(request);
  const { searchParams } = request.nextUrl;
  const statusParam = searchParams.get("status");
  const status =
    statusParam && ALLOWED_STATUS.has(statusParam as BookingStatus)
      ? (statusParam as BookingStatus)
      : null;
  const page = Math.max(1, Math.min(1000, parseInt(searchParams.get("page") ?? "1", 10) || 1));
  const limit = 20;

  try {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().slice(0, 10);
    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().slice(0, 10);

    const where = { clinicId, ...(status ? { status } : {}) };

    const [bookings, total, statsToday, statsWeek, statsMonth, statsYear] =
      await Promise.all([
        prisma.booking.findMany({
          where,
          orderBy: [{ date: "desc" }, { timeSlot: "desc" }],
          skip: (page - 1) * limit,
          take: limit,
          include: {
            service: { select: { nameRu: true, price: true } },
            doctor: { select: { nameRu: true } },
          },
        }),
        prisma.booking.count({ where }),
        prisma.booking.count({ where: { clinicId, date: today } }),
        prisma.booking.count({ where: { clinicId, date: { gte: weekAgo } } }),
        prisma.booking.count({ where: { clinicId, date: { gte: monthAgo } } }),
        prisma.booking.count({ where: { clinicId, date: { gte: yearAgo } } }),
      ]);

    const revenueQuery = async (fromDate: string) => {
      const rows = await prisma.booking.findMany({
        where: { clinicId, status: "COMPLETED", date: { gte: fromDate } },
        include: { service: { select: { price: true } } },
        take: 5000,
      });
      return rows.reduce((sum, b) => sum + (b.service.price ?? 0), 0);
    };

    const [revDay, revWeek, revMonth, revYear] = await Promise.all([
      revenueQuery(today),
      revenueQuery(weekAgo),
      revenueQuery(monthAgo),
      revenueQuery(yearAgo),
    ]);

    return NextResponse.json({
      bookings,
      pagination: { total, page, pages: Math.ceil(total / limit) },
      stats: {
        bookings: { today: statsToday, week: statsWeek, month: statsMonth, year: statsYear },
        revenue: { day: revDay, week: revWeek, month: revMonth, year: revYear },
      },
    });
  } catch {
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const sessionErr = await assertAdminApiSession(request);
  if (sessionErr) return sessionErr;

  const ip = getClientIp(request);
  const authUserId = request.headers.get("x-user-id") ?? ip;
  const rl = await rateLimit("admin", authUserId, RATE_LIMITS.admin.limit, RATE_LIMITS.admin.windowMs);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const clinicId = await requireClinicId(request);

  let body: { id?: string; status?: BookingStatus; rejectionReason?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
  }

  const { id, status, rejectionReason } = body;
  if (!id || !status || !ALLOWED_STATUS.has(status)) {
    return NextResponse.json({ error: "Требуются id и корректный status" }, { status: 400 });
  }

  try {
    const current = await prisma.booking.findFirst({
      where: { id, clinicId },
    });
    if (!current) {
      return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
    }

    const allowed = STATUS_TRANSITIONS[current.status];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Нельзя изменить статус ${current.status} → ${status}` },
        { status: 422 }
      );
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status,
        ...(rejectionReason ? { rejectionReason: rejectionReason.slice(0, 500) } : {}),
      },
      include: {
        service: { select: { nameRu: true } },
        doctor: { select: { nameRu: true } },
      },
    });

    await writeAudit({
      userId: authUserId,
      clinicId,
      action: "booking.update",
      entity: "booking",
      entityId: id,
      ip,
      metadata: { status, from: current.status },
    });

    return NextResponse.json({ booking });
  } catch {
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}
