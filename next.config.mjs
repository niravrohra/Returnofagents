// next.config.mjs
const isDev = process.env.NODE_ENV !== "production";

function csp() {
  return [
    "default-src * data: blob: 'unsafe-inline' 'unsafe-eval';",
    "script-src * data: blob: 'unsafe-inline' 'unsafe-eval';",
    "style-src * data: blob: 'unsafe-inline';",
    "img-src * data: blob:;",
    "frame-src * data: blob:;",
    "connect-src * data: blob:;",
    "font-src * data: blob:;",
    "worker-src * blob:;",
    "object-src *;",
    "base-uri *;",
  ].join(" ");
}

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: csp(),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
