/**
 * Production start: register Telegram webhook, then run Next.js.
 */
import { spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { loadEnvFiles } from "./load-env.mjs";
import { registerTelegramWebhook } from "./setup-telegram-webhook.mjs";

loadEnvFiles();

const port = process.env.PORT ?? "3000";

try {
  const ok = await registerTelegramWebhook({
    silent: false,
    skipDbPush: true,
    sendTest: false,
  });
  if (!ok) {
    console.warn(
      "→ Telegram webhook не зарегистрирован — задайте TELEGRAM_WEBHOOK_PUBLIC_URL или NEXT_PUBLIC_BASE_URL (https://...)"
    );
  }
} catch (e) {
  console.warn("→ Telegram webhook registration error:", e?.message ?? e);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const next = spawn("npx", ["next", "start", "-p", port], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

next.on("exit", (code) => process.exit(code ?? 0));

process.on("SIGINT", () => next.kill("SIGINT"));
process.on("SIGTERM", () => next.kill("SIGTERM"));
