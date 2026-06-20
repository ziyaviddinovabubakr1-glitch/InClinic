import { spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { setupDatabase } from "./setup-db.mjs";
import { stopEmbeddedPostgres } from "./embedded-db.mjs";
import { loadEnvFiles } from "./load-env.mjs";
import { registerTelegramWebhook } from "./setup-telegram-webhook.mjs";
import { startTelegramDevPolling } from "./telegram-polling-dev.mjs";
import { waitForServer } from "./wait-for-server.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const port = process.env.PORT ?? "3001";

let stopPolling = null;

async function setupTelegramAfterServerReady() {
  const ready = await waitForServer(port);
  if (!ready) {
    console.warn("→ Next.js не ответил вовремя — Telegram может не работать");
    return;
  }

  const webhookOk = await registerTelegramWebhook({
    silent: false,
    skipDbPush: true,
    sendTest: false,
  });

  if (!webhookOk) {
    stopPolling = startTelegramDevPolling(port);
  } else {
    console.log("→ Telegram: webhook режим (кнопки через HTTPS)");
  }
}

async function main() {
  process.env.PORT = port;
  loadEnvFiles();
  await setupDatabase();

  console.log(`→ Next.js dev server http://localhost:${port}`);
  console.log(`→ Админка http://localhost:${port}/admin`);
  console.log(`→ Telegram: после старта сервера — webhook или dev polling`);

  const next = spawn("npx", ["next", "dev", "-p", port], {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  // Даём Next.js время занять порт, затем подключаем Telegram
  setTimeout(() => {
    setupTelegramAfterServerReady().catch((err) => {
      console.error("[telegram] setup failed:", err);
    });
  }, 5000);

  const shutdown = async () => {
    if (stopPolling) stopPolling();
    next.kill();
    await stopEmbeddedPostgres();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  next.on("exit", (code) => process.exit(code ?? 0));
}

main().catch(async (err) => {
  console.error(err);
  await stopEmbeddedPostgres();
  process.exit(1);
});
