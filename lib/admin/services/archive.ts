/**
 * Archive — derived from completed bookings in PostgreSQL.
 */
import type { Appointment, PaymentRecord, Review } from "@/lib/admin/types";
import { adminFetch } from "@/lib/admin/api-client";
import { listDoctors } from "./doctors";

export interface ArchiveSummary {
  completedAppointments: number;
  historicalPatients: number;
  revenueRecords: number;
  totalArchivedRevenue: number;
  reviewsArchived: number;
  doctorPerformanceSnapshots: number;
  since: string | null;
}

export interface DoctorPerformanceSnapshot {
  doctorId: string;
  doctorName: string;
  completedAppointments: number;
  revenue: number;
  rating: number;
}

async function completedBookings(): Promise<Appointment[]> {
  const data = await adminFetch<{ bookings: Appointment[] }>(
    "/api/admin/bookings?status=COMPLETED&pageSize=500",
  );
  return data.bookings;
}

export async function getArchiveSummary(): Promise<ArchiveSummary> {
  const [completed, doctors] = await Promise.all([
    completedBookings(),
    listDoctors(),
  ]);

  const historicalPatients = new Set(completed.map((a) => a.patientId)).size;
  const totalArchivedRevenue = completed.reduce((s, a) => s + a.price, 0);
  const oldest = completed
    .map((a) => a.completedAt)
    .filter(Boolean)
    .sort()[0] as string | undefined;

  return {
    completedAppointments: completed.length,
    historicalPatients,
    revenueRecords: completed.length,
    totalArchivedRevenue,
    reviewsArchived: 0,
    doctorPerformanceSnapshots: doctors.length,
    since: oldest ?? null,
  };
}

export async function getArchivedAppointments(): Promise<Appointment[]> {
  const completed = await completedBookings();
  return completed.sort((a, b) =>
    (a.completedAt ?? "") < (b.completedAt ?? "") ? 1 : -1,
  );
}

export async function getRevenueHistory(): Promise<PaymentRecord[]> {
  const completed = await completedBookings();
  return completed
    .map((a) => ({
      id: `pay-${a.id}`,
      appointmentId: a.id,
      amount: a.price,
      date: a.completedAt ?? a.createdAt,
      serviceName: a.serviceName,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getReviewHistory(): Promise<Review[]> {
  return Promise.resolve([]);
}

export async function getDoctorPerformanceHistory(): Promise<DoctorPerformanceSnapshot[]> {
  const doctors = await listDoctors();
  return doctors.map((d) => ({
    doctorId: d.id,
    doctorName: d.fullName,
    completedAppointments: d.appointmentsCount,
    revenue: d.revenueGenerated,
    rating: d.rating,
  }));
}
