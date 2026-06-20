import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import { getRefreshTokenTtlSec } from "@/lib/env";
import { hashIp, signAccessToken, type JwtPayload } from "@/lib/jwt";

export interface SessionUser {
  id: string;
  username: string;
  role: UserRole;
  clinicId: string;
}

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createSession(
  user: SessionUser,
  ip: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  jti: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
}> {
  const refreshToken = generateRefreshToken();
  const refreshExpiresAt = new Date(
    Date.now() + getRefreshTokenTtlSec() * 1000
  );

  const { token, jti, expiresAt } = await signAccessToken({
    sub: user.id,
    username: user.username,
    role: user.role,
    clinicId: user.clinicId,
  });

  await prisma.session.create({
    data: {
      userId: user.id,
      jti,
      refreshTokenHash: hashRefreshToken(refreshToken),
      ipHash: hashIp(ip),
      expiresAt: refreshExpiresAt,
    },
  });

  return {
    accessToken: token,
    refreshToken,
    jti,
    accessExpiresAt: expiresAt,
    refreshExpiresAt,
  };
}

export async function validateSessionJti(jti: string): Promise<boolean> {
  const session = await prisma.session.findUnique({ where: { jti } });
  if (!session || session.revokedAt) return false;
  if (session.expiresAt < new Date()) return false;
  return true;
}

export async function revokeSessionByJti(jti: string): Promise<void> {
  await prisma.session.updateMany({
    where: { jti, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function refreshSession(
  refreshToken: string,
  ip: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  payload: JwtPayload;
} | null> {
  const hash = hashRefreshToken(refreshToken);
  const session = await prisma.session.findFirst({
    where: {
      refreshTokenHash: hash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: { include: { clinic: true } } },
  });

  if (!session || !session.user.active) return null;

  await prisma.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });

  const result = await createSession(
    {
      id: session.user.id,
      username: session.user.username,
      role: session.user.role,
      clinicId: session.user.clinicId,
    },
    ip
  );

  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    payload: {
      sub: session.user.id,
      username: session.user.username,
      role: session.user.role,
      clinicId: session.user.clinicId,
      jti: result.jti,
    },
  };
}

export async function resolveAuthPayload(
  token: string
): Promise<(JwtPayload & { userId: string }) | null> {
  const { verifyAccessToken } = await import("@/lib/jwt");
  const payload = await verifyAccessToken(token);
  if (!payload) return null;
  const valid = await validateSessionJti(payload.jti);
  if (!valid) return null;
  return { ...payload, userId: payload.sub };
}
