const isDev = process.env.NODE_ENV === "development";

// The browser only talks to this app; /api/tweets talks to twitterapi.io.
// Avatars load straight from X's image CDN.
const contentSecurityPolicy = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "https://pbs.twimg.com", "https://abs.twimg.com"],
  "font-src": ["'self'"],
  "connect-src": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
};

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: Object.entries(contentSecurityPolicy)
      .map(([directive, sources]) => [directive, ...sources].join(" "))
      .join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
