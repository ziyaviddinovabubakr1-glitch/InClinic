/**
 * Export architecture (V1 = service layer only).
 *
 * The owner will be able to export every data category in multiple formats.
 * V1 ships the interface + a working CSV generator (client-safe) so the wiring
 * is real; XLSX and PDF are declared and stubbed so the UI and future backend
 * can adopt them without redesign.
 */
import type {
  Appointment,
  Doctor,
  Patient,
  Review,
  Service,
} from "@/lib/admin/types";
import { getDataset } from "@/lib/admin/mock/dataset";
import { delay } from "./util";

export type ExportFormat = "CSV" | "XLSX" | "PDF";

export type ExportCategory =
  | "patients"
  | "doctors"
  | "appointments"
  | "reviews"
  | "revenue"
  | "services";

export const EXPORT_FORMATS: ExportFormat[] = ["CSV", "XLSX", "PDF"];
export const EXPORT_CATEGORIES: ExportCategory[] = [
  "patients",
  "doctors",
  "appointments",
  "reviews",
  "revenue",
  "services",
];

export interface ExportRequest {
  category: ExportCategory;
  format: ExportFormat;
  from?: string;
  to?: string;
  doctorId?: string;
  serviceId?: string;
}

export interface ExportResult {
  filename: string;
  mime: string;
  /** Populated for CSV in V1; XLSX/PDF return an empty body with `pending: true`. */
  content: string;
  pending: boolean;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  return lines.join("\n");
}

function categoryRows(category: ExportCategory): Record<string, unknown>[] {
  const ds = getDataset();
  switch (category) {
    case "patients":
      return ds.patients.map((p: Patient) => ({
        id: p.id, fullName: p.fullName, phone: p.phone, email: p.email,
        segment: p.segment, visits: p.visitsCount, totalPaid: p.totalPaid,
        registeredAt: p.registeredAt,
      }));
    case "doctors":
      return ds.doctors.map((d: Doctor) => ({
        id: d.id, fullName: d.fullName, specialty: d.specialty,
        experienceYears: d.experienceYears, rating: d.rating,
        patients: d.patientsCount, appointments: d.appointmentsCount,
        revenue: d.revenueGenerated, status: d.status,
      }));
    case "appointments":
      return ds.appointments.map((a: Appointment) => ({
        id: a.id, date: a.date, time: a.time, patient: a.patientName,
        doctor: a.doctorName, service: a.serviceName, status: a.status,
        price: a.price,
      }));
    case "reviews":
      return ds.reviews.map((r: Review) => ({
        id: r.id, date: r.date, doctor: r.doctorName, patient: r.patientName,
        service: r.serviceName, rating: r.rating, visibility: r.visibility,
        comment: r.comment,
      }));
    case "revenue":
      return ds.payments.map((p) => ({
        id: p.id, date: p.date, service: p.serviceName, amount: p.amount,
        appointmentId: p.appointmentId,
      }));
    case "services":
      return ds.services.map((s: Service) => ({
        id: s.id, name: s.name, price: s.price, sales: s.salesCount,
        revenue: s.revenue, popularity: s.popularity, active: s.active,
      }));
  }
}

export function exportData(request: ExportRequest): Promise<ExportResult> {
  const rows = categoryRows(request.category);
  const stamp = new Date().toISOString().slice(0, 10);
  const base = `inclinic-${request.category}-${stamp}`;

  if (request.format === "CSV") {
    return delay({
      filename: `${base}.csv`,
      mime: "text/csv;charset=utf-8",
      content: toCsv(rows),
      pending: false,
    });
  }

  // XLSX / PDF: architecture is ready; generation arrives with backend.
  return delay({
    filename: `${base}.${request.format.toLowerCase()}`,
    mime: request.format === "XLSX"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "application/pdf",
    content: "",
    pending: true,
  });
}
