import type { NextConfig } from "next";
import path from "node:path";

const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  async rewrites() {
    // Django expects trailing slashes; Next strips them from :path*, so add one back.
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*/` }];
  },
  turbopack: {
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
