import { SignJWT, jwtVerify } from "jose";
import { createHash, randomUUID } from "crypto";
import type { UserRole } from "@prisma/client";
import { getAccessTokenTtlSec, getJwtSecret } from "@/lib/env";

export interface JwtPayload {
  sub: string;
  username: string;
  role: UserRole;
  clinicId: string;
  jti: string;
}

export async function signAccessToken(
  payload: Omit<JwtPayload, "jti"> & { jti?: string }
): Promise<{ token: string; jti: string; expiresAt: Date }> {
  const jti = payload.jti ?? randomUUID();
  const ttlSec = getAccessTokenTtlSec();
  const expiresAt = new Date(Date.now() + ttlSec * 1000);

  const token = await new SignJWT({
    username: payload.username,
    role: payload.role,
    clinicId: payload.clinicId,
    jti,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${ttlSec}s`)
    .setJti(jti)
    .sign(getJwtSecret());

  return { token, jti, expiresAt };
}

export async function verifyAccessToken(
  token: string
): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const sub = payload.sub;
    const username = payload.username;
    const role = payload.role as UserRole | undefined;
    const clinicId = payload.clinicId;
    const jti = payload.jti;

    if (
      typeof sub !== "string" ||
      typeof username !== "string" ||
      typeof clinicId !== "string" ||
      typeof jti !== "string" ||
      !role ||
      !["OWNER", "ADMIN", "DOCTOR"].includes(role)
    ) {
      return null;
    }

    return { sub, username, role, clinicId, jti: String(jti) };
  } catch {
    return null;
  }
}

export function getTokenFromHeader(
  authorization: string | null | undefined
): string | null {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}
