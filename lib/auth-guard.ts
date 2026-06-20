import { NextRequest } from "next/server";
import { resolveAuthPayload } from "@/lib/session";
import { assertCan, type Action, type AuthSubject, ForbiddenError } from "@/lib/rbac";
import type { JwtPayload } from "@/lib/jwt";

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function getBearerOrCookieToken(request: NextRequest): string | null {
  return (
    request.cookies.get("admin_token")?.value ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    null
  );
}

export async function authenticateRequest(
  request: NextRequest
): Promise<(JwtPayload & { userId: string }) | null> {
  const token = getBearerOrCookieToken(request);
  if (!token) return null;
  return resolveAuthPayload(token);
}

export function toAuthSubject(
  payload: JwtPayload & { userId: string }
): AuthSubject {
  return {
    sub: payload.sub,
    username: payload.username,
    role: payload.role,
    clinicId: payload.clinicId,
  };
}

export async function requireAuth(
  request: NextRequest
): Promise<AuthSubject & { userId: string }> {
  const payload = await authenticateRequest(request);
  if (!payload) throw new UnauthorizedError();
  return { ...toAuthSubject(payload), userId: payload.userId };
}

export async function requirePermission(
  request: NextRequest,
  action: Action
): Promise<AuthSubject & { userId: string }> {
  const user = await requireAuth(request);
  assertCan(user, action);
  return user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export { ForbiddenError };

export function authErrorResponse(error: unknown): Response {
  if (error instanceof UnauthorizedError) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return Response.json({ error: "Internal error" }, { status: 500 });
}
