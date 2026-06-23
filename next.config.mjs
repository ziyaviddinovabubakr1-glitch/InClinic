/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";

const csp = isDev
  ? [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' ws: wss: http://localhost:* https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  : [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig = {
  generateBuildId: async () => {
    return process.env.RENDER_GIT_COMMIT?.slice(0, 12) ?? `build-${Date.now()}`;
  },
  async headers() {
    const headers = [...securityHeaders];
    if (process.env.NODE_ENV === "production") {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
      headers.push({
        key: "Cache-Control",
        value: "no-cache, must-revalidate",
      });
    }
    return [{ source: "/:path*", headers }];
  },
};

export default nextConfig;
