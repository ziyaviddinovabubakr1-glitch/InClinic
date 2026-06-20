import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClinicId } from "@/lib/clinic-context";
import { assertAdminApiSession } from "@/lib/admin-api-guard";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";

function isAllowedPhotoUrl(url: string | null): boolean {
  if (!url) return true;
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

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
  const existing = await prisma.doctor.findFirst({
    where: { id: params.id, clinicId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Врач не найден" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
  }

  const serviceIds = body.serviceIds as string[] | undefined;
  if (serviceIds?.length) {
    const count = await prisma.service.count({
      where: { id: { in: serviceIds }, clinicId, active: true },
    });
    if (count !== serviceIds.length) {
      return NextResponse.json({ error: "Некорректные serviceIds" }, { status: 422 });
    }
  }

  if (body.photoUrl !== undefined) {
    const url = typeof body.photoUrl === "string" ? body.photoUrl : null;
    if (!isAllowedPhotoUrl(url)) {
      return NextResponse.json({ error: "photoUrl должен быть https URL" }, { status: 422 });
    }
  }

  const { serviceIds: _sid, ...data } = body;
  void _sid;

  try {
    const doctor = await prisma.doctor.update({
      where: { id: params.id },
      data: {
        ...(typeof data.nameRu === "string" ? { nameRu: data.nameRu } : {}),
        ...(typeof data.nameTj === "string" ? { nameTj: data.nameTj } : {}),
        ...(typeof data.specialtyRu === "string" ? { specialtyRu: data.specialtyRu } : {}),
        ...(typeof data.specialtyTj === "string" ? { specialtyTj: data.specialtyTj } : {}),
        ...(data.photoUrl !== undefined
          ? { photoUrl: typeof data.photoUrl === "string" ? data.photoUrl : null }
          : {}),
        ...(Array.isArray(data.workDays) ? { workDays: data.workDays as number[] } : {}),
        ...(typeof data.workStart === "string" ? { workStart: data.workStart } : {}),
        ...(typeof data.workEnd === "string" ? { workEnd: data.workEnd } : {}),
        ...(typeof data.active === "boolean" ? { active: data.active } : {}),
        ...(serviceIds !== undefined
          ? {
              services: {
                deleteMany: {},
                create: serviceIds.map((serviceId) => ({ serviceId })),
              },
            }
          : {}),
      },
    });

    await writeAudit({
      userId: request.headers.get("x-user-id"),
      clinicId,
      action: "doctor.update",
      entity: "doctor",
      entityId: params.id,
      ip,
    });

    return NextResponse.json({ doctor });
  } catch {
    return NextResponse.json({ error: "Ошибка обновления врача" }, { status: 500 });
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
  const existing = await prisma.doctor.findFirst({
    where: { id: params.id, clinicId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Врач не найден" }, { status: 404 });
  }

  try {
    await prisma.doctor.delete({ where: { id: params.id } });
    await writeAudit({
      userId: request.headers.get("x-user-id"),
      clinicId,
      action: "doctor.delete",
      entity: "doctor",
      entityId: params.id,
      ip,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ошибка удаления врача" }, { status: 500 });
  }
}
