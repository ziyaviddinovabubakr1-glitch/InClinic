/**
 * Export — reads live data from admin API routes (PostgreSQL).
 */
import type { Appointment, Doctor, Patient, Review, Service } from "@/lib/admin/types";
import { adminFetch } from "@/lib/admin/api-client";
import { listDoctors } from "./doctors";
import { listServices } from "./services";

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

async function categoryRows(category: ExportCategory): Promise<Record<string, unknown>[]> {
  switch (category) {
    case "patients": {
      const data = await adminFetch<{ rows: Patient[] }>("/api/admin/patients?pageSize=500");
      return data.rows.map((p) => ({
        id: p.id,
        fullName: p.fullName,
        phone: p.phone,
        segment: p.segment,
        visits: p.visitsCount,
        totalPaid: p.totalPaid,
        registeredAt: p.registeredAt,
      }));
    }
    case "doctors": {
      const doctors = await listDoctors();
      return doctors.map((d: Doctor) => ({
        id: d.id,
        fullName: d.fullName,
        specialty: d.specialty,
        appointments: d.appointmentsCount,
        revenue: d.revenueGenerated,
        status: d.status,
      }));
    }
    case "appointments": {
      const data = await adminFetch<{ bookings: Appointment[] }>(
        "/api/admin/bookings?pageSize=500",
      );
      return data.bookings.map((a) => ({
        id: a.id,
        date: a.date,
        time: a.time,
        patient: a.patientName,
        doctor: a.doctorName,
        service: a.serviceName,
        status: a.status,
        price: a.price,
      }));
    }
    case "reviews":
      return [];
    case "revenue": {
      const data = await adminFetch<{ bookings: Appointment[] }>(
        "/api/admin/bookings?status=COMPLETED&pageSize=500",
      );
      return data.bookings.map((a) => ({
        id: a.id,
        date: a.completedAt ?? a.date,
        service: a.serviceName,
        amount: a.price,
        appointmentId: a.id,
      }));
    }
    case "services": {
      const services = await listServices();
      return services.map((s: Service) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        sales: s.salesCount,
        revenue: s.revenue,
        active: s.active,
      }));
    }
  }
}

export async function exportData(request: ExportRequest): Promise<ExportResult> {
  const rows = await categoryRows(request.category);
  const stamp = new Date().toISOString().slice(0, 10);
  const base = `inclinic-${request.category}-${stamp}`;

  if (request.format === "CSV") {
    return {
      filename: `${base}.csv`,
      mime: "text/csv;charset=utf-8",
      content: toCsv(rows),
      pending: false,
    };
  }

  return {
    filename: `${base}.${request.format.toLowerCase()}`,
    mime: request.format === "XLSX"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "application/pdf",
    content: "",
    pending: true,
  };
}
