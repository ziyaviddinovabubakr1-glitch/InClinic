import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  createSession,
  revokeAllUserSessions,
} from "@/lib/session";
import {
  authErrorResponse,
  getClientIp,
  requirePermission,
} from "@/lib/auth-guard";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { writeAudit } from "@/lib/audit";
import { getAccessTokenTtlSec, getRefreshTokenTtlSec } from "@/lib/env";

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

function validateNewPassword(password: string): string | null {
  if (password.length < 8) {
    return "Новый пароль — минимум 8 символов";
  }
  if (password.length > 128) {
    return "Пароль слишком длинный";
  }
  return null;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(
    "admin-password",
    ip,
    RATE_LIMITS.login.limit,
    RATE_LIMITS.login.windowMs
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте позже." },
      { status: 429 }
    );
  }

  try {
    const user = await requirePermission(request, "clinic:manage");
    if (user.role !== "OWNER") {
      return NextResponse.json({ error: "Только владелец может менять пароль" }, { status: 403 });
    }

    let body: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
    }

    const { currentPassword, newPassword, confirmPassword } = body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Заполните все поля" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Новый пароль и подтверждение не совпадают" },
        { status: 400 }
      );
    }

    const pwdError = validateNewPassword(newPassword);
    if (pwdError) {
      return NextResponse.json({ error: pwdError }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "Новый пароль должен отличаться от текущего" },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser?.active) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    const currentOk = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!currentOk) {
      await writeAudit({
        userId: user.userId,
        clinicId: user.clinicId,
        action: "password.change.failure",
        entity: "user",
        entityId: user.userId,
        ip,
      });
      return NextResponse.json(
        { error: "Текущий пароль неверный" },
        { status: 401 }
      );
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.userId },
      data: { passwordHash },
    });

    await revokeAllUserSessions(user.userId);

    const session = await createSession(
      {
        id: user.userId,
        username: user.username,
        role: user.role,
        clinicId: user.clinicId,
      },
      ip
    );

    await writeAudit({
      userId: user.userId,
      clinicId: user.clinicId,
      action: "password.change.success",
      entity: "user",
      entityId: user.userId,
      ip,
    });

    const response = NextResponse.json({ success: true });
    setAuthCookies(response, session.accessToken, session.refreshToken);
    return response;
  } catch (error) {
    return authErrorResponse(error);
  }
}
