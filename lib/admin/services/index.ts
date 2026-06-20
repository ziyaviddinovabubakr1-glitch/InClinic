/**
 * Admin service layer — the ONLY data entry point for the admin UI.
 *
 * UI components must import from "@/lib/admin/services" exclusively and never
 * reach into "@/lib/admin/mock". Swapping the body of these functions to call
 * a real PostgreSQL-backed API later requires zero UI changes.
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
