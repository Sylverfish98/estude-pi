import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // bcryptjs and prisma are Node-only; keep them out of the edge bundle.
    serverActions: {
      bodySizeLimit: "1mb",
    },
  },
};

export default nextConfig;
