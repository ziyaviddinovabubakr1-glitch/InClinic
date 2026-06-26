import { QueryClient } from "@tanstack/react-query";

export function createAdminQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

/** Polling intervals for live admin experience. */
export const REFETCH = {
  dashboard: 60_000,
  bookings: 30_000,
  notifications: 30_000,
  pendingBookings: 20_000,
} as const;
