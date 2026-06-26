import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import { requireClinicId } from "@/lib/clinic-context";
import { assertAdminApiSession } from "@/lib/admin-api-guard";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";
import { createClinicNotification } from "@/lib/notifications-db";
import { uiStatusToDb, mapBookingToAppointment } from "@/lib/admin/mappers";
import { parseBookingPatch } from "@/lib/admin/validators/booking";
import type { AppointmentStatus } from "@/lib/admin/types";

export const dynamic = "force-dynamic";

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
  const search = (searchParams.get("search") ?? "").trim().toLowerCase();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20));

  let dbStatus: BookingStatus | null = null;
  if (statusParam && statusParam !== "ALL") {
    const uiStatus = statusParam as AppointmentStatus;
    if (["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(uiStatus)) {
      dbStatus = uiStatusToDb(uiStatus);
    } else if (ALLOWED_STATUS.has(statusParam as BookingStatus)) {
      dbStatus = statusParam as BookingStatus;
    }
  }

  try {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().slice(0, 10);
    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().slice(0, 10);

    const where = {
      clinicId,
      ...(dbStatus ? { status: dbStatus } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search } },
              { service: { nameRu: { contains: search, mode: "insensitive" as const } } },
              { doctor: { nameRu: { contains: search, mode: "insensitive" as const } } },
              {
                patient: {
                  OR: [
                    { firstName: { contains: search, mode: "insensitive" as const } },
                    { lastName: { contains: search, mode: "insensitive" as const } },
                    { phone: { contains: search } },
                    { email: { contains: search, mode: "insensitive" as const } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const [bookings, total, statsToday, statsWeek, statsMonth, statsYear] =
      await Promise.all([
        prisma.booking.findMany({
          where,
          orderBy: [{ date: "desc" }, { timeSlot: "desc" }],
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            service: { select: { nameRu: true, price: true } },
            doctor: { select: { nameRu: true } },
            patient: {
              select: { id: true, firstName: true, lastName: true, phone: true },
            },
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
      bookings: bookings.map(mapBookingToAppointment),
      pagination: { total, page, pages: Math.ceil(total / pageSize), pageSize },
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
  }

  const parsed = parseBookingPatch(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { id, rejectionReason } = parsed.data;
  let status: BookingStatus | undefined;
  if (["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(parsed.data.status as string)) {
    status = uiStatusToDb(parsed.data.status as AppointmentStatus);
  } else if (ALLOWED_STATUS.has(parsed.data.status as BookingStatus)) {
    status = parsed.data.status as BookingStatus;
  }

  if (!id || !status) {
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
        service: { select: { nameRu: true, price: true } },
        doctor: { select: { nameRu: true } },
        patient: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
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

    try {
      const patientLabel = `${booking.firstName} ${booking.lastName}`.trim();
      if (status === "REJECTED") {
        await createClinicNotification({
          clinicId,
          type: "cancel",
          title: "Запись отменена",
          message: `${patientLabel} · ${booking.service.nameRu}`,
        });
      } else if (status === "ACCEPTED" && current.status === "PENDING") {
        await createClinicNotification({
          clinicId,
          type: "booking",
          title: "Запись подтверждена",
          message: `${patientLabel} · ${booking.service.nameRu}`,
        });
      } else if (status === "COMPLETED") {
        await createClinicNotification({
          clinicId,
          type: "booking",
          title: "Приём завершён",
          message: `${patientLabel} · ${booking.service.nameRu}`,
        });
      }
    } catch (notifyErr) {
      console.error("[admin/bookings PATCH] notification failed:", notifyErr);
    }

    return NextResponse.json({
      booking: mapBookingToAppointment(booking),
    });
  } catch {
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}
