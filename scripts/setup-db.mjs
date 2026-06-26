import { execSync } from "child_process";
import pg from "pg";
import { pathToFileURL } from "url";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { startEmbeddedPostgres, syncEnvFiles, DATABASE_URL } from "./embedded-db.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const INDEX_SQL = `
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_active_slot_unique"
ON "Booking" ("clinicId", "doctorId", "date", "timeSlot")
WHERE status IN ('PENDING', 'ACCEPTED');
`.trim();

export async function setupDatabase() {
  process.chdir(root);
  process.env.DATABASE_URL = DATABASE_URL;
  process.env.DIRECT_URL = DATABASE_URL;

  await startEmbeddedPostgres();
  syncEnvFiles();

  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  const existing = await client.query('SELECT COUNT(*)::int AS n FROM "User"');
  await client.end();

  if (existing.rows[0]?.n > 0) {
    console.log("→ База уже настроена, синхронизация схемы...");
    execSync("npx prisma generate", { stdio: "inherit", env: process.env });
    execSync("npx prisma db push", { stdio: "inherit", env: process.env });
    console.log("→ Backfill patients from bookings...");
    execSync("node scripts/backfill-patients.mjs", { stdio: "inherit", env: process.env });
    return;
  }

  console.log("→ Prisma generate...");
  execSync("npx prisma generate", { stdio: "inherit", env: process.env });

  console.log("→ Prisma db push...");
  execSync("npx prisma db push --accept-data-loss", { stdio: "inherit", env: process.env });

  console.log("→ Partial unique index...");
  const indexClient = new pg.Client({ connectionString: DATABASE_URL });
  await indexClient.connect();
  await indexClient.query(INDEX_SQL);
  await indexClient.end();

  console.log("→ Seed...");
  execSync("npx prisma db seed", { stdio: "inherit", env: process.env });

  console.log("✓ База данных готова");
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  setupDatabase().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
