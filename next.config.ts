import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone keeps the PM2 deployment self-contained on the VPS.
  output: "standalone",

  experimental: {
    // Detects loss of connectivity, retries blocked navigations and Server
    // Actions when it returns, and powers the `useOffline` hook in
    // components/OfflineBanner.tsx.
    useOffline: true,
  },

  // better-sqlite3 is a native module; it must stay external to the bundle.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
