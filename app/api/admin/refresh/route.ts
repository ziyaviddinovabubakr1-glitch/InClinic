import { NextRequest, NextResponse } from "next/server";
import { refreshSession } from "@/lib/session";
import { getClientIp } from "@/lib/auth-guard";
import { getAccessTokenTtlSec, getRefreshTokenTtlSec } from "@/lib/env";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("admin_refresh")?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const result = await refreshSession(refreshToken, ip);
  if (!result) {
    const response = NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    response.cookies.delete("admin_token");
    response.cookies.delete("admin_refresh");
    return response;
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_token", result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: getAccessTokenTtlSec(),
    path: "/",
  });
  response.cookies.set("admin_refresh", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: getRefreshTokenTtlSec(),
    path: "/api/admin/refresh",
  });
  return response;
}
