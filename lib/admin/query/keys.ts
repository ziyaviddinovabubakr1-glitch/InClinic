/** Centralized React Query keys for admin data layer. */
export const adminKeys = {
  all: ["admin"] as const,
  dashboard: () => [...adminKeys.all, "dashboard"] as const,
  patients: {
    all: () => [...adminKeys.all, "patients"] as const,
    list: (params: Record<string, unknown>) =>
      [...adminKeys.patients.all(), "list", params] as const,
    counts: () => [...adminKeys.patients.all(), "counts"] as const,
    detail: (id: string) => [...adminKeys.patients.all(), "detail", id] as const,
  },
  doctors: {
    all: () => [...adminKeys.all, "doctors"] as const,
    list: (params: Record<string, unknown>) =>
      [...adminKeys.doctors.all(), "list", params] as const,
    analytics: (id: string) => [...adminKeys.doctors.all(), "analytics", id] as const,
  },
  bookings: {
    all: () => [...adminKeys.all, "bookings"] as const,
    list: (params: Record<string, unknown>) =>
      [...adminKeys.bookings.all(), "list", params] as const,
    pending: () => [...adminKeys.bookings.all(), "pending"] as const,
  },
  services: {
    all: () => [...adminKeys.all, "services"] as const,
    list: (params: Record<string, unknown>) =>
      [...adminKeys.services.all(), "list", params] as const,
  },
  reviews: {
    all: () => [...adminKeys.all, "reviews"] as const,
    list: (params: Record<string, unknown>) =>
      [...adminKeys.reviews.all(), "list", params] as const,
    analytics: () => [...adminKeys.reviews.all(), "analytics"] as const,
  },
  notifications: {
    all: () => [...adminKeys.all, "notifications"] as const,
    list: () => [...adminKeys.notifications.all(), "list"] as const,
  },
  activity: {
    all: () => [...adminKeys.all, "activity"] as const,
    list: (params: Record<string, unknown>) =>
      [...adminKeys.activity.all(), "list", params] as const,
  },
  session: () => [...adminKeys.all, "session"] as const,
  analytics: {
    all: () => [...adminKeys.all, "analytics"] as const,
    range: (preset: string) => [...adminKeys.analytics.all(), preset] as const,
  },
  archive: {
    summary: () => [...adminKeys.all, "archive", "summary"] as const,
  },
};
