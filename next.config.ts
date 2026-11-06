import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // The register is a SQLite file opened at runtime, so Next's output tracing
  // cannot detect it on its own. Without this, the file is missing from the
  // serverless bundle and every lookup fails in production.
  outputFileTracingIncludes: {
    "/": ["./prisma/dev.db"],
    "/scan": ["./prisma/dev.db"],
    "/api/scan": ["./prisma/dev.db"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
