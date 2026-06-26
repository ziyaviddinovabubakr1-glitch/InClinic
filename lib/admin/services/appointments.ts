import type {
  Appointment,
  AppointmentStatus,
  Paginated,
} from "@/lib/admin/types";
import { adminFetch } from "@/lib/admin/api-client";

export interface AppointmentQuery {
  search?: string;
  status?: AppointmentStatus | "ALL";
  doctorId?: string;
  page?: number;
  pageSize?: number;
}

type BookingsResponse = {
  bookings: Appointment[];
  pagination: { total: number; page: number; pages: number; pageSize: number };
};

/** Allowed transitions in admin UI terms. */
const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function allowedTransitions(status: AppointmentStatus): AppointmentStatus[] {
  return TRANSITIONS[status];
}

export async function listAppointments(
  query: AppointmentQuery = {},
): Promise<Paginated<Appointment>> {
  const params = new URLSearchParams();
  if (query.status && query.status !== "ALL") params.set("status", query.status);
  if (query.search) params.set("search", query.search);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));

  const data = await adminFetch<BookingsResponse>(`/api/admin/bookings?${params}`);

  let rows = data.bookings;
  if (query.doctorId) {
    rows = rows.filter((a) => a.doctorId === query.doctorId);
  }

  return {
    rows,
    total: data.pagination.total,
    page: data.pagination.page,
    pageSize: data.pagination.pageSize,
  };
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<{ ok: boolean; appointment?: Appointment; error?: string }> {
  try {
    const data = await adminFetch<{ booking: Appointment }>("/api/admin/bookings", {
      method: "PATCH",
      body: JSON.stringify({ id, status }),
    });
    return { ok: true, appointment: data.booking };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    if (msg.includes("422") || msg.includes("Нельзя")) {
      return { ok: false, error: "invalid_transition" };
    }
    if (msg.includes("404")) {
      return { ok: false, error: "not_found" };
    }
    return { ok: false, error: msg };
  }
}
