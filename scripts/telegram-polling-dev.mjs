/**
 * Dev-only: long-polling → forwards updates to local webhook handler.
 * Lets Confirm/Reject work on localhost without ngrok.
 */
import { loadEnvFiles } from "./load-env.mjs";
import { pathToFileURL } from "url";

loadEnvFiles();

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

export function startTelegramDevPolling(port = "3001", options = {}) {
  const { waitForReady = false, force = false } = options;

  if (!token || token.includes("your-telegram")) {
    console.warn("→ Telegram polling: TELEGRAM_BOT_TOKEN не задан");
    return null;
  }
  if (!secret || secret.length < 8) {
    console.warn("→ Telegram polling: TELEGRAM_WEBHOOK_SECRET не задан (мин. 8 символов)");
    return null;
  }

  if (!force && process.env.TELEGRAM_FORCE_DEV_POLLING !== "true") {
    console.warn(
      "→ Telegram dev polling отключён (удаляет production webhook)."
    );
    console.warn(
      "  Для локальной отладки кнопок: TELEGRAM_FORCE_DEV_POLLING=true npm run dev"
    );
    console.warn(
      "  Или задайте TELEGRAM_WEBHOOK_PUBLIC_URL=https://... и npm run telegram:webhook"
    );
    return null;
  }

  const localUrl = `http://127.0.0.1:${port}/api/telegram/webhook`;
  let offset = 0;
  let running = true;
  let serverReady = !waitForReady;

  (async () => {
    try {
      const del = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drop_pending_updates: false }),
      });
      const delData = await del.json();
      if (!delData.ok) {
        console.warn("[telegram/poll] deleteWebhook:", delData.description ?? delData);
      }
    } catch (e) {
      console.warn("[telegram/poll] deleteWebhook failed:", e.message ?? e);
    }

    console.log("→ Telegram dev polling (кнопки Подтвердить/Отклонить на localhost)");
    console.log(`  Forward → ${localUrl}`);

    while (running) {
      if (!serverReady) {
        try {
          const ping = await fetch(`http://127.0.0.1:${port}/api/services`, {
            signal: AbortSignal.timeout(2000),
          });
          if (ping.ok || ping.status === 503) {
            serverReady = true;
            console.log("→ Next.js готов, polling принимает нажатия кнопок");
          } else {
            await sleep(1000);
            continue;
          }
        } catch {
          await sleep(1000);
          continue;
        }
      }

      try {
        const res = await fetch(
          `https://api.telegram.org/bot${token}/getUpdates?timeout=25&offset=${offset}&allowed_updates=${encodeURIComponent(JSON.stringify(["message", "callback_query"]))}`,
          { signal: AbortSignal.timeout(35_000) }
        );
        const data = await res.json();
        if (!data.ok) {
          console.warn("[telegram/poll] getUpdates:", data.description ?? data);
          await sleep(5000);
          continue;
        }

        for (const update of data.result ?? []) {
          offset = update.update_id + 1;
          const fwd = await fetch(localUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-telegram-bot-api-secret-token": secret,
            },
            body: JSON.stringify(update),
          });
          if (!fwd.ok) {
            const body = await fwd.text().catch(() => "");
            console.warn(`[telegram/poll] webhook ${fwd.status}: ${body.slice(0, 160)}`);
          }
        }
      } catch (e) {
        if (running) {
          const msg = e.message ?? String(e);
          if (!msg.includes("AbortError") && !msg.includes("timeout")) {
            console.warn("[telegram/poll]", msg);
          }
          await sleep(3000);
        }
      }
    }
  })();

  return () => {
    running = false;
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const port = process.env.PORT ?? "3001";
  startTelegramDevPolling(port, { waitForReady: true });
}
