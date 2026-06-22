/** Site privacy: no search indexing, optional invite link, canonical host. */

const GATE_COOKIE = "inclinic_gate";

export function isIndexingBlocked(): boolean {
  return process.env.SITE_BLOCK_INDEXING !== "false";
}

export function getCanonicalHost(): string | null {
  const raw = process.env.SITE_CANONICAL_HOST?.trim().toLowerCase();
  if (!raw) return null;
  return raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

export function getSiteAccessKey(): string | null {
  const key = process.env.SITE_ACCESS_KEY?.trim();
  return key || null;
}

export function gateCookieName(): string {
  return GATE_COOKIE;
}

export function isGateOpen(request: {
  cookies: { get: (name: string) => { value: string } | undefined };
}): boolean {
  const key = getSiteAccessKey();
  if (!key) return true;
  return request.cookies.get(GATE_COOKIE)?.value === key;
}

export function isBypassPath(pathname: string): boolean {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api/")) return true;
  if (/\.(png|jpe?g|gif|webp|svg|ico|woff2?|txt|xml)$/i.test(pathname)) return true;
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return true;
  return false;
}

export function privacyHeaders(): HeadersInit {
  if (!isIndexingBlocked()) return {};
  return {
    "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
  };
}
