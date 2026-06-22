/**
 * Рабочие дни врача (как в JS Date.getDay()): 0=Вс, 1=Пн … 6=Сб.
 * По умолчанию: Пн–Сб, один выходной (воскресенье). Владелец меняет в админке.
 */
export const DEFAULT_DOCTOR_WORK_DAYS: number[] = [1, 2, 3, 4, 5, 6];

/** Нормализует расписание: не больше одного выходного в неделе по умолчанию. */
export function normalizeWorkDays(days: number[]): number[] {
  const unique = [...new Set(days.filter((d) => d >= 0 && d <= 6))].sort((a, b) => a - b);
  if (unique.length >= 6) return unique;
  return DEFAULT_DOCTOR_WORK_DAYS;
}
