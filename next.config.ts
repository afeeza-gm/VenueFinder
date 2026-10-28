import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: '/venues/:id/assets/images/:file*',
        destination: '/assets/images/:file*',
      },
      {
        source: '/book/assets/images/:file*',
        destination: '/assets/images/:file*',
      },
    ];
  },
};

export default nextConfig;
