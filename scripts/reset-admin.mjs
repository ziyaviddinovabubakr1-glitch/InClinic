/**
 * Manual reset: npm run admin:reset
 * Loads env, starts embedded Postgres if needed, syncs owner from ADMIN_* / defaults.
 */
import { loadEnvFiles } from "./load-env.mjs";
import { startEmbeddedPostgres, DATABASE_URL } from "./embedded-db.mjs";
import { syncAdminFromEnv } from "./sync-admin-from-env.mjs";

async function main() {
  loadEnvFiles();
  process.env.DATABASE_URL = DATABASE_URL;
  process.env.DIRECT_URL = DATABASE_URL;

  await startEmbeddedPostgres();
  const { username } = await syncAdminFromEnv();
  console.log(`✓ Владелец синхронизирован: "${username}"`);
  console.log("  Логин: Abubakr (или ADMIN_USERNAME из .env)");
  console.log("  Пароль: InClinic2026! (или ADMIN_PASSWORD из .env)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
