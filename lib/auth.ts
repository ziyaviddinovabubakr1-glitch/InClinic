import { cookies } from "next/headers";
import { verifyAccessToken, type JwtPayload } from "@/lib/jwt";
import { validateSessionJti } from "@/lib/session";

export type { JwtPayload };

export async function getAdminUser(): Promise<JwtPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return null;
    const payload = await verifyAccessToken(token);
    if (!payload) return null;
    const valid = await validateSessionJti(payload.jti);
    if (!valid) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<JwtPayload> {
  const user = await getAdminUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
