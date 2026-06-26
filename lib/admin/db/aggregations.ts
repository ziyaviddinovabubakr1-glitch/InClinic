import { prisma } from "@/lib/prisma";
import type { BookingStatus } from "@prisma/client";

const MONTHS = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export async function loadClinicBookings(clinicId: string, fromDate?: string) {
  return prisma.booking.findMany({
    where: {
      clinicId,
      ...(fromDate ? { date: { gte: fromDate } } : {}),
    },
    include: {
      service: { select: { nameRu: true, price: true } },
      doctor: { select: { nameRu: true, id: true } },
      patient: {
        select: { id: true, firstName: true, lastName: true, phone: true },
      },
    },
    orderBy: [{ date: "desc" }, { timeSlot: "desc" }],
    take: 5000,
  });
}

export async function loadAllBookings(clinicId: string) {
  return prisma.booking.findMany({
    where: { clinicId },
    include: {
      service: { select: { nameRu: true, price: true } },
      doctor: { select: { nameRu: true, id: true } },
      patient: {
        select: { id: true, firstName: true, lastName: true, phone: true },
      },
    },
    orderBy: [{ date: "desc" }, { timeSlot: "desc" }],
    take: 10000,
  });
}

export function bookingRevenue(
  bookings: { status: BookingStatus; service: { price: number | null } }[],
): number {
  return bookings
    .filter((b) => b.status === "COMPLETED")
    .reduce((s, b) => s + (b.service.price ?? 0), 0);
}

export function seriesByDay(
  bookings: { date: string; status: BookingStatus; service: { price: number | null } }[],
  days: number,
  mode: "revenue" | "count",
) {
  const points: { label: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayBookings = bookings.filter((b) => b.date === key);
    const value =
      mode === "revenue"
        ? dayBookings
            .filter((b) => b.status === "COMPLETED")
            .reduce((s, b) => s + (b.service.price ?? 0), 0)
        : dayBookings.length;
    points.push({
      label: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
      value,
    });
  }
  return points;
}

export function presetFromDate(preset: string): string {
  switch (preset) {
    case "today":
      return todayStr();
    case "week":
      return dateOffset(7);
    case "month":
      return dateOffset(30);
    case "quarter":
      return dateOffset(90);
    case "year":
      return dateOffset(365);
    default:
      return dateOffset(30);
  }
}

export function presetSpan(preset: string): number {
  switch (preset) {
    case "today":
      return 1;
    case "week":
      return 7;
    case "month":
      return 30;
    case "quarter":
      return 90;
    case "year":
      return 365;
    default:
      return 30;
  }
}

export function bucketSeries(
  bookings: {
    date: string;
    status: BookingStatus;
    phoneHash: string;
    service: { price: number | null };
  }[],
  span: number,
  reducer: (dateKey: string) => number,
) {
  const step = span <= 31 ? 1 : Math.ceil(span / 12);
  const pts: { label: string; value: number }[] = [];
  for (let i = span - 1; i >= 0; i -= step) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label =
      span <= 31
        ? `${d.getDate()} ${MONTHS[d.getMonth()]}`
        : MONTHS[d.getMonth()];
    pts.push({ label, value: reducer(key) });
  }
  return pts;
}
