/**
 * InClinic Admin — Design tokens
 * Aesthetic: Apple clarity · Linear precision · Stripe polish
 */

export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 14,
  md: 15,
  lg: 18,
  xl: 22,
  "2xl": 28,
} as const;

export const colors = {
  bg: "#09090b",
  bgElevated: "#0f0f12",
  surface: "#141417",
  surfaceHover: "#1a1a1f",
  surfaceActive: "#222228",
  border: "rgba(255,255,255,0.06)",
  borderStrong: "rgba(255,255,255,0.10)",
  text: "#fafafa",
  textSecondary: "#a1a1aa",
  textTertiary: "#71717a",
  accent: "#5e6ad2",
  accentHover: "#6b77db",
  accentMuted: "rgba(94,106,210,0.14)",
  success: "#30a46c",
  warning: "#f5a623",
  danger: "#e5484d",
  violet: "#8b5cf6",
  sky: "#38bdf8",
} as const;

export const motion = {
  fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
  base: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "320ms cubic-bezier(0.4, 0, 0.2, 1)",
  spring: { type: "spring" as const, stiffness: 420, damping: 32 },
};

export const layout = {
  sidebarWidth: 240,
  sidebarCollapsed: 68,
  topbarHeight: 56,
  contentMaxWidth: 1280,
  tableRowHeight: 52,
  kpiMinHeight: 108,
};
