import { NextRequest, NextResponse } from "next/server";
import { createSession, revokeSessionByJti } from "@/lib/session";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { writeAudit } from "@/lib/audit";
import { getClientIp, getBearerOrCookieToken, authenticateRequest } from "@/lib/auth-guard";
import { verifyAccessToken } from "@/lib/jwt";
import { getAccessTokenTtlSec, getRefreshTokenTtlSec } from "@/lib/env";
import { authenticateOwner } from "@/lib/admin-owner-auth";
import {
  ARCHIVE_UNLOCK_COOKIE,
  clearArchiveUnlockCookieOptions,
} from "@/lib/archive-access";

function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
) {
  response.cookies.set("admin_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: getAccessTokenTtlSec(),
    path: "/",
  });
  response.cookies.set("admin_refresh", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: getRefreshTokenTtlSec(),
    path: "/api/admin/refresh",
  });
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete("admin_token");
  response.cookies.delete("admin_refresh");
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit("login", ip, RATE_LIMITS.login.limit, RATE_LIMITS.login.windowMs);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте через 15 минут." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = (await request.json()) as { username?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
  }

  const username = body.username?.trim() ?? "";
  const password = body.password?.trim() ?? "";
  if (!username || !password) {
    return NextResponse.json(
      { error: "Введите имя пользователя и пароль" },
      { status: 400 }
    );
  }

  try {
    const user = await authenticateOwner(username, password);
    if (!user) {
      await writeAudit({
        action: "login.failure",
        entity: "user",
        ip,
        metadata: { username },
      });
      return NextResponse.json(
        {
          error:
            "Неверный логин или пароль. По умолчанию: Abubakr / InClinic2026! — или npm run admin:reset",
        },
        { status: 401 }
      );
    }

    const session = await createSession(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        clinicId: user.clinicId,
      },
      ip
    );

    await writeAudit({
      userId: user.id,
      clinicId: user.clinicId,
      action: "login.success",
      entity: "user",
      entityId: user.id,
      ip,
    });

    const response = NextResponse.json({ success: true });
    setAuthCookies(response, session.accessToken, session.refreshToken);
    return response;
  } catch (error) {
    console.error("[login] failed:", error);
    return NextResponse.json(
      { error: "База данных недоступна. Запустите: npm run dev" },
      { status: 503 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const token = getBearerOrCookieToken(request);
  if (token) {
    const payload = await verifyAccessToken(token);
    if (payload) {
      await revokeSessionByJti(payload.jti);
      await writeAudit({
        userId: payload.sub,
        clinicId: payload.clinicId,
        action: "logout",
        entity: "session",
        entityId: payload.jti,
        ip: getClientIp(request),
      });
    }
  }

  const response = NextResponse.json({ success: true });
  clearAuthCookies(response);
  response.cookies.set(ARCHIVE_UNLOCK_COOKIE, "", clearArchiveUnlockCookieOptions());
  return response;
}
