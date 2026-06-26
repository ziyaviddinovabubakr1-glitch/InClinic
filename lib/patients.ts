import type { BookingStatus, Gender, Patient, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPhone } from "@/lib/booking-rules";
import type { PatientSegment } from "@/lib/admin/types";

export type PatientWithBookings = Patient & {
  bookings: Array<{
    id: string;
    status: BookingStatus;
    date: string;
    updatedAt: Date;
    service: { price: number | null };
  }>;
};

export function patientFullName(p: { firstName: string; lastName: string }): string {
  return `${p.firstName} ${p.lastName}`.trim();
}

export function calcAge(birthDate: Date | null | undefined): number | null {
  if (!birthDate) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age >= 0 ? age : null;
}

export interface PatientBookingStats {
  visitsCount: number;
  appointmentsCount: number;
  totalPaid: number;
  lastVisitAt: Date | null;
  segment: PatientSegment;
}

export function computePatientStats(
  bookings: Array<{
    status: BookingStatus;
    date: string;
    service: { price: number | null };
  }>,
): PatientBookingStats {
  const appointmentsCount = bookings.length;
  const completed = bookings.filter((b) => b.status === "COMPLETED");
  const visitsCount = completed.length;
  const totalPaid = completed.reduce((s, b) => s + (b.service.price ?? 0), 0);

  let lastVisitAt: Date | null = null;
  for (const b of bookings) {
    const d = new Date(`${b.date}T12:00:00`);
    if (!lastVisitAt || d > lastVisitAt) lastVisitAt = d;
  }

  const daysSinceVisit = lastVisitAt
    ? Math.floor((Date.now() - lastVisitAt.getTime()) / 86_400_000)
    : 999;

  let segment: PatientSegment = "NEW";
  if (daysSinceVisit > 180) segment = "INACTIVE";
  else if (totalPaid >= 5000 || visitsCount >= 8) segment = "VIP";
  else if (visitsCount >= 2) segment = "REGULAR";

  return { visitsCount, appointmentsCount, totalPaid, lastVisitAt, segment };
}

export async function findOrCreatePatient(input: {
  clinicId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
}): Promise<Patient> {
  const phone = input.phone.trim();
  const phoneHash = hashPhone(phone);
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  const existing = await prisma.patient.findUnique({
    where: { clinicId_phoneHash: { clinicId: input.clinicId, phoneHash } },
  });

  if (existing) {
    const updates: Prisma.PatientUpdateInput = {};
    if (existing.deletedAt) updates.deletedAt = null;
    if (firstName && firstName !== existing.firstName) updates.firstName = firstName;
    if (lastName && lastName !== existing.lastName) updates.lastName = lastName;
    if (input.email && input.email !== existing.email) updates.email = input.email;
    if (Object.keys(updates).length > 0) {
      return prisma.patient.update({ where: { id: existing.id }, data: updates });
    }
    return existing;
  }

  return prisma.patient.create({
    data: {
      clinicId: input.clinicId,
      firstName,
      lastName,
      phone,
      phoneHash,
      email: input.email?.trim() || null,
    },
  });
}

/** Link orphan bookings to Patient records (idempotent). */
export async function backfillPatientsFromBookings(clinicId: string): Promise<number> {
  const orphans = await prisma.booking.findMany({
    where: { clinicId, patientId: null },
    orderBy: { createdAt: "asc" },
  });

  let linked = 0;
  for (const b of orphans) {
    const patient = await findOrCreatePatient({
      clinicId,
      firstName: b.firstName,
      lastName: b.lastName,
      phone: b.phone,
    });
    await prisma.booking.update({
      where: { id: b.id },
      data: { patientId: patient.id },
    });
    linked++;
  }
  return linked;
}

export function parseGender(value: unknown): Gender | null {
  if (value === null || value === undefined || value === "") return null;
  const v = String(value).toUpperCase();
  if (v === "MALE" || v === "FEMALE" || v === "OTHER" || v === "UNKNOWN") return v;
  return null;
}

export function parseBirthDate(value: unknown): Date | null {
  if (!value || typeof value !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}
