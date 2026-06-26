import { SignJWT, jwtVerify } from "jose";
import { getJwtSecret } from "@/lib/env";

export const ARCHIVE_UNLOCK_COOKIE = "admin_archive_unlock";
const TTL_SEC = 4 * 60 * 60;

export async function signArchiveUnlockToken(userId: string): Promise<string> {
  return new SignJWT({ purpose: "archive" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${TTL_SEC}s`)
    .sign(getJwtSecret());
}

export async function verifyArchiveUnlockToken(
  token: string,
  userId: string,
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload.sub === userId && payload.purpose === "archive";
  } catch {
    return false;
  }
}

export function archiveUnlockCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: TTL_SEC,
    path: "/",
  };
}

export function clearArchiveUnlockCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 0,
    path: "/",
  };
}
