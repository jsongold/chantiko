import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => {
    // Only proxy /api to uvicorn when running `npm run dev` (next dev)
    // When running `vercel dev`, Vercel handles Python functions directly
    if (process.env.VERCEL_ENV || process.env.VERCEL) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
