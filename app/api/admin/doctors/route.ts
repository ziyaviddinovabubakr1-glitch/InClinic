import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClinicId } from "@/lib/clinic-context";
import { assertAdminApiSession } from "@/lib/admin-api-guard";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";
import { loadDoctorReviewStats } from "@/lib/reviews";

function validateDoctor(body: Record<string, unknown>) {
  const errors: string[] = [];
  if (typeof body.nameRu !== "string" || body.nameRu.length < 2) errors.push("nameRu обязателен");
  if (typeof body.nameTj !== "string" || body.nameTj.length < 2) errors.push("nameTj обязателен");
  if (typeof body.specialtyRu !== "string" || body.specialtyRu.length < 2) errors.push("specialtyRu обязателен");
  if (typeof body.specialtyTj !== "string" || body.specialtyTj.length < 2) errors.push("specialtyTj обязателен");
  if (!Array.isArray(body.workDays) || !(body.workDays as unknown[]).every((d) => typeof d === "number" && d >= 0 && d <= 6))
    errors.push("workDays должен быть массивом чисел 0–6");
  if (typeof body.workStart !== "string" || !/^\d{2}:\d{2}$/.test(body.workStart))
    errors.push("Неверный workStart (HH:MM)");
  if (typeof body.workEnd !== "string" || !/^\d{2}:\d{2}$/.test(body.workEnd))
    errors.push("Неверный workEnd (HH:MM)");
  return errors;
}

function isAllowedPhotoUrl(url: string | null): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
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
    const [doctors, reviewStats] = await Promise.all([
      prisma.doctor.findMany({
        where: { clinicId },
        orderBy: { nameRu: "asc" },
        include: {
          services: { include: { service: { select: { id: true, nameRu: true } } } },
          _count: { select: { bookings: true } },
        },
      }),
      loadDoctorReviewStats(clinicId),
    ]);

    return NextResponse.json({
      doctors: doctors.map((d) => ({
        ...d,
        averageRating: reviewStats.get(d.id)?.averageRating ?? 0,
        reviewCount: reviewStats.get(d.id)?.reviewCount ?? 0,
      })),
    });
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
  const userId = request.headers.get("x-user-id");
  const ip = getClientIp(request);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
  }

  const errors = validateDoctor(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0] }, { status: 422 });
  }

  const photoUrl = typeof body.photoUrl === "string" ? body.photoUrl : null;
  if (!isAllowedPhotoUrl(photoUrl)) {
    return NextResponse.json({ error: "photoUrl должен быть https URL" }, { status: 422 });
  }

  const serviceIds = Array.isArray(body.serviceIds) ? (body.serviceIds as string[]) : [];

  if (serviceIds.length) {
    const count = await prisma.service.count({
      where: { id: { in: serviceIds }, clinicId, active: true },
    });
    if (count !== serviceIds.length) {
      return NextResponse.json({ error: "Некорректные serviceIds" }, { status: 422 });
    }
  }

  try {
    const doctor = await prisma.doctor.create({
      data: {
        clinicId,
        nameRu: body.nameRu as string,
        nameTj: body.nameTj as string,
        specialtyRu: body.specialtyRu as string,
        specialtyTj: body.specialtyTj as string,
        photoUrl,
        workDays: body.workDays as number[],
        workStart: body.workStart as string,
        workEnd: body.workEnd as string,
        active: body.active !== false,
        services: serviceIds.length
          ? { create: serviceIds.map((serviceId) => ({ serviceId })) }
          : undefined,
      },
    });

    await writeAudit({
      userId,
      clinicId,
      action: "doctor.create",
      entity: "doctor",
      entityId: doctor.id,
      ip,
    });

    return NextResponse.json({ doctor }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ошибка создания врача" }, { status: 500 });
  }
}
