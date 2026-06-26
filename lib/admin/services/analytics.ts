import type {
  CategoryPoint,
  DateRangePreset,
  TimeSeriesPoint,
} from "@/lib/admin/types";
import { adminFetch } from "@/lib/admin/api-client";

export interface AnalyticsRange {
  preset: DateRangePreset;
  from?: string;
  to?: string;
}

export interface AnalyticsData {
  revenue: TimeSeriesPoint[];
  patients: TimeSeriesPoint[];
  appointments: TimeSeriesPoint[];
  repeatVisits: TimeSeriesPoint[];
  doctorLoad: CategoryPoint[];
  servicePopularity: CategoryPoint[];
  clinicGrowth: TimeSeriesPoint[];
}

export function getAnalytics(range: AnalyticsRange): Promise<AnalyticsData> {
  const params = new URLSearchParams({ preset: range.preset });
  return adminFetch<AnalyticsData>(`/api/admin/analytics?${params}`);
}
