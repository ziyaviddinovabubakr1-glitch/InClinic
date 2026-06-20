import type { NotificationType } from "@/lib/admin/types";
import { getDataset } from "@/lib/admin/mock/dataset";
import { delay } from "./util";

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const TYPE_META: Record<NotificationType, { title: string }> = {
  patient: { title: "Новый пациент" },
  appointment: { title: "Новая запись" },
  review: { title: "Новый отзыв" },
  cancel: { title: "Отмена записи" },
  doctor: { title: "Изменение врача" },
  schedule: { title: "Изменение расписания" },
};

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

export function getNotifications(): Promise<AdminNotification[]> {
  const { appointments, patients, reviews, doctors } = getDataset();
  const patientMap = new Map(patients.map((p) => [p.id, p]));
  const doctorMap = new Map(doctors.map((d) => [d.id, d]));

  const items: AdminNotification[] = [];

  for (const a of [...appointments].sort((x, y) => y.createdAt.localeCompare(x.createdAt)).slice(0, 8)) {
    const patient = patientMap.get(a.patientId);
    const doctor = doctorMap.get(a.doctorId);
    if (a.status === "CANCELLED") {
      items.push({
        id: `cancel-${a.id}`,
        type: "cancel",
        title: TYPE_META.cancel.title,
        message: `${patient?.fullName ?? "Пациент"} · ${a.date} ${a.time}`,
        time: relTime(a.createdAt),
        read: false,
      });
    } else {
      items.push({
        id: `appt-${a.id}`,
        type: "appointment",
        title: TYPE_META.appointment.title,
        message: `${patient?.fullName ?? "Пациент"} → ${doctor?.fullName ?? "Врач"} · ${a.date}`,
        time: relTime(a.createdAt),
        read: Math.random() > 0.55,
      });
    }
  }

  for (const r of [...reviews].sort((x, y) => y.date.localeCompare(x.date)).slice(0, 4)) {
    const doctor = doctorMap.get(r.doctorId);
    items.push({
      id: `review-${r.id}`,
      type: "review",
      title: TYPE_META.review.title,
      message: `${r.rating} ★ · ${doctor?.fullName ?? "Врач"}`,
      time: relTime(r.date),
      read: Math.random() > 0.4,
    });
  }

  for (const p of [...patients].sort((x, y) => y.registeredAt.localeCompare(x.registeredAt)).slice(0, 3)) {
    items.push({
      id: `patient-${p.id}`,
      type: "patient",
      title: TYPE_META.patient.title,
      message: p.fullName,
      time: relTime(p.registeredAt),
      read: true,
    });
  }

  items.push({
    id: "schedule-1",
    type: "schedule",
    title: TYPE_META.schedule.title,
    message: "Обновлено расписание на следующую неделю",
    time: "2 ч назад",
    read: false,
  });

  items.sort((a, b) => Number(a.read) - Number(b.read));
  return delay(items.slice(0, 14));
}

export function markAllNotificationsRead(): Promise<void> {
  return delay(undefined);
}
