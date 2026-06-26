import { adminFetch } from "@/lib/admin/api-client";

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export function getNotifications(): Promise<AdminNotification[]> {
  return adminFetch<{ notifications: AdminNotification[] }>("/api/admin/notifications").then(
    (d) => d.notifications,
  );
}

export function markNotificationRead(id: string): Promise<void> {
  return adminFetch<{ success: boolean }>(`/api/admin/notifications/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ read: true }),
  }).then(() => undefined);
}

export function markAllNotificationsRead(): Promise<void> {
  return adminFetch<{ success: boolean }>("/api/admin/notifications", {
    method: "PATCH",
    body: JSON.stringify({ markAll: true }),
  }).then(() => undefined);
}
