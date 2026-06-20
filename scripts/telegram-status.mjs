import { loadEnvFiles } from "./load-env.mjs";
import { pathToFileURL } from "url";

loadEnvFiles();

const token = process.env.TELEGRAM_BOT_TOKEN;

async function main() {
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN не задан");
    process.exit(1);
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const data = await res.json();

  if (!data.ok) {
    console.error("getWebhookInfo failed:", data);
    process.exit(1);
  }

  const w = data.result;
  console.log("Telegram webhook status:");
  console.log("  URL:", w.url || "(polling / не задан)");
  console.log("  pending_update_count:", w.pending_update_count);
  if (w.last_error_date) {
    console.log("  last_error_date:", new Date(w.last_error_date * 1000).toISOString());
    console.log("  last_error_message:", w.last_error_message);
  } else {
    console.log("  last_error: нет");
  }

  const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const me = await meRes.json();
  if (me.ok) {
    console.log("  Bot:", `@${me.result.username}`);
  }

  console.log("");
  console.log("TELEGRAM_CHAT_ID:", process.env.TELEGRAM_CHAT_ID ? "задан" : "НЕ задан");
  console.log("TELEGRAM_WEBHOOK_SECRET:", process.env.TELEGRAM_WEBHOOK_SECRET ? "задан" : "НЕ задан");
  console.log(
    "TELEGRAM_WEBHOOK_PUBLIC_URL:",
    process.env.TELEGRAM_WEBHOOK_PUBLIC_URL || "(не задан — dev использует polling)"
  );
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
