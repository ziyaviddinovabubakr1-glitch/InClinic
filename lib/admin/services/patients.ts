import type {
  Paginated,
  Patient,
  PatientProfile,
  PatientSegment,
} from "@/lib/admin/types";
import { getDataset } from "@/lib/admin/mock/dataset";
import { clone, delay } from "./util";

export interface PatientQuery {
  search?: string;
  segment?: PatientSegment | "ALL";
  page?: number;
  pageSize?: number;
}

export function listPatients(query: PatientQuery = {}): Promise<Paginated<Patient>> {
  const { patients } = getDataset();
  let rows = [...patients];

  if (query.segment && query.segment !== "ALL") {
    rows = rows.filter((p) => p.segment === query.segment);
  }
  if (query.search) {
    const q = query.search.toLowerCase();
    rows = rows.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.email.toLowerCase().includes(q),
    );
  }
  rows.sort((a, b) => b.totalPaid - a.totalPaid);

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 12;
  const total = rows.length;
  const start = (page - 1) * pageSize;

  return delay(
    clone({
      rows: rows.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    }),
  );
}

export function getPatientProfile(id: string): Promise<PatientProfile | null> {
  const { patients, appointments, payments, reviews } = getDataset();
  const patient = patients.find((p) => p.id === id);
  if (!patient) return delay(null);

  const patientAppts = appointments
    .filter((a) => a.patientId === id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const patientPayments = payments
    .filter((p) => patientAppts.some((a) => a.id === p.appointmentId))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const patientReviews = reviews
    .filter((r) => r.patientId === id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return delay(
    clone({
      ...patient,
      appointments: patientAppts,
      payments: patientPayments,
      reviews: patientReviews,
    }),
  );
}

export function getSegmentCounts(): Promise<Record<PatientSegment, number>> {
  const { patients } = getDataset();
  const counts: Record<PatientSegment, number> = {
    NEW: 0,
    REGULAR: 0,
    VIP: 0,
    INACTIVE: 0,
  };
  for (const p of patients) counts[p.segment]++;
  return delay(counts);
}
