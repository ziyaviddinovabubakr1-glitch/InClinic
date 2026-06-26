import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import { validateSessionJti } from "@/lib/session";
import { assertAdminApiSession } from "@/lib/admin-api-guard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sessionErr = await assertAdminApiSession(request);
  if (sessionErr) return sessionErr;

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

  return NextResponse.json({
    session: {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
      clinicId: payload.clinicId,
    },
  });
}
