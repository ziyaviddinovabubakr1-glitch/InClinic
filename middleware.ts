import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import { actionForAdminRoute, can, type AuthSubject } from "@/lib/rbac";
import {
  gateCookieName,
  getCanonicalHost,
  getSiteAccessKey,
  isBypassPath,
  isGateOpen,
  isIndexingBlocked,
  privacyHeaders,
} from "@/lib/site-privacy";

function withPrivacy(response: NextResponse): NextResponse {
  if (!isIndexingBlocked()) return response;
  for (const [key, value] of Object.entries(privacyHeaders())) {
    response.headers.set(key, value);
  }
  return response;
}

function redirectToCanonicalHost(request: NextRequest): NextResponse | null {
  const canonical = getCanonicalHost();
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (!canonical || !host || host === canonical) return null;
  if (!host.endsWith(".onrender.com")) return null;

  const url = request.nextUrl.clone();
  url.protocol = "https";
  url.host = canonical;
  return withPrivacy(NextResponse.redirect(url, 301));
}

function enforceAccessGate(request: NextRequest): NextResponse | null {
  const accessKey = getSiteAccessKey();
  if (!accessKey) return null;

  const { pathname } = request.nextUrl;
  if (isBypassPath(pathname)) return null;

  const queryKey = request.nextUrl.searchParams.get("access");
  if (queryKey === accessKey) {
    const clean = request.nextUrl.clone();
    clean.searchParams.delete("access");
    const response = NextResponse.redirect(clean);
    response.cookies.set(gateCookieName(), accessKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return withPrivacy(response);
  }

  if (isGateOpen(request)) return null;

  return withPrivacy(new NextResponse(null, { status: 404 }));
}

/** Edge-safe: JWT signature + claims only. Session revocation checked in API handlers. */
async function enforceAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/") || pathname === "/admin") {
    if (pathname === "/admin") return null;

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
    if (publicPaths.includes(pathname)) return null;

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

  return null;
}

export async function middleware(request: NextRequest) {
  const canonicalRedirect = redirectToCanonicalHost(request);
  if (canonicalRedirect) return canonicalRedirect;

  const gateResponse = enforceAccessGate(request);
  if (gateResponse) return gateResponse;

  const adminResponse = await enforceAdminAuth(request);
  if (adminResponse) return withPrivacy(adminResponse);

  return withPrivacy(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image).*)",
  ],
};
