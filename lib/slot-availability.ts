import { generateTimeSlots, filterPastSlots } from "@/lib/slots";
import { isBeyondHorizon, isPastDate } from "@/lib/booking-rules";

export type SlotStatus = "available" | "booked" | "past";
export type DayStatus = "off" | "past" | "full" | "available" | "unavailable";

export interface SlotEntry {
  time: string;
  status: SlotStatus;
}

export interface WeekDayEntry {
  date: string;
  dayName: string;
  dayNum: number;
  monthShort: string;
  status: DayStatus;
  availableCount: number;
  totalCount: number;
}

const MONTH_SHORT_RU = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

export function getMondayOfWeek(isoOrDate?: string): string {
  const base = isoOrDate ? new Date(`${isoOrDate}T12:00:00`) : new Date();
  const dow = base.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  base.setDate(base.getDate() + diff);
  return base.toISOString().slice(0, 10);
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function buildSlotTimeline(
  date: string,
  workStart: string,
  workEnd: string,
  bookedSlots: Set<string>
): { timeline: SlotEntry[]; available: string[] } {
  const all = generateTimeSlots(workStart, workEnd);
  const notPast = new Set(filterPastSlots(date, all));
  const timeline: SlotEntry[] = all.map((time) => {
    if (!notPast.has(time)) return { time, status: "past" };
    if (bookedSlots.has(time)) return { time, status: "booked" };
    return { time, status: "available" };
  });
  const available = timeline.filter((s) => s.status === "available").map((s) => s.time);
  return { timeline, available };
}

export function resolveDayStatus(
  date: string,
  workDays: number[],
  workStart: string,
  workEnd: string,
  bookedSlots: Set<string>
): Omit<WeekDayEntry, "dayName" | "dayNum" | "monthShort"> {
  const dow = new Date(`${date}T12:00:00`).getDay();

  if (!workDays.includes(dow)) {
    return { date, status: "off", availableCount: 0, totalCount: 0 };
  }
  if (isPastDate(date)) {
    return { date, status: "past", availableCount: 0, totalCount: 0 };
  }
  if (isBeyondHorizon(date)) {
    return { date, status: "unavailable", availableCount: 0, totalCount: 0 };
  }

  const { timeline, available } = buildSlotTimeline(date, workStart, workEnd, bookedSlots);
  const totalCount = timeline.filter((s) => s.status !== "past").length;
  const availableCount = available.length;

  if (totalCount === 0) {
    return { date, status: "past", availableCount: 0, totalCount: 0 };
  }
  if (availableCount === 0) {
    return { date, status: "full", availableCount: 0, totalCount };
  }
  return { date, status: "available", availableCount, totalCount };
}

export function buildWeekDays(
  weekStart: string,
  workDays: number[],
  workStart: string,
  workEnd: string,
  bookingsByDate: Map<string, Set<string>>,
  dayNames: readonly string[]
): WeekDayEntry[] {
  const days: WeekDayEntry[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDaysIso(weekStart, i);
    const d = new Date(`${date}T12:00:00`);
    const booked = bookingsByDate.get(date) ?? new Set();
    const core = resolveDayStatus(date, workDays, workStart, workEnd, booked);
    days.push({
      ...core,
      dayName: dayNames[d.getDay()],
      dayNum: d.getDate(),
      monthShort: MONTH_SHORT_RU[d.getMonth()],
    });
  }
  return days;
}
