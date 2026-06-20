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
  | "audit:read"
  | "clinic:manage";

const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Action>> = {
  OWNER: new Set([
    "booking:read",
    "booking:update",
    "booking:delete",
    "doctor:read",
    "doctor:create",
    "doctor:update",
    "doctor:delete",
    "service:read",
    "service:create",
    "service:update",
    "service:delete",
    "audit:read",
    "clinic:manage",
  ]),
  ADMIN: new Set([
    "booking:read",
    "booking:update",
    "doctor:read",
    "doctor:create",
    "doctor:update",
    "service:read",
    "service:create",
    "service:update",
    "audit:read",
  ]),
  DOCTOR: new Set(["booking:read", "booking:update", "doctor:read"]),
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

/** Map HTTP route + method to required action. */
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
  return null;
}
