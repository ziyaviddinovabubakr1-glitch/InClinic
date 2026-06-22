/**
 * Production build: Prisma client → schema sync → seed → Next.js build → Telegram webhook.
 * Used on Render / Railway / similar Node hosts.
 */
import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { registerTelegramWebhook } from "./setup-telegram-webhook.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd) {
  console.log(`→ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit", env: process.env });
}

run("npx prisma generate");
run("npx prisma db push");
run("node prisma/seed.mjs");
run("npx next build");

try {
  const ok = await registerTelegramWebhook({
    silent: false,
    skipDbPush: true,
    sendTest: true,
  });
  if (!ok) {
    console.warn("→ Telegram webhook not registered (check TELEGRAM_* env on Render)");
  }
} catch (e) {
  console.warn("→ Telegram webhook registration failed:", e?.message ?? e);
}
