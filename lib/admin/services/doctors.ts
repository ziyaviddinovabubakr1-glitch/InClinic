import type { Doctor, DoctorAnalytics, TimeSeriesPoint } from "@/lib/admin/types";
import { getDataset } from "@/lib/admin/mock/dataset";
import { clone, delay } from "./util";

const MONTHS = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

export interface DoctorQuery {
  search?: string;
  status?: Doctor["status"] | "ALL";
}

export function listDoctors(query: DoctorQuery = {}): Promise<Doctor[]> {
  const { doctors } = getDataset();
  let rows = [...doctors];

  if (query.status && query.status !== "ALL") {
    rows = rows.filter((d) => d.status === query.status);
  }
  if (query.search) {
    const q = query.search.toLowerCase();
    rows = rows.filter(
      (d) =>
        d.fullName.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q),
    );
  }
  rows.sort((a, b) => b.revenueGenerated - a.revenueGenerated);
  return delay(clone(rows));
}

export function getDoctor(id: string): Promise<Doctor | null> {
  const { doctors } = getDataset();
  return delay(clone(doctors.find((d) => d.id === id) ?? null));
}

export type DoctorInput = Omit<
  Doctor,
  "id" | "rating" | "patientsCount" | "appointmentsCount" | "revenueGenerated" | "createdAt"
>;

export function createDoctor(input: DoctorInput): Promise<Doctor> {
  const ds = getDataset();
  const doctor: Doctor = {
    ...input,
    id: `doc-${Date.now()}`,
    rating: 0,
    patientsCount: 0,
    appointmentsCount: 0,
    revenueGenerated: 0,
    createdAt: new Date().toISOString(),
  };
  ds.doctors.push(doctor);
  return delay(clone(doctor));
}

export function updateDoctor(
  id: string,
  patch: Partial<DoctorInput>,
): Promise<Doctor | null> {
  const ds = getDataset();
  const doctor = ds.doctors.find((d) => d.id === id);
  if (!doctor) return delay(null);
  Object.assign(doctor, patch);
  return delay(clone(doctor));
}

export function deleteDoctor(id: string): Promise<{ ok: boolean }> {
  const ds = getDataset();
  const idx = ds.doctors.findIndex((d) => d.id === id);
  if (idx >= 0) ds.doctors.splice(idx, 1);
  return delay({ ok: idx >= 0 });
}

export function setDoctorStatus(
  id: string,
  status: Doctor["status"],
): Promise<Doctor | null> {
  return updateDoctor(id, { status });
}

export function getDoctorAnalytics(id: string): Promise<DoctorAnalytics | null> {
  const { doctors, appointments, reviews } = getDataset();
  const doctor = doctors.find((d) => d.id === id);
  if (!doctor) return delay(null);

  const docAppts = appointments.filter((a) => a.doctorId === id);
  const completed = docAppts.filter((a) => a.status === "COMPLETED");
  const docReviews = reviews.filter((r) => r.doctorId === id);

  // Repeat patients: those with >1 completed appointment
  const byPatient = new Map<string, number>();
  for (const a of completed) byPatient.set(a.patientId, (byPatient.get(a.patientId) ?? 0) + 1);
  const repeatPatients = Array.from(byPatient.values()).filter((c) => c > 1).length;

  // Monthly performance (revenue) for last 6 months
  const performance: TimeSeriesPoint[] = [];
  const now = new Date(2026, 5, 14);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = completed
      .filter((a) => {
        const ad = new Date(`${a.date}T00:00:00`);
        return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear();
      })
      .reduce((s, a) => s + a.price, 0);
    performance.push({ label: MONTHS[d.getMonth()], value });
  }

  const slots = doctor.workSchedule.days.length * 6 * 26; // rough capacity ~6mo
  const load = Math.min(100, Math.round((completed.length / Math.max(1, slots)) * 100));

  return delay(
    clone({
      doctorId: id,
      revenue: doctor.revenueGenerated,
      appointments: docAppts.length,
      patients: doctor.patientsCount,
      rating: doctor.rating,
      repeatPatients,
      load,
      performance,
    }),
  );
}
