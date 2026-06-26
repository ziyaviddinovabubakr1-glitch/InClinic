import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClinicId } from "@/lib/clinic-context";
import { assertAdminApiSession } from "@/lib/admin-api-guard";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/auth-guard";
import { writeAudit } from "@/lib/audit";
import { hashPhone } from "@/lib/booking-rules";
import { parseBirthDate, parseGender } from "@/lib/patients";
import {
  mapDbPatientProfile,
  mapDbPatientToUi,
} from "@/lib/admin/patient-mappers";
import { mapDbReviewToUi } from "@/lib/admin/review-mappers";
import { validatePatientUpdate } from "@/lib/admin/validators/patient";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

async function adminRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const userId = request.headers.get("x-user-id") ?? ip;
  const rl = await rateLimit("admin", userId, RATE_LIMITS.admin.limit, RATE_LIMITS.admin.windowMs);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  return null;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const sessionErr = await assertAdminApiSession(request);
  if (sessionErr) return sessionErr;

  const limited = await adminRateLimit(request);
  if (limited) return limited;

  try {
    const clinicId = await requireClinicId(request);
    const patient = await prisma.patient.findFirst({
      where: { id: params.id, clinicId, deletedAt: null },
      include: {
        bookings: {
          orderBy: [{ date: "desc" }, { timeSlot: "desc" }],
          include: {
            service: { select: { nameRu: true, price: true } },
            doctor: { select: { nameRu: true } },
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          include: {
            patient: { select: { firstName: true, lastName: true } },
            doctor: { select: { nameRu: true } },
            booking: {
              select: {
                serviceId: true,
                service: { select: { nameRu: true } },
              },
            },
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Пациент не найден" }, { status: 404 });
    }

    const { reviews, ...patientData } = patient;
    return NextResponse.json({
      profile: mapDbPatientProfile(
        patientData,
        reviews.length,
        reviews.map(mapDbReviewToUi),
      ),
    });
  } catch (err) {
    console.error("[admin/patients/[id] GET]", err);
    return NextResponse.json({ error: "Ошибка загрузки пациента" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
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

  const errors = validatePatientUpdate(body);
  if (errors.length) {
    return NextResponse.json({ error: errors[0] }, { status: 422 });
  }

  try {
    const existing = await prisma.patient.findFirst({
      where: { id: params.id, clinicId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Пациент не найден" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (typeof body.firstName === "string") data.firstName = body.firstName.trim();
    if (typeof body.lastName === "string") data.lastName = body.lastName.trim();
    if (typeof body.phone === "string") {
      data.phone = body.phone.trim();
      data.phoneHash = hashPhone(body.phone);
    }
    if (body.email !== undefined) {
      data.email = typeof body.email === "string" ? body.email.trim() || null : null;
    }
    if (body.birthDate !== undefined) data.birthDate = parseBirthDate(body.birthDate);
    if (body.gender !== undefined) data.gender = parseGender(body.gender);
    if (body.address !== undefined) {
      data.address = typeof body.address === "string" ? body.address.trim() || null : null;
    }
    if (body.notes !== undefined) {
      data.notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
    }

    if (data.phoneHash && data.phoneHash !== existing.phoneHash) {
      const dup = await prisma.patient.findUnique({
        where: {
          clinicId_phoneHash: {
            clinicId,
            phoneHash: data.phoneHash as string,
          },
        },
      });
      if (dup && dup.id !== existing.id) {
        return NextResponse.json({ error: "Телефон уже используется другим пациентом" }, { status: 409 });
      }
    }

    const patient = await prisma.patient.update({
      where: { id: params.id },
      data,
      include: {
        bookings: {
          select: {
            id: true,
            status: true,
            date: true,
            updatedAt: true,
            service: { select: { price: true } },
          },
        },
      },
    });

    await writeAudit({
      userId,
      clinicId,
      action: "patient.update",
      entity: "patient",
      entityId: patient.id,
      ip,
      oldData: {
        firstName: existing.firstName,
        lastName: existing.lastName,
        phone: existing.phone,
        email: existing.email,
      },
      newData: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        phone: patient.phone,
        email: patient.email,
      },
    });

    return NextResponse.json({ patient: mapDbPatientToUi(patient) });
  } catch (err) {
    console.error("[admin/patients/[id] PATCH]", err);
    return NextResponse.json({ error: "Ошибка обновления пациента" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const sessionErr = await assertAdminApiSession(request);
  if (sessionErr) return sessionErr;

  const limited = await adminRateLimit(request);
  if (limited) return limited;

  const clinicId = await requireClinicId(request);
  const userId = request.headers.get("x-user-id");
  const ip = getClientIp(request);

  try {
    const existing = await prisma.patient.findFirst({
      where: { id: params.id, clinicId, deletedAt: null },
      include: {
        bookings: {
          select: { id: true, status: true, date: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Пациент не найден" }, { status: 404 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const activeFuture = existing.bookings.filter(
      (b) =>
        (b.status === "PENDING" || b.status === "ACCEPTED") &&
        b.date >= today,
    );

    if (activeFuture.length > 0) {
      return NextResponse.json(
        { error: "Нельзя удалить пациента с активными записями. Отмените или завершите их." },
        { status: 422 },
      );
    }

    const hasHistory = existing.bookings.length > 0;

    if (hasHistory) {
      await prisma.patient.update({
        where: { id: params.id },
        data: { deletedAt: new Date() },
      });

      await writeAudit({
        userId,
        clinicId,
        action: "patient.soft_delete",
        entity: "patient",
        entityId: params.id,
        ip,
        oldData: {
          firstName: existing.firstName,
          lastName: existing.lastName,
          phone: existing.phone,
        },
      });

      return NextResponse.json({ success: true, softDeleted: true });
    }

    await prisma.patient.delete({ where: { id: params.id } });

    await writeAudit({
      userId,
      clinicId,
      action: "patient.delete",
      entity: "patient",
      entityId: params.id,
      ip,
      oldData: {
        firstName: existing.firstName,
        lastName: existing.lastName,
        phone: existing.phone,
      },
    });

    return NextResponse.json({ success: true, softDeleted: false });
  } catch (err) {
    console.error("[admin/patients/[id] DELETE]", err);
    return NextResponse.json({ error: "Ошибка удаления пациента" }, { status: 500 });
  }
}
