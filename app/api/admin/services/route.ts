import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClinicId } from "@/lib/clinic-context";
import { assertAdminApiSession } from "@/lib/admin-api-guard";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";

function validateService(body: Record<string, unknown>) {
  const errors: string[] = [];
  if (typeof body.nameRu !== "string" || body.nameRu.length < 2) errors.push("nameRu обязателен");
  if (typeof body.nameTj !== "string" || body.nameTj.length < 2) errors.push("nameTj обязателен");
  if (typeof body.descriptionRu !== "string" || body.descriptionRu.length < 10)
    errors.push("descriptionRu слишком короткий");
  if (typeof body.descriptionTj !== "string" || body.descriptionTj.length < 10)
    errors.push("descriptionTj слишком короткий");
  return errors;
}

async function adminRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const userId = request.headers.get("x-user-id") ?? ip;
  const rl = await rateLimit("admin", userId, RATE_LIMITS.admin.limit, RATE_LIMITS.admin.windowMs);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const sessionErr = await assertAdminApiSession(request);
  if (sessionErr) return sessionErr;

  const limited = await adminRateLimit(request);
  if (limited) return limited;

  const clinicId = await requireClinicId(request);

  try {
    const services = await prisma.service.findMany({
      where: { clinicId },
      orderBy: { nameRu: "asc" },
      include: { _count: { select: { bookings: true, doctors: true } } },
    });
    return NextResponse.json({ services });
  } catch {
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sessionErr = await assertAdminApiSession(request);
  if (sessionErr) return sessionErr;

  const limited = await adminRateLimit(request);
  if (limited) return limited;

  const clinicId = await requireClinicId(request);
  const ip = getClientIp(request);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
  }

  const errors = validateService(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0] }, { status: 422 });
  }

  try {
    const service = await prisma.service.create({
      data: {
        clinicId,
        nameRu: body.nameRu as string,
        nameTj: body.nameTj as string,
        descriptionRu: body.descriptionRu as string,
        descriptionTj: body.descriptionTj as string,
        durationMin: typeof body.durationMin === "number" ? body.durationMin : 30,
        price: typeof body.price === "number" ? body.price : null,
        iconName: typeof body.iconName === "string" ? body.iconName : null,
        indicationsRu: typeof body.indicationsRu === "string" ? body.indicationsRu : null,
        indicationsTj: typeof body.indicationsTj === "string" ? body.indicationsTj : null,
        advantagesRu: typeof body.advantagesRu === "string" ? body.advantagesRu : null,
        advantagesTj: typeof body.advantagesTj === "string" ? body.advantagesTj : null,
        preparationRu: typeof body.preparationRu === "string" ? body.preparationRu : null,
        preparationTj: typeof body.preparationTj === "string" ? body.preparationTj : null,
        active: body.active !== false,
      },
    });

    await writeAudit({
      userId: request.headers.get("x-user-id"),
      clinicId,
      action: "service.create",
      entity: "service",
      entityId: service.id,
      ip,
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ошибка создания услуги" }, { status: 500 });
  }
}
