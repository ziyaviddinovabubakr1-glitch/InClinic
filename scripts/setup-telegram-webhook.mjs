/**
 * Register Telegram Bot webhook for InClinic.
 * Usage:
 *   npm run telegram:webhook
 *   TELEGRAM_WEBHOOK_PUBLIC_URL=https://xxx.ngrok-free.app npm run telegram:webhook
 */
import { loadEnvFiles, root } from "./load-env.mjs";
import { execSync } from "child_process";
import { join } from "path";
import { pathToFileURL } from "url";

loadEnvFiles();

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const chatId = process.env.TELEGRAM_CHAT_ID;

async function detectNgrokHttpsUrl() {
  try {
    const res = await fetch("http://127.0.0.1:4040/api/tunnels", {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const tunnels = data.tunnels ?? [];
    const https = tunnels.find((t) => t.public_url?.startsWith("https://"));
    return https?.public_url?.replace(/\/$/, "") ?? null;
  } catch {
    return null;
  }
}

function resolvePublicBaseUrl() {
  const candidates = [
    process.env.TELEGRAM_WEBHOOK_PUBLIC_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.RENDER_EXTERNAL_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ];
  for (const raw of candidates) {
    if (raw && raw.startsWith("https://")) {
      return raw.replace(/\/$/, "");
    }
  }
  return null;
}

export async function registerTelegramWebhook(options = {}) {
  const { silent = false, skipDbPush = false, sendTest = true } = options;
  const log = silent ? () => {} : console.log;
  const warn = silent ? () => {} : console.warn;

  if (!token || token.includes("your-telegram")) {
    warn("→ TELEGRAM_BOT_TOKEN не задан в .env.local — webhook пропущен");
    return false;
  }
  if (!secret || secret.length < 8) {
    warn("→ TELEGRAM_WEBHOOK_SECRET должен быть мин. 8 символов (A-Za-z0-9_-) — webhook пропущен");
    return false;
  }
  if (!chatId) {
    warn("→ TELEGRAM_CHAT_ID не задан — webhook пропущен");
    return false;
  }

  if (!skipDbPush) {
    try {
      log("→ Prisma db push (TelegramPendingReject)...");
      execSync("npx prisma db push", {
        cwd: root,
        stdio: silent ? "pipe" : "inherit",
        env: process.env,
      });
    } catch (e) {
      warn("→ prisma db push не выполнен:", e.message ?? e);
    }
  }

  let publicBase = resolvePublicBaseUrl();
  if (!publicBase) {
    publicBase = await detectNgrokHttpsUrl();
    if (publicBase) log(`→ Обнаружен ngrok: ${publicBase}`);
  }

  if (!publicBase) {
    warn("→ Публичный HTTPS URL не найден — webhook не регистрируется.");
    warn("  Локально: npm run dev автоматически включит Telegram polling.");
    warn("  Продакшен: задайте TELEGRAM_WEBHOOK_PUBLIC_URL и выполните npm run telegram:webhook");
    return false;
  }

  const webhookUrl = `${publicBase}/api/telegram/webhook`;
  log(`→ Регистрация webhook: ${webhookUrl}`);

  const body = {
    url: webhookUrl,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false,
  };

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!data.ok) {
    warn("✗ setWebhook ошибка:", JSON.stringify(data));
    return false;
  }

  log("✓ Webhook зарегистрирован");

  const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const info = await infoRes.json();
  if (info.ok) {
    const w = info.result;
    log(`  URL: ${w.url ?? "—"}`);
    if (w.last_error_message) {
      warn(`  ⚠ last_error: ${w.last_error_message}`);
    } else {
      log("  Статус: OK");
    }
  }

  // Test notify owner chat
  if (sendTest) {
    try {
      const testRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "✅ InClinic: webhook подключён. Кнопки подтверждения записей активны.",
          parse_mode: "HTML",
        }),
      });
      const testData = await testRes.json();
      if (!testData.ok) {
        warn("  ⚠ Не удалось отправить тест в чат:", testData.description);
        warn("    Проверьте TELEGRAM_CHAT_ID и что вы написали боту /start");
      } else {
        log("  Тестовое сообщение отправлено в чат владельца");
      }
    } catch (e) {
      warn("  ⚠ Тест sendMessage:", e.message ?? e);
    }
  }

  return true;
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  registerTelegramWebhook().then((ok) => process.exit(ok ? 0 : 1));
}
