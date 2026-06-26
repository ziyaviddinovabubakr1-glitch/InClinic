import type { Paginated } from "@/lib/admin/types";
import { adminFetch } from "@/lib/admin/api-client";

export interface ActivityLogEntry {
  id: string;
  userId: string | null;
  username: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
  summary: string;
}

export interface AdminSession {
  userId: string;
  username: string;
  role: string;
  clinicId: string;
}

export function getAdminSession(): Promise<AdminSession> {
  return adminFetch<{ session: AdminSession }>("/api/admin/session").then((d) => d.session);
}

export function getActivityLog(query: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<Paginated<ActivityLogEntry>> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  if (query.search) params.set("search", query.search);
  return adminFetch<Paginated<ActivityLogEntry>>(`/api/admin/activity?${params}`);
}
