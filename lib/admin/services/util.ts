/**
 * Service-layer utilities shared by admin services.
 */

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86_400_000);
}

export function money(n: number): string {
  return `${n.toLocaleString("ru-RU")} c.`;
}
