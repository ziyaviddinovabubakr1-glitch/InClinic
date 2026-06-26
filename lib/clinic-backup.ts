import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const BACKUP_VERSION = 1;

export interface ClinicBackupPayload {
  version: number;
  createdAt: string;
  clinicId: string;
  clinic: { name: string; slug: string };
  services: Prisma.ServiceGetPayload<object>[];
  doctors: (Prisma.DoctorGetPayload<object> & { serviceIds: string[] })[];
  patients: Prisma.PatientGetPayload<object>[];
  bookings: Prisma.BookingGetPayload<object>[];
  reviews: Prisma.ReviewGetPayload<object>[];
}

export async function buildClinicBackup(clinicId: string): Promise<ClinicBackupPayload> {
  const [clinic, services, doctors, patients, bookings, reviews] = await Promise.all([
    prisma.clinic.findUniqueOrThrow({ where: { id: clinicId }, select: { id: true, name: true, slug: true } }),
    prisma.service.findMany({ where: { clinicId } }),
    prisma.doctor.findMany({ where: { clinicId }, include: { services: { select: { serviceId: true } } } }),
    prisma.patient.findMany({ where: { clinicId, deletedAt: null } }),
    prisma.booking.findMany({ where: { clinicId } }),
    prisma.review.findMany({ where: { clinicId } }),
  ]);

  return {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    clinicId: clinic.id,
    clinic: { name: clinic.name, slug: clinic.slug },
    services,
    doctors: doctors.map(({ services: links, ...doctor }) => ({
      ...doctor,
      serviceIds: links.map((l) => l.serviceId),
    })),
    patients,
    bookings,
    reviews,
  };
}

function isBackupPayload(value: unknown): value is ClinicBackupPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as ClinicBackupPayload;
  return (
    v.version === BACKUP_VERSION &&
    typeof v.clinicId === "string" &&
    Array.isArray(v.services) &&
    Array.isArray(v.doctors) &&
    Array.isArray(v.patients) &&
    Array.isArray(v.bookings) &&
    Array.isArray(v.reviews)
  );
}

export async function restoreClinicBackup(
  clinicId: string,
  raw: unknown,
): Promise<{ services: number; doctors: number; patients: number; bookings: number; reviews: number }> {
  if (!isBackupPayload(raw)) {
    throw new Error("Неверный формат файла резервной копии");
  }
  if (raw.clinicId !== clinicId) {
    throw new Error("Копия принадлежит другой клинике");
  }

  let counts = { services: 0, doctors: 0, patients: 0, bookings: 0, reviews: 0 };

  await prisma.$transaction(async (tx) => {
    for (const s of raw.services) {
      const { id, clinicId: _c, createdAt, updatedAt, ...data } = s;
      await tx.service.upsert({
        where: { id },
        create: { ...data, id, clinicId },
        update: data,
      });
      counts.services += 1;
    }

    for (const d of raw.doctors) {
      const { id, clinicId: _c, createdAt, updatedAt, serviceIds, ...data } = d;
      await tx.doctor.upsert({
        where: { id },
        create: { ...data, id, clinicId },
        update: data,
      });
      await tx.doctorService.deleteMany({ where: { doctorId: id } });
      if (serviceIds.length) {
        await tx.doctorService.createMany({
          data: serviceIds.map((serviceId) => ({ doctorId: id, serviceId })),
          skipDuplicates: true,
        });
      }
      counts.doctors += 1;
    }

    for (const p of raw.patients) {
      const { id, clinicId: _c, createdAt, updatedAt, ...data } = p;
      await tx.patient.upsert({
        where: { id },
        create: { ...data, id, clinicId },
        update: data,
      });
      counts.patients += 1;
    }

    for (const b of raw.bookings) {
      const { id, clinicId: _c, createdAt, updatedAt, ...data } = b;
      await tx.booking.upsert({
        where: { id },
        create: { ...data, id, clinicId },
        update: data,
      });
      counts.bookings += 1;
    }

    for (const r of raw.reviews) {
      const { id, clinicId: _c, createdAt, updatedAt, ...data } = r;
      await tx.review.upsert({
        where: { id },
        create: { ...data, id, clinicId },
        update: data,
      });
      counts.reviews += 1;
    }
  });

  return counts;
}

export function backupSummary(payload: ClinicBackupPayload) {
  return {
    createdAt: payload.createdAt,
    clinicName: payload.clinic.name,
    counts: {
      services: payload.services.length,
      doctors: payload.doctors.length,
      patients: payload.patients.length,
      bookings: payload.bookings.length,
      reviews: payload.reviews.length,
    },
  };
}
