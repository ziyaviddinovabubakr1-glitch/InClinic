/**
 * Service-layer utilities.
 *
 * The admin UI talks ONLY to the functions exported from `lib/admin/services`.
 * Today they resolve against the in-memory mock dataset; tomorrow the body of
 * each service can be swapped for `fetch('/api/admin/...')` without any UI
 * change, because the return types are fixed by `lib/admin/types`.
 */

/** Simulates network latency so loading states are realistic in the demo. */
export function delay<T>(value: T, ms = 220): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Deep clone to prevent UI from mutating the shared dataset by reference. */
export function clone<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Fixed "today" for the deterministic demo universe. */
export const NOW = new Date(2026, 5, 14, 12, 0, 0);

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86_400_000);
}

export function money(n: number): string {
  return `${n.toLocaleString("ru-RU")} c.`;
}
