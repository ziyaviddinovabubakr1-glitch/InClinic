import type { DashboardData } from "@/lib/admin/types";
import { adminFetch } from "@/lib/admin/api-client";

export function getDashboardData(): Promise<DashboardData> {
  return adminFetch<DashboardData>("/api/admin/dashboard");
}
