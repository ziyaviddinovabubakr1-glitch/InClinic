import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import {
  authErrorResponse,
  getClientIp,
  requirePermission,
} from "@/lib/auth-guard";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { writeAudit } from "@/lib/audit";
import {
  ARCHIVE_UNLOCK_COOKIE,
  archiveUnlockCookieOptions,
  clearArchiveUnlockCookieOptions,
  signArchiveUnlockToken,
  verifyArchiveUnlockToken,
} from "@/lib/archive-access";

async function isUnlocked(request: NextRequest, userId: string): Promise<boolean> {
  const token = request.cookies.get(ARCHIVE_UNLOCK_COOKIE)?.value;
  if (!token) return false;
  return verifyArchiveUnlockToken(token, userId);
}

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, "clinic:manage");
    if (user.role !== "OWNER") {
      return NextResponse.json({ unlocked: false });
    }
    const unlocked = await isUnlocked(request, user.userId);
    return NextResponse.json({ unlocked });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(
    "archive-unlock",
    ip,
    RATE_LIMITS.login.limit,
    RATE_LIMITS.login.windowMs,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте позже." },
      { status: 429 },
    );
  }

  try {
    const user = await requirePermission(request, "clinic:manage");
    if (user.role !== "OWNER") {
      return NextResponse.json({ error: "Доступ только для владельца" }, { status: 403 });
    }

    let body: { password?: string };
    try {
      body = (await request.json()) as { password?: string };
    } catch {
      return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
    }

    const password = body.password?.trim();
    if (!password) {
      return NextResponse.json({ error: "Введите пароль" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser?.active) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    const ok = await verifyPassword(password, dbUser.passwordHash);
    if (!ok) {
      await writeAudit({
        userId: user.userId,
        clinicId: user.clinicId,
        action: "archive.unlock.failure",
        entity: "archive",
        ip,
      });
      return NextResponse.json(
        { error: "Неверный пароль. Используйте пароль входа в панель." },
        { status: 401 },
      );
    }

    const token = await signArchiveUnlockToken(user.userId);
    await writeAudit({
      userId: user.userId,
      clinicId: user.clinicId,
      action: "archive.unlock.success",
      entity: "archive",
      ip,
    });

    const response = NextResponse.json({ unlocked: true });
    response.cookies.set(ARCHIVE_UNLOCK_COOKIE, token, archiveUnlockCookieOptions());
    return response;
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission(request, "clinic:manage");
    const response = NextResponse.json({ unlocked: false });
    response.cookies.set(ARCHIVE_UNLOCK_COOKIE, "", clearArchiveUnlockCookieOptions());
    return response;
  } catch (error) {
    return authErrorResponse(error);
  }
}
