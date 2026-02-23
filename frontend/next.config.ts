import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/user/cart", destination: "/cart", permanent: true },
      { source: "/admin/settings", destination: "/admin/settings/general", permanent: true },
    ];
  },
};

export default nextConfig;
