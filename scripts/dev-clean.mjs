import { rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawn, execSync } from "child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = process.env.PORT ?? "3001";

try {
  rmSync(join(root, ".next"), { recursive: true, force: true });
  console.log("→ Кэш .next удалён");
} catch {
  /* ignore */
}

if (process.platform === "win32") {
  try {
    const out = execSync(
      `netstat -ano | findstr :${port}`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }
    );
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      const m = line.trim().match(/\s+(\d+)\s*$/);
      if (m) pids.add(m[1]);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`→ Освобождён порт ${port} (PID ${pid})`);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* port free */
  }
}

const child = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

child.on("exit", (code) => process.exit(code ?? 0));
