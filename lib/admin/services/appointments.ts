import type {
  Appointment,
  AppointmentStatus,
  Paginated,
} from "@/lib/admin/types";
import { getDataset } from "@/lib/admin/mock/dataset";
import { clone, delay } from "./util";

export interface AppointmentQuery {
  search?: string;
  status?: AppointmentStatus | "ALL";
  doctorId?: string;
  page?: number;
  pageSize?: number;
}

export function listAppointments(
  query: AppointmentQuery = {},
): Promise<Paginated<Appointment>> {
  const { appointments } = getDataset();
  let rows = [...appointments];

  if (query.status && query.status !== "ALL") {
    rows = rows.filter((a) => a.status === query.status);
  }
  if (query.doctorId) {
    rows = rows.filter((a) => a.doctorId === query.doctorId);
  }
  if (query.search) {
    const q = query.search.toLowerCase();
    rows = rows.filter(
      (a) =>
        a.patientName.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q) ||
        a.serviceName.toLowerCase().includes(q),
    );
  }
  rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.time < b.time ? 1 : -1));

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

/** Allowed transitions. COMPLETED is terminal and cannot move or be deleted. */
const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function allowedTransitions(status: AppointmentStatus): AppointmentStatus[] {
  return TRANSITIONS[status];
}

export function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<{ ok: boolean; appointment?: Appointment; error?: string }> {
  const ds = getDataset();
  const appt = ds.appointments.find((a) => a.id === id);
  if (!appt) return delay({ ok: false, error: "not_found" });

  if (!TRANSITIONS[appt.status].includes(status)) {
    return delay({ ok: false, error: "invalid_transition" });
  }

  appt.status = status;
  if (status === "COMPLETED") {
    // Historical preservation: lock in revenue + completion timestamp.
    appt.completedAt = new Date().toISOString();
    const exists = ds.payments.some((p) => p.appointmentId === id);
    if (!exists) {
      ds.payments.push({
        id: `pay-${id}`,
        appointmentId: id,
        amount: appt.price,
        date: appt.completedAt,
        serviceName: appt.serviceName,
      });
    }
  }
  return delay({ ok: true, appointment: clone(appt) });
}
