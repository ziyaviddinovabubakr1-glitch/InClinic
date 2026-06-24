/**
 * Manual reset: node scripts/reset-admin.mjs
 */
import { syncAdminFromEnv } from "./sync-admin-from-env.mjs";

syncAdminFromEnv()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
