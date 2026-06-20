/**
 * Deterministic pseudo-random generator (mulberry32).
 *
 * Mock data must be STABLE between server and client renders and across
 * navigation, otherwise React hydration mismatches and flickering occur.
 * A fixed seed guarantees the exact same dataset every time.
 */
export function createRng(seed: number) {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function rngPick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function rngFloat(
  rng: () => number,
  min: number,
  max: number,
  decimals = 1,
): number {
  const v = rng() * (max - min) + min;
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}
