import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const PENDING_REJECT_TTL_MS = 15 * 60 * 1000;

/** Short token for Telegram callback_data (max 64 bytes). Format: a:<token> */
export async function createTelegramActionToken(
  bookingId: string,
  action: "confirm" | "reject"
): Promise<string> {
  const token = randomBytes(12).toString("base64url");
  await prisma.telegramActionToken.create({
    data: {
      token,
      bookingId,
      action,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  return `a:${token}`;
}

export async function consumeTelegramActionToken(
  callbackData: string
): Promise<{ bookingId: string; action: string } | null> {
  if (!callbackData.startsWith("a:")) return null;
  const token = callbackData.slice(2);
  if (!token) return null;

  const row = await prisma.telegramActionToken.findUnique({
    where: { token },
  });
  if (!row || row.usedAt || row.expiresAt < new Date()) return null;

  await prisma.telegramActionToken.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });

  return { bookingId: row.bookingId, action: row.action };
}

export async function setPendingReject(
  chatId: string,
  userId: string,
  bookingId: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + PENDING_REJECT_TTL_MS);
  await prisma.telegramPendingReject.upsert({
    where: { chatId_userId: { chatId, userId } },
    create: { chatId, userId, bookingId, expiresAt },
    update: { bookingId, expiresAt },
  });
}

export async function consumePendingReject(
  chatId: string,
  userId: string
): Promise<string | null> {
  const row = await prisma.telegramPendingReject.findUnique({
    where: { chatId_userId: { chatId, userId } },
  });
  if (!row) return null;
  if (row.expiresAt < new Date()) {
    await prisma.telegramPendingReject.delete({ where: { id: row.id } }).catch(() => {});
    return null;
  }
  await prisma.telegramPendingReject.delete({ where: { id: row.id } });
  return row.bookingId;
}

/** Telegram IPv4 ranges — simplified check for common webhook sources. */
const TELEGRAM_CIDRS = [
  "149.154.160.0/20",
  "91.108.4.0/22",
];

function ipToLong(ip: string): number | null {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function cidrContains(cidr: string, ip: string): boolean {
  const [net, bitsStr] = cidr.split("/");
  const bits = parseInt(bitsStr, 10);
  const ipLong = ipToLong(ip);
  const netLong = ipToLong(net);
  if (ipLong === null || netLong === null || Number.isNaN(bits)) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipLong & mask) === (netLong & mask);
}

export function isTelegramIp(ip: string): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  if (process.env.SKIP_TELEGRAM_IP_CHECK === "true") return true;
  const clean = ip.replace(/^::ffff:/, "");
  return TELEGRAM_CIDRS.some((cidr) => cidrContains(cidr, clean));
}

export function verifyTelegramChat(chatId: string): boolean {
  const expected = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!expected) return false;
  return String(chatId).trim() === expected;
}
