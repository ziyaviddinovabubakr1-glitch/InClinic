import type { UserRole } from "@prisma/client";

export type Action =
  | "booking:read"
  | "booking:update"
  | "booking:delete"
  | "doctor:read"
  | "doctor:create"
  | "doctor:update"
  | "doctor:delete"
  | "service:read"
  | "service:create"
  | "service:update"
  | "service:delete"
  | "patient:read"
  | "patient:create"
  | "patient:update"
  | "patient:delete"
  | "review:read"
  | "review:create"
  | "review:update"
  | "review:delete"
  | "dashboard:read"
  | "analytics:read"
  | "audit:read"
  | "notification:read"
  | "notification:update"
  | "clinic:manage";

const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Action>> = {
  OWNER: new Set([
    "booking:read", "booking:update", "booking:delete",
    "doctor:read", "doctor:create", "doctor:update", "doctor:delete",
    "service:read", "service:create", "service:update", "service:delete",
    "patient:read", "patient:create", "patient:update", "patient:delete",
    "review:read", "review:create", "review:update", "review:delete",
    "dashboard:read", "analytics:read",
    "audit:read", "notification:read", "notification:update",
    "clinic:manage",
  ]),
  ADMIN: new Set([
    "booking:read", "booking:update",
    "doctor:read", "doctor:create", "doctor:update",
    "service:read", "service:create", "service:update",
    "patient:read", "patient:create", "patient:update",
    "review:read", "review:create", "review:update", "review:delete",
    "dashboard:read", "analytics:read",
    "audit:read", "notification:read", "notification:update",
  ]),
  DOCTOR: new Set([
    "booking:read", "booking:update",
    "doctor:read",
    "patient:read",
    "review:read",
    "dashboard:read",
    "notification:read",
  ]),
  RECEPTIONIST: new Set([
    "booking:read", "booking:update",
    "patient:read", "patient:create", "patient:update",
    "notification:read", "notification:update",
  ]),
};

export interface AuthSubject {
  sub: string;
  role: UserRole;
  clinicId: string;
  username: string;
}

export function can(user: AuthSubject, action: Action): boolean {
  const perms = ROLE_PERMISSIONS[user.role];
  if (!perms) return false;
  return perms.has(action);
}

/** Alias for middleware and API guards. */
export function checkPermission(user: AuthSubject, action: Action): boolean {
  return can(user, action);
}

export function assertCan(user: AuthSubject, action: Action): void {
  if (!can(user, action)) {
    throw new ForbiddenError(`Forbidden: ${action}`);
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function actionForAdminRoute(
  pathname: string,
  method: string
): Action | null {
  if (pathname.startsWith("/api/admin/bookings")) {
    if (method === "GET") return "booking:read";
    if (method === "PATCH") return "booking:update";
  }
  if (pathname.startsWith("/api/admin/doctors")) {
    if (method === "GET") return "doctor:read";
    if (method === "POST") return "doctor:create";
    if (method === "PUT") return "doctor:update";
    if (method === "DELETE") return "doctor:delete";
  }
  if (pathname.startsWith("/api/admin/services")) {
    if (method === "GET") return "service:read";
    if (method === "POST") return "service:create";
    if (method === "PUT") return "service:update";
    if (method === "DELETE") return "service:delete";
  }
  if (pathname.startsWith("/api/admin/patients")) {
    if (method === "GET") return "patient:read";
    if (method === "POST") return "patient:create";
    if (method === "PATCH") return "patient:update";
    if (method === "DELETE") return "patient:delete";
  }
  if (pathname.startsWith("/api/admin/reviews")) {
    if (method === "GET") return "review:read";
    if (method === "POST") return "review:create";
    if (method === "PATCH") return "review:update";
    if (method === "DELETE") return "review:delete";
  }
  if (pathname === "/api/admin/dashboard") {
    if (method === "GET") return "dashboard:read";
  }
  if (pathname === "/api/admin/analytics") {
    if (method === "GET") return "analytics:read";
  }
  if (pathname === "/api/admin/activity") {
    if (method === "GET") return "audit:read";
  }
  if (pathname.startsWith("/api/admin/notifications")) {
    if (method === "GET") return "notification:read";
    if (method === "PATCH") return "notification:update";
  }
  if (pathname === "/api/admin/session") {
    if (method === "GET") return null;
  }
  return null;
}

/** UI route → minimum permission to view page. */
export const ADMIN_PAGE_PERMISSIONS: Record<string, Action> = {
  "/admin/dashboard": "dashboard:read",
  "/admin/analytics": "analytics:read",
  "/admin/doctors": "doctor:read",
  "/admin/patients": "patient:read",
  "/admin/appointments": "booking:read",
  "/admin/services": "service:read",
  "/admin/reviews": "review:read",
  "/admin/activity": "audit:read",
  "/admin/notifications": "notification:read",
  "/admin/settings": "clinic:manage",
};

export function permissionForAdminPage(pathname: string): Action | null {
  if (pathname.startsWith("/admin/doctors/") && pathname.endsWith("/analytics")) {
    return "analytics:read";
  }
  if (pathname.startsWith("/admin/patients/")) return "patient:read";
  const match = Object.keys(ADMIN_PAGE_PERMISSIONS).find(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  return match ? ADMIN_PAGE_PERMISSIONS[match] : null;
}
