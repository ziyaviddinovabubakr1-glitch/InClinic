/**
 * Production build: Prisma client → schema sync → seed → Next.js build.
 * Used on Render / Railway / similar Node hosts.
 */
import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd) {
  console.log(`→ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit", env: process.env });
}

run("npx prisma generate");
run("npx prisma db push");
run("npx prisma db seed");
run("npx next build");
