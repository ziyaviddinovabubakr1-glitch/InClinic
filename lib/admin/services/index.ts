/**
 * Admin service layer — the ONLY data entry point for the admin UI.
 *
 * UI components must import from "@/lib/admin/services" exclusively.
 * All functions call `/api/admin/*` routes backed by PostgreSQL via Prisma.
 */
export * from "./dashboard";
export * from "./doctors";
export * from "./patients";
export * from "./appointments";
export * from "./reviews";
export * from "./services";
export * from "./analytics";
export * from "./export";
export * from "./archive";
export * from "./notifications";
export { money } from "./util";
export type { PatientInput } from "./patients";
