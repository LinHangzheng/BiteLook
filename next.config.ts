import type { NextConfig } from "next";

const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';

const nextConfig: NextConfig = {
  // Only enable static export and trailingSlash for Capacitor iOS builds
  // For Vercel deployment, we need normal mode to support API routes
  // trailingSlash causes 308 redirects on POST API routes, stripping the body
  ...(isCapacitorBuild ? { output: 'export', trailingSlash: true } : {}),
  images: { unoptimized: true },
};

export default nextConfig;
