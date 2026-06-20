import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClinicId } from "@/lib/clinic-context";
import { assertAdminApiSession } from "@/lib/admin-api-guard";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionErr = await assertAdminApiSession(request);
  if (sessionErr) return sessionErr;

  const ip = getClientIp(request);
  const userId = request.headers.get("x-user-id") ?? ip;
  const rl = await rateLimit("admin", userId, RATE_LIMITS.admin.limit, RATE_LIMITS.admin.windowMs);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const clinicId = await requireClinicId(request);
  const existing = await prisma.service.findFirst({
    where: { id: params.id, clinicId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (typeof body.nameRu === "string") updateData.nameRu = body.nameRu;
  if (typeof body.nameTj === "string") updateData.nameTj = body.nameTj;
  if (typeof body.descriptionRu === "string") updateData.descriptionRu = body.descriptionRu;
  if (typeof body.descriptionTj === "string") updateData.descriptionTj = body.descriptionTj;
  if (typeof body.durationMin === "number") updateData.durationMin = body.durationMin;
  if (body.price !== undefined) updateData.price = typeof body.price === "number" ? body.price : null;
  if (body.iconName !== undefined) updateData.iconName = typeof body.iconName === "string" ? body.iconName : null;
  if (body.indicationsRu !== undefined) updateData.indicationsRu = typeof body.indicationsRu === "string" ? body.indicationsRu : null;
  if (body.advantagesRu !== undefined) updateData.advantagesRu = typeof body.advantagesRu === "string" ? body.advantagesRu : null;
  if (body.preparationRu !== undefined) updateData.preparationRu = typeof body.preparationRu === "string" ? body.preparationRu : null;
  if (typeof body.active === "boolean") updateData.active = body.active;

  try {
    const service = await prisma.service.update({
      where: { id: params.id },
      data: updateData,
    });

    await writeAudit({
      userId: request.headers.get("x-user-id"),
      clinicId,
      action: "service.update",
      entity: "service",
      entityId: params.id,
      ip,
    });

    return NextResponse.json({ service });
  } catch {
    return NextResponse.json({ error: "Ошибка обновления услуги" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionErr = await assertAdminApiSession(request);
  if (sessionErr) return sessionErr;

  const ip = getClientIp(request);
  const userId = request.headers.get("x-user-id") ?? ip;
  const rl = await rateLimit("admin", userId, RATE_LIMITS.admin.limit, RATE_LIMITS.admin.windowMs);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const clinicId = await requireClinicId(request);
  const existing = await prisma.service.findFirst({
    where: { id: params.id, clinicId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });
  }

  try {
    await prisma.service.delete({ where: { id: params.id } });
    await writeAudit({
      userId: request.headers.get("x-user-id"),
      clinicId,
      action: "service.delete",
      entity: "service",
      entityId: params.id,
      ip,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ошибка удаления услуги" }, { status: 500 });
  }
}
