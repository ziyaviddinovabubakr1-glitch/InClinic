/**
 * Export — reads live data from admin API routes (PostgreSQL).
 */
import type { Appointment, Doctor, Patient, Service } from "@/lib/admin/types";
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
  message?: string;
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

function xmlEscape(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toSpreadsheetXml(rows: Record<string, unknown>[]): string {
  const headers = rows.length ? Object.keys(rows[0]) : ["empty"];
  const cell = (v: unknown) =>
    `<Cell><Data ss:Type="String">${xmlEscape(v)}</Data></Cell>`;
  const headerRow = `<Row>${headers.map((h) => cell(h)).join("")}</Row>`;
  const dataRows = rows
    .map((r) => `<Row>${headers.map((h) => cell(r[h])).join("")}</Row>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Export"><Table>${headerRow}${dataRows}</Table></Worksheet>
</Workbook>`;
}

function pdfHexText(text: string): string {
  let hex = "FEFF";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    hex += code.toString(16).padStart(4, "0");
  }
  return `<${hex}>`;
}

function toSimplePdf(rows: Record<string, unknown>[], title: string): string {
  const lines: string[] = [title, ""];
  if (rows.length) {
    const headers = Object.keys(rows[0]);
    lines.push(headers.join("  |  "));
    lines.push("—".repeat(40));
    rows.slice(0, 400).forEach((r) => {
      lines.push(headers.map((h) => String(r[h] ?? "")).join("  |  "));
    });
  } else {
    lines.push("Нет данных");
  }

  const fontSize = 10;
  const lineHeight = 14;
  let y = 780;
  const streamParts: string[] = ["BT", `/F1 ${fontSize} Tf`];
  for (const line of lines) {
    streamParts.push(`1 0 0 1 40 ${y} Tm`, `${pdfHexText(line)} Tj`);
    y -= lineHeight;
    if (y < 40) break;
  }
  streamParts.push("ET");
  const stream = streamParts.join("\n");
  const streamLen = new TextEncoder().encode(stream).length;

  const objects = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj",
    `4 0 obj<< /Length ${streamLen} >>stream\n${stream}\nendstream\nendobj`,
    "5 0 obj<< /Type /Font /Subtype /Type0 /BaseFont /ArialUnicodeMS /Encoding /Identity-H /DescendantFonts [6 0 R] >>endobj",
    "6 0 obj<< /Type /Font /Subtype /CIDFontType2 /BaseFont /ArialUnicodeMS /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor 7 0 R >>endobj",
    "7 0 obj<< /Type /FontDescriptor /FontName /ArialUnicodeMS /Flags 4 /FontBBox [-500 -200 2000 900] /ItalicAngle 0 /Ascent 900 /Descent -200 /CapHeight 700 >>endobj",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += `${obj}\n`;
  }
  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return pdf;
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

  if (request.format === "XLSX") {
    return {
      filename: `${base}.xls`,
      mime: "application/vnd.ms-excel;charset=utf-8",
      content: toSpreadsheetXml(rows),
      pending: false,
    };
  }

  return {
    filename: `${base}.pdf`,
    mime: "application/pdf",
    content: toSimplePdf(rows, `InClinic — ${request.category}`),
    pending: false,
  };
}
