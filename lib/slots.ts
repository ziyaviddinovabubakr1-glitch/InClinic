const SLOT_INTERVAL_MINUTES = 30;
const PAST_BUFFER_MINUTES = 30;

function parseTime(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(":").map(Number);
  return { hours, minutes };
}

function timeToMinutes(time: string): number {
  const { hours, minutes } = parseTime(time);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function generateTimeSlots(workStart: string, workEnd: string): string[] {
  const startMinutes = timeToMinutes(workStart);
  const endMinutes = timeToMinutes(workEnd);
  const slots: string[] = [];

  for (
    let current = startMinutes;
    current < endMinutes;
    current += SLOT_INTERVAL_MINUTES
  ) {
    slots.push(minutesToTime(current));
  }

  return slots;
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function filterPastSlots(date: string, slots: string[]): string[] {
  if (date !== getTodayDateString()) {
    return slots;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const cutoffMinutes = currentMinutes + PAST_BUFFER_MINUTES;

  return slots.filter((slot) => timeToMinutes(slot) > cutoffMinutes);
}
