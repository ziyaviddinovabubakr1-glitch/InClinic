import type { Service } from "@/lib/admin/types";
import { getDataset } from "@/lib/admin/mock/dataset";
import { clone, delay } from "./util";

export interface ServiceQuery {
  search?: string;
  active?: boolean | "ALL";
}

export function listServices(query: ServiceQuery = {}): Promise<Service[]> {
  const { services } = getDataset();
  let rows = [...services];

  if (query.active !== undefined && query.active !== "ALL") {
    rows = rows.filter((s) => s.active === query.active);
  }
  if (query.search) {
    const q = query.search.toLowerCase();
    rows = rows.filter((s) => s.name.toLowerCase().includes(q));
  }
  rows.sort((a, b) => b.revenue - a.revenue);
  return delay(clone(rows));
}

export type ServiceInput = Pick<
  Service,
  "name" | "description" | "price" | "durationMin" | "active"
>;

export function createService(input: ServiceInput): Promise<Service> {
  const ds = getDataset();
  const service: Service = {
    ...input,
    id: `svc-${Date.now()}`,
    salesCount: 0,
    revenue: 0,
    popularity: 0,
  };
  ds.services.push(service);
  return delay(clone(service));
}

export function updateService(
  id: string,
  patch: Partial<ServiceInput>,
): Promise<Service | null> {
  const ds = getDataset();
  const service = ds.services.find((s) => s.id === id);
  if (!service) return delay(null);
  Object.assign(service, patch);
  return delay(clone(service));
}

export function deleteService(id: string): Promise<{ ok: boolean }> {
  const ds = getDataset();
  const idx = ds.services.findIndex((s) => s.id === id);
  if (idx >= 0) ds.services.splice(idx, 1);
  return delay({ ok: idx >= 0 });
}

export function setServiceActive(id: string, active: boolean): Promise<Service | null> {
  return updateService(id, { active });
}
