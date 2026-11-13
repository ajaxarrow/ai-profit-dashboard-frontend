import type { NextConfig } from "next";
import path from "node:path";

// The browser only talks to this app; /api/* is proxied to Django. In production the address must be set,
// at build time too, because Next resolves rewrites during `next build`.
if (process.env.NODE_ENV === "production" && !process.env.BACKEND_URL) {
  throw new Error("BACKEND_URL is not set. Set it to the backend's address, e.g. https://ai-profit-dashboard-backend.onrender.com");
}
const backend = (process.env.BACKEND_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");

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
