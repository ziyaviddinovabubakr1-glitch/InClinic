import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dataDir = join(root, ".data", "postgres");
const port = Number(process.env.EMBEDDED_PG_PORT ?? 5432);
const user = "postgres";
const password = "password";
const database = "clinic";

export const DATABASE_URL = `postgresql://${user}:${password}@127.0.0.1:${port}/${database}?schema=public`;

let instance = null;
let external = false;

async function isDatabaseReady() {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    await client.query("SELECT 1");
    await client.end();
    return true;
  } catch {
    try {
      await client.end();
    } catch {
      /* ignore */
    }
    return false;
  }
}

export async function startEmbeddedPostgres() {
  if (instance) return instance;

  if (await isDatabaseReady()) {
    console.log(`→ PostgreSQL уже работает на порту ${port}`);
    syncEnvFiles();
    external = true;
    instance = { stop: async () => {} };
    return instance;
  }

  mkdirSync(dataDir, { recursive: true });

  const pgServer = new EmbeddedPostgres({
    databaseDir: dataDir,
    user,
    password,
    port,
    persistent: true,
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
    onLog: () => {},
    onError: (msg) => console.error("[postgres]", msg),
  });

  if (!existsSync(join(dataDir, "PG_VERSION"))) {
    console.log("→ Инициализация PostgreSQL...");
    await pgServer.initialise();
  }

  console.log(`→ Запуск PostgreSQL на порту ${port}...`);
  await pgServer.start();

  try {
    await pgServer.createDatabase(database);
    console.log(`→ База данных "${database}" создана`);
  } catch {
    // already exists
  }

  syncEnvFiles();
  instance = pgServer;
  external = false;
  return pgServer;
}

export function syncEnvFiles() {
  const envPath = join(root, ".env");
  const envLocalPath = join(root, ".env.local");
  const lines = [
    `DATABASE_URL="${DATABASE_URL}"`,
    `DIRECT_URL="${DATABASE_URL}"`,
  ];

  for (const file of [envPath, envLocalPath]) {
    if (!existsSync(file)) continue;
    let content = readFile(file);
    for (const line of lines) {
      const key = line.split("=")[0];
      const re = new RegExp(`^${key}=.*$`, "m");
      content = re.test(content) ? content.replace(re, line) : `${content.trimEnd()}\n${line}\n`;
    }
    writeFileSync(file, content, "utf8");
  }
}

function readFile(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

export async function stopEmbeddedPostgres() {
  if (!instance || external) return;
  await instance.stop();
  instance = null;
}
