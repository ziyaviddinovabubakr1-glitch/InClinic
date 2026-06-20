import { NextRequest, NextResponse } from "next/server";
import { validateSessionJti } from "@/lib/session";
import { verifyAccessToken } from "@/lib/jwt";

/**
 * Full auth check for admin API route handlers (Node runtime).
 * Validates JWT + session revocation via DB.
 */
export async function assertAdminApiSession(
  request: NextRequest
): Promise<NextResponse | null> {
  const jti = request.headers.get("x-session-jti");
  if (!jti) {
    const token =
      request.cookies.get("admin_token")?.value ??
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    const valid = await validateSessionJti(payload.jti);
    if (!valid) {
      return NextResponse.json({ error: "Session revoked" }, { status: 401 });
    }
    return null;
  }

  const valid = await validateSessionJti(jti);
  if (!valid) {
    return NextResponse.json({ error: "Session revoked" }, { status: 401 });
  }
  return null;
}
