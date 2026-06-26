import type { Service } from "@/lib/admin/types";
import { adminFetch } from "@/lib/admin/api-client";
import {
  mapDbServiceToUi,
  mapServiceInputToDb,
  type DbServiceRow,
} from "@/lib/admin/mappers";

export interface ServiceQuery {
  search?: string;
  active?: boolean | "ALL";
}

type ServicesResponse = { services: DbServiceRow[] };

export function listServices(query: ServiceQuery = {}): Promise<Service[]> {
  return adminFetch<ServicesResponse>("/api/admin/services").then(({ services }) => {
    const maxSales = Math.max(1, ...services.map((s) => s._count?.bookings ?? 0));
    let rows = services.map((s) => mapDbServiceToUi(s, maxSales));

    if (query.active !== undefined && query.active !== "ALL") {
      rows = rows.filter((s) => s.active === query.active);
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      rows = rows.filter((s) => s.name.toLowerCase().includes(q));
    }
    rows.sort((a, b) => b.revenue - a.revenue);
    return rows;
  });
}

export type ServiceInput = Pick<
  Service,
  "name" | "description" | "price" | "durationMin" | "active"
>;

export async function createService(input: ServiceInput): Promise<Service> {
  const data = await adminFetch<{ service: DbServiceRow }>("/api/admin/services", {
    method: "POST",
    body: JSON.stringify(mapServiceInputToDb(input)),
  });
  return mapDbServiceToUi(data.service);
}

export async function updateService(
  id: string,
  patch: Partial<ServiceInput>,
): Promise<Service | null> {
  const current = (await listServices()).find((s) => s.id === id);
  if (!current) return null;

  const merged: ServiceInput = {
    name: patch.name ?? current.name,
    description: patch.description ?? current.description,
    price: patch.price ?? current.price,
    durationMin: patch.durationMin ?? current.durationMin,
    active: patch.active ?? current.active,
  };

  const data = await adminFetch<{ service: DbServiceRow }>(`/api/admin/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(mapServiceInputToDb(merged)),
  });
  return mapDbServiceToUi(data.service);
}

export async function deleteService(id: string): Promise<{ ok: boolean }> {
  try {
    await adminFetch<{ success: boolean }>(`/api/admin/services/${id}`, {
      method: "DELETE",
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function setServiceActive(id: string, active: boolean): Promise<Service | null> {
  return updateService(id, { active });
}
