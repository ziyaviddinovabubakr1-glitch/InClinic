/**
 * Archive Center architecture (V1 = service layer + read APIs; UI is a preview).
 *
 * Core rule: COMPLETED appointments and their derived history must NEVER be
 * permanently deleted. The archive is the immutable record of everything the
 * clinic has done — completed appointments, historical patients, revenue,
 * reviews and doctor performance — and stays available for analytics forever.
 *
 * In a real backend these would be append-only tables / materialised views.
 * Here we derive them from the same dataset so the shapes are production-ready.
 */
import type {
  Appointment,
  PaymentRecord,
  Review,
} from "@/lib/admin/types";
import { getDataset } from "@/lib/admin/mock/dataset";
import { clone, delay } from "./util";

export interface ArchiveSummary {
  completedAppointments: number;
  historicalPatients: number;
  revenueRecords: number;
  totalArchivedRevenue: number;
  reviewsArchived: number;
  doctorPerformanceSnapshots: number;
  /** Oldest record in the archive (ISO). */
  since: string | null;
}

export interface DoctorPerformanceSnapshot {
  doctorId: string;
  doctorName: string;
  completedAppointments: number;
  revenue: number;
  rating: number;
}

export function getArchiveSummary(): Promise<ArchiveSummary> {
  const { appointments, patients, payments, reviews, doctors } = getDataset();
  const completed = appointments.filter((a) => a.status === "COMPLETED");
  const historicalPatients = new Set(completed.map((a) => a.patientId)).size;
  const oldest = completed
    .map((a) => a.completedAt)
    .filter(Boolean)
    .sort()[0] as string | undefined;

  return delay({
    completedAppointments: completed.length,
    historicalPatients,
    revenueRecords: payments.length,
    totalArchivedRevenue: payments.reduce((s, p) => s + p.amount, 0),
    reviewsArchived: reviews.length,
    doctorPerformanceSnapshots: doctors.length,
    since: oldest ?? null,
  });
}

export function getArchivedAppointments(): Promise<Appointment[]> {
  const { appointments } = getDataset();
  return delay(
    clone(
      appointments
        .filter((a) => a.status === "COMPLETED")
        .sort((a, b) => ((a.completedAt ?? "") < (b.completedAt ?? "") ? 1 : -1)),
    ),
  );
}

export function getRevenueHistory(): Promise<PaymentRecord[]> {
  const { payments } = getDataset();
  return delay(clone([...payments].sort((a, b) => (a.date < b.date ? 1 : -1))));
}

export function getReviewHistory(): Promise<Review[]> {
  const { reviews } = getDataset();
  return delay(clone([...reviews].sort((a, b) => (a.date < b.date ? 1 : -1))));
}

export function getDoctorPerformanceHistory(): Promise<DoctorPerformanceSnapshot[]> {
  const { doctors } = getDataset();
  return delay(
    clone(
      doctors.map((d) => ({
        doctorId: d.id,
        doctorName: d.fullName,
        completedAppointments: d.appointmentsCount,
        revenue: d.revenueGenerated,
        rating: d.rating,
      })),
    ),
  );
}
