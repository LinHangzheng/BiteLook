import type { NextConfig } from "next";

const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';

const nextConfig: NextConfig = {
  // Only enable static export for Capacitor iOS builds
  // For Vercel deployment, we need normal mode to support API routes
  ...(isCapacitorBuild ? { output: 'export' } : {}),
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
