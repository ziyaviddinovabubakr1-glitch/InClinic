import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClinicId } from "@/lib/clinic-context";
import { assertAdminApiSession } from "@/lib/admin-api-guard";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/auth-guard";
import { parseNotificationBulkPatch } from "@/lib/admin/validators/notification";

export const dynamic = "force-dynamic";

function relTime(iso: Date): string {
  const diff = Date.now() - iso.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин назад`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч назад`;
  const days = Math.floor(hrs / 24);
  return `${days} дн назад`;
}

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
  const authUserId = request.headers.get("x-user-id");

  try {
    const rows = await prisma.notification.findMany({
      where: {
        clinicId,
        OR: [{ userId: null }, { userId: authUserId ?? undefined }],
      },
      orderBy: [{ read: "asc" }, { createdAt: "desc" }],
      take: 50,
    });

    return NextResponse.json({
      notifications: rows.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        time: relTime(n.createdAt),
      })),
    });
  } catch (err) {
    console.error("[admin/notifications GET]", err);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const sessionErr = await assertAdminApiSession(request);
  if (sessionErr) return sessionErr;

  const clinicId = await requireClinicId(request);
  const authUserId = request.headers.get("x-user-id");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
  }

  const parsed = parseNotificationBulkPatch(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 422 });
  }

  if (parsed.data.markAll) {
    await prisma.notification.updateMany({
      where: {
        clinicId,
        read: false,
        OR: [{ userId: null }, { userId: authUserId ?? undefined }],
      },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Нет действия" }, { status: 422 });
}
