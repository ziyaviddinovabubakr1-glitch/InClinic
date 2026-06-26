import { adminFetch } from "@/lib/admin/api-client";
import type { Appointment, NotificationType } from "@/lib/admin/types";

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин назад`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч назад`;
  const days = Math.floor(hrs / 24);
  return `${days} дн назад`;
}

export async function getNotifications(): Promise<AdminNotification[]> {
  const [pending, recent] = await Promise.all([
    adminFetch<{ bookings: Appointment[] }>("/api/admin/bookings?status=PENDING&pageSize=10"),
    adminFetch<{ bookings: Appointment[] }>("/api/admin/bookings?pageSize=10"),
  ]);

  const items: AdminNotification[] = [];

  for (const a of pending.bookings) {
    items.push({
      id: `pending-${a.id}`,
      type: "appointment",
      title: "Новая заявка",
      message: `${a.patientName} → ${a.doctorName} · ${a.date}`,
      time: relTime(a.createdAt),
      read: false,
    });
  }

  for (const a of recent.bookings) {
    if (a.status === "CANCELLED") {
      items.push({
        id: `cancel-${a.id}`,
        type: "cancel",
        title: "Отмена записи",
        message: `${a.patientName} · ${a.date} ${a.time}`,
        time: relTime(a.createdAt),
        read: true,
      });
    }
  }

  items.sort((a, b) => Number(a.read) - Number(b.read));
  return items.slice(0, 14);
}

export function markAllNotificationsRead(): Promise<void> {
  return Promise.resolve();
}
