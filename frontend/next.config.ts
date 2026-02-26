import type { NextConfig } from "next";

// In development, proxy /api to backend so relative /api/uploads URLs work
const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:5000/api" : "");
const apiOrigin = apiUrl.startsWith("http") ? new URL(apiUrl).origin : null;
const devProxy =
  process.env.NODE_ENV === "development" && apiOrigin
    ? [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }]
    : [];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/user/cart", destination: "/cart", permanent: true },
      { source: "/admin/settings", destination: "/admin/settings/general", permanent: true },
    ];
  },
  async rewrites() {
    return [...devProxy];
  },
};

export default nextConfig;
