/**
 * Centralized environment validation — no hardcoded production fallbacks.
 */

const DEV_JWT = "development-secret-min-32-characters-long";
const DEV_ADMIN_USER = "admin";
const DEV_ADMIN_PASS = "change-me";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function requireInProduction(name: string, value: string | undefined): string {
  if (value) return value;
  if (isProduction()) {
    throw new Error(`[security] ${name} is required in production`);
  }
  return "";
}

export function getJwtSecret(): Uint8Array {
  const raw =
    process.env.JWT_SECRET ??
    (isProduction() ? undefined : DEV_JWT);
  const secret = requireInProduction("JWT_SECRET", raw);
  if (!secret && !isProduction()) {
    return new TextEncoder().encode(DEV_JWT);
  }
  if (secret.length < 32) {
    throw new Error("[security] JWT_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export function getDefaultClinicSlug(): string {
  return process.env.DEFAULT_CLINIC_SLUG ?? "default";
}

export function getTelegramWebhookSecret(): string {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret && isProduction()) {
    throw new Error("[security] TELEGRAM_WEBHOOK_SECRET is required in production");
  }
  return secret ?? "";
}

export function getTelegramChatId(): string {
  return process.env.TELEGRAM_CHAT_ID ?? "";
}

export function isTelegramConfigured(): boolean {
  const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
  const chatId = process.env.TELEGRAM_CHAT_ID ?? "";
  return Boolean(
    token &&
    chatId &&
    !token.includes("your-telegram") &&
    !chatId.includes("your-telegram")
  );
}

export function getTelegramWebhookPublicUrl(): string | null {
  const url =
    process.env.TELEGRAM_WEBHOOK_PUBLIC_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "";
  if (url.startsWith("https://")) return url.replace(/\/$/, "");
  return null;
}

export function allowMockFallback(): boolean {
  return !isProduction() && process.env.ALLOW_MOCK_FALLBACK === "true";
}

export function allowDevCredentials(): boolean {
  return !isProduction();
}

export function getDevAdminCredentials(): { username: string; password: string } {
  return {
    username: process.env.ADMIN_USERNAME ?? DEV_ADMIN_USER,
    password: process.env.ADMIN_PASSWORD ?? DEV_ADMIN_PASS,
  };
}

export function hasUpstashRedis(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/** Access token TTL (seconds). Default 30 min per TZ. */
export function getAccessTokenTtlSec(): number {
  const v = parseInt(process.env.JWT_ACCESS_TTL_SEC ?? "1800", 10);
  return Number.isFinite(v) && v >= 900 && v <= 3600 ? v : 1800;
}

/** Refresh token TTL (seconds). Default 7 days. */
export function getRefreshTokenTtlSec(): number {
  const v = parseInt(process.env.JWT_REFRESH_TTL_SEC ?? "604800", 10);
  return Number.isFinite(v) && v >= 86400 ? v : 604800;
}

export function getBookingMaxHorizonDays(): number {
  return 90;
}
