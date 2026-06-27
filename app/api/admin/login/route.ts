import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "@/lib/password";
import { createSession, revokeSessionByJti } from "@/lib/session";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { writeAudit } from "@/lib/audit";
import { getClientIp, getBearerOrCookieToken, authenticateRequest } from "@/lib/auth-guard";
import { verifyAccessToken } from "@/lib/jwt";
import {
  allowDevCredentials,
  getDevAdminCredentials,
  getAccessTokenTtlSec,
  getRefreshTokenTtlSec,
} from "@/lib/env";

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

function getConfiguredOwnerCredentials(): { username: string; password: string } | null {
  const envUser = process.env.ADMIN_USERNAME?.trim();
  const envPass = process.env.ADMIN_PASSWORD?.trim();
  if (envUser && envPass) {
    return { username: envUser, password: envPass };
  }
  if (allowDevCredentials()) {
    return getDevAdminCredentials();
  }
  return null;
}

async function syncOwnerFromCredentials(username: string, plainPassword: string) {
  const slug = process.env.DEFAULT_CLINIC_SLUG ?? "default";
  const clinic =
    (await prisma.clinic.findUnique({ where: { slug } })) ??
    (await prisma.clinic.create({
      data: { slug, name: process.env.NEXT_PUBLIC_CLINIC_NAME ?? "InClinic" },
    }));

  await prisma.user.updateMany({
    where: { role: "OWNER", username: { not: username } },
    data: { active: false },
  });

  const passwordHash = await hashPassword(plainPassword);
  return prisma.user.upsert({
    where: { username },
    update: { passwordHash, role: "OWNER", clinicId: clinic.id, active: true },
    create: {
      username,
      passwordHash,
      role: "OWNER",
      clinicId: clinic.id,
      active: true,
    },
    include: { clinic: true },
  });
}

async function authenticateUser(username: string, password: string) {
  const normalized = username.trim();
  const plain = password.trim();
  if (!plain) return null;

  let user = await prisma.user.findUnique({
    where: { username: normalized },
    include: { clinic: true },
  });

  if (!user) {
    user = await prisma.user.findFirst({
      where: {
        username: { equals: normalized, mode: "insensitive" },
        role: "OWNER",
      },
      include: { clinic: true },
    });
  }

  if (user && (await verifyPassword(plain, user.passwordHash))) {
    if (!user.active) {
      return prisma.user.update({
        where: { id: user.id },
        data: { active: true },
        include: { clinic: true },
      });
    }
    return user;
  }

  /* Логин может отличаться — проверяем пароль у любого владельца (одна клиника) */
  const owners = await prisma.user.findMany({
    where: { role: "OWNER" },
    include: { clinic: true },
  });
  for (const owner of owners) {
    if (!(await verifyPassword(plain, owner.passwordHash))) continue;
    if (!owner.active) {
      return prisma.user.update({
        where: { id: owner.id },
        data: { active: true },
        include: { clinic: true },
      });
    }
    return owner;
  }

  const configured = getConfiguredOwnerCredentials();
  if (configured && plain === configured.password) {
    const usernameOk =
      normalized.toLowerCase() === configured.username.toLowerCase();
    if (usernameOk || allowDevCredentials()) {
      return syncOwnerFromCredentials(configured.username, plain);
    }
  }

  return null;
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

  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json(
      { error: "Введите имя пользователя и пароль" },
      { status: 400 }
    );
  }

  try {
    const user = await authenticateUser(username, password.trim());
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
            "Неверное имя пользователя или пароль. Логин по умолчанию: Abubakr",
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
      { error: "Сервис временно недоступен. Запустите базу: npm run dev" },
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
