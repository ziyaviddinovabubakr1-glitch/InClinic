import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClinicId } from "@/lib/clinic-context";
import { assertAdminApiSession } from "@/lib/admin-api-guard";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  "patient.create": "Создан пациент",
  "patient.update": "Обновлён пациент",
  "patient.delete": "Удалён пациент",
  "patient.soft_delete": "Пациент скрыт",
  "booking.create": "Создана запись",
  "booking.update": "Изменена запись",
  "doctor.create": "Добавлен врач",
  "doctor.update": "Обновлён врач",
  "doctor.delete": "Удалён врач",
  "review.create": "Новый отзыв",
  "review.approve": "Отзыв одобрен",
  "review.reject": "Отзыв отклонён",
  "review.delete": "Отзыв удалён",
  "review.update": "Отзыв обновлён",
};

function summarize(action: string, entity: string, entityId: string | null): string {
  const label = ACTION_LABEL[action] ?? action;
  return entityId ? `${label} · ${entity} #${entityId.slice(0, 8)}` : label;
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
  const { searchParams } = request.nextUrl;
  const search = (searchParams.get("search") ?? "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20));

  try {
    const where = {
      clinicId,
      ...(search
        ? {
            OR: [
              { action: { contains: search, mode: "insensitive" as const } },
              { entity: { contains: search, mode: "insensitive" as const } },
              { entityId: { contains: search } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { username: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      rows: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        username: r.user?.username ?? null,
        action: r.action,
        entity: r.entity,
        entityId: r.entityId,
        createdAt: r.createdAt.toISOString(),
        summary: summarize(r.action, r.entity, r.entityId),
      })),
      total,
      page,
      pageSize,
    });
  } catch (err) {
    console.error("[admin/activity GET]", err);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}
