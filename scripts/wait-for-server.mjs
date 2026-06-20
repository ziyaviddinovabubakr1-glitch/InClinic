/** Wait until HTTP server responds on port (for dev Telegram polling). */
export async function waitForServer(port, maxWaitMs = 90_000) {
  const url = `http://127.0.0.1:${port}/api/services`;
  const started = Date.now();

  while (Date.now() - started < maxWaitMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok || res.status === 503) return true;
    } catch {
      /* server not ready */
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  return false;
}
