import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireClinicId } from "@/lib/clinic-context";
import { assertAdminApiSession } from "@/lib/admin-api-guard";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";
import { createClinicNotification } from "@/lib/notifications-db";
import { hashPhone } from "@/lib/booking-rules";
import {
  parseBirthDate,
  parseGender,
} from "@/lib/patients";
import {
  mapDbPatientToUi,
  segmentCountsFromRows,
} from "@/lib/admin/patient-mappers";
import {
  validatePatientCreate,
} from "@/lib/admin/validators/patient";
import type { PatientSegment } from "@/lib/admin/types";

export const dynamic = "force-dynamic";

const BOOKING_STATS_SELECT = {
  bookings: {
    select: {
      id: true,
      status: true,
      date: true,
      updatedAt: true,
      service: { select: { price: true } },
    },
  },
} as const;

async function adminRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const userId = request.headers.get("x-user-id") ?? ip;
  const rl = await rateLimit("admin", userId, RATE_LIMITS.admin.limit, RATE_LIMITS.admin.windowMs);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  return null;
}

function buildWhere(
  clinicId: string,
  search: string,
  createdFrom: string | null,
  createdTo: string | null,
): Prisma.PatientWhereInput {
  const where: Prisma.PatientWhereInput = { clinicId, deletedAt: null };

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (createdFrom || createdTo) {
    where.createdAt = {};
    if (createdFrom) where.createdAt.gte = new Date(`${createdFrom}T00:00:00`);
    if (createdTo) where.createdAt.lte = new Date(`${createdTo}T23:59:59`);
  }

  return where;
}

export async function GET(request: NextRequest) {
  const sessionErr = await assertAdminApiSession(request);
  if (sessionErr) return sessionErr;

  const limited = await adminRateLimit(request);
  if (limited) return limited;

  const { searchParams } = request.nextUrl;
  const search = (searchParams.get("search") ?? "").trim();
  const segmentFilter = (searchParams.get("segment") ?? "ALL") as PatientSegment | "ALL";
  const createdFrom = searchParams.get("createdFrom");
  const createdTo = searchParams.get("createdTo");
  const sort = searchParams.get("sort") ?? "createdAt";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "12", 10) || 12));
  const countsOnly = searchParams.get("counts") === "1";

  try {
    const clinicId = await requireClinicId(request);
    const where = buildWhere(clinicId, search, createdFrom, createdTo);

    const orderBy: Prisma.PatientOrderByWithRelationInput =
      sort === "name"
        ? { lastName: "asc" }
        : { createdAt: "desc" };

    const patients = await prisma.patient.findMany({
      where,
      orderBy,
      include: BOOKING_STATS_SELECT,
    });

    let rows = patients.map((p) => mapDbPatientToUi(p));

    if (segmentFilter !== "ALL") {
      rows = rows.filter((p) => p.segment === segmentFilter);
    }

    if (sort === "totalPaid") {
      rows.sort((a, b) => b.totalPaid - a.totalPaid);
    } else if (sort === "name") {
      rows.sort((a, b) => a.fullName.localeCompare(b.fullName, "ru"));
    }

    if (countsOnly) {
      return NextResponse.json({ counts: segmentCountsFromRows(rows) });
    }

    const total = rows.length;
    const paged = rows.slice((page - 1) * pageSize, page * pageSize);

    return NextResponse.json({ rows: paged, total, page, pageSize });
  } catch (err) {
    console.error("[admin/patients GET]", err);
    return NextResponse.json({ error: "Ошибка загрузки пациентов" }, { status: 500 });
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

  const errors = validatePatientCreate(body);
  if (errors.length) {
    return NextResponse.json({ error: errors[0] }, { status: 422 });
  }

  const phone = (body.phone as string).trim();
  const phoneHash = hashPhone(phone);

  try {
    const duplicate = await prisma.patient.findUnique({
      where: { clinicId_phoneHash: { clinicId, phoneHash } },
    });
    if (duplicate && !duplicate.deletedAt) {
      return NextResponse.json(
        { error: "Пациент с таким телефоном уже существует", patientId: duplicate.id },
        { status: 409 },
      );
    }

    const patient = duplicate?.deletedAt
      ? await prisma.patient.update({
          where: { id: duplicate.id },
          data: {
            deletedAt: null,
            firstName: (body.firstName as string).trim(),
            lastName: (body.lastName as string).trim(),
            phone,
            email: typeof body.email === "string" ? body.email.trim() || null : null,
            birthDate: parseBirthDate(body.birthDate),
            gender: parseGender(body.gender),
            address: typeof body.address === "string" ? body.address.trim() || null : null,
            notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
          },
          include: BOOKING_STATS_SELECT,
        })
      : await prisma.patient.create({
      data: {
        clinicId,
        firstName: (body.firstName as string).trim(),
        lastName: (body.lastName as string).trim(),
        phone,
        phoneHash,
        email: typeof body.email === "string" ? body.email.trim() || null : null,
        birthDate: parseBirthDate(body.birthDate),
        gender: parseGender(body.gender),
        address: typeof body.address === "string" ? body.address.trim() || null : null,
        notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
      },
      include: BOOKING_STATS_SELECT,
    });

    await writeAudit({
      userId,
      clinicId,
      action: "patient.create",
      entity: "patient",
      entityId: patient.id,
      ip,
      newData: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        phone: patient.phone,
      },
    });

    try {
      await createClinicNotification({
        clinicId,
        type: "patient",
        title: "Новый пациент",
        message: `${patient.firstName} ${patient.lastName} · ${patient.phone}`,
      });
    } catch (notifyErr) {
      console.error("[admin/patients POST] notification failed:", notifyErr);
    }

    return NextResponse.json(
      { patient: mapDbPatientToUi(patient) },
      { status: 201 },
    );
  } catch (err) {
    console.error("[admin/patients POST]", err);
    return NextResponse.json({ error: "Ошибка создания пациента" }, { status: 500 });
  }
}
