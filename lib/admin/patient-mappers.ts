import type { Gender, Patient } from "@prisma/client";
import type { Patient as UiPatient, PatientGender, PatientProfile, PatientSegment, Review } from "@/lib/admin/types";
import { mapBookingToAppointment, type DbBookingRow } from "@/lib/admin/mappers";
import {
  calcAge,
  computePatientStats,
  patientFullName,
  type PatientWithBookings,
} from "@/lib/patients";

type ProfileBookingRow = DbBookingRow & {
  service: { nameRu: string; price: number | null };
  doctor: { nameRu: string };
};

export function mapGenderToUi(g: Gender | null | undefined): PatientGender | null {
  if (!g) return null;
  return g as PatientGender;
}

export function mapDbPatientToUi(
  p: PatientWithBookings,
  reviewsCount = 0,
): UiPatient {
  const stats = computePatientStats(p.bookings);
  return {
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    fullName: patientFullName(p),
    phone: p.phone,
    email: p.email ?? "",
    birthDate: p.birthDate?.toISOString().slice(0, 10) ?? null,
    gender: mapGenderToUi(p.gender),
    address: p.address ?? null,
    notes: p.notes ?? null,
    age: calcAge(p.birthDate),
    registeredAt: p.createdAt.toISOString(),
    lastVisitAt: stats.lastVisitAt?.toISOString() ?? null,
    segment: stats.segment,
    totalPaid: stats.totalPaid,
    visitsCount: stats.visitsCount,
    appointmentsCount: stats.appointmentsCount,
    reviewsCount,
  };
}

export function mapDbPatientProfile(
  p: Patient & { bookings: ProfileBookingRow[] },
  reviewsCount = 0,
  reviews: Review[] = [],
): PatientProfile {
  const base = mapDbPatientToUi(
    {
      ...p,
      bookings: p.bookings.map(({ id, status, date, updatedAt, service }) => ({
        id,
        status,
        date,
        updatedAt: new Date(updatedAt),
        service: { price: service.price },
      })),
    },
    reviewsCount,
  );
  const appointments = p.bookings.map(mapBookingToAppointment);
  const payments = p.bookings
    .filter((b) => b.status === "COMPLETED")
    .map((b) => ({
      id: `pay-${b.id}`,
      appointmentId: b.id,
      amount: b.service.price ?? 0,
      date: new Date(b.updatedAt).toISOString(),
      serviceName: b.service.nameRu,
    }));

  return {
    ...base,
    appointments,
    payments,
    reviews,
    upcomingAppointments: appointments.filter(
      (a) => a.status === "PENDING" || a.status === "CONFIRMED",
    ),
    pastAppointments: appointments.filter(
      (a) => a.status === "COMPLETED" || a.status === "CANCELLED",
    ),
  };
}

export function segmentCountsFromRows(rows: UiPatient[]): Record<PatientSegment, number> {
  const counts: Record<PatientSegment, number> = {
    NEW: 0,
    REGULAR: 0,
    VIP: 0,
    INACTIVE: 0,
  };
  for (const p of rows) counts[p.segment]++;
  return counts;
}
