import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import { actionForAdminRoute, can, type AuthSubject } from "@/lib/rbac";

/** Edge-safe: JWT signature + claims only. Session revocation checked in API handlers. */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/") || pathname === "/admin") {
    if (pathname === "/admin") return NextResponse.next();

    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL("/admin", request.url));
      response.cookies.delete("admin_token");
      response.cookies.delete("admin_refresh");
      return response;
    }
  }

  if (pathname.startsWith("/api/admin/")) {
    const publicPaths = ["/api/admin/login", "/api/admin/refresh"];
    if (publicPaths.includes(pathname)) {
      return NextResponse.next();
    }

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

    const user: AuthSubject = {
      sub: payload.sub,
      username: payload.username,
      role: payload.role,
      clinicId: payload.clinicId,
    };

    const requiredAction = actionForAdminRoute(pathname, request.method);
    if (requiredAction && !can(user, requiredAction)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", user.sub);
    requestHeaders.set("x-user-role", user.role);
    requestHeaders.set("x-clinic-id", user.clinicId);
    requestHeaders.set("x-session-jti", payload.jti);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
