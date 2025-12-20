import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const isDev = process.env.NODE_ENV === "development";

const withPWA = withPWAInit({
  dest: "public",
  disable: isDev,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  webpack: (config) => {
    // These aliases mark React Native / Solana-related modules as "unresolvable"
    // in the browser bundle. This prevents webpack from trying to include
    // Node- or React Native–only dependencies that are incompatible with Next.js
    // on the client, and preserves React Native compatibility without breaking
    // the web build.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
      "@solana/web3.js": false,
      "@solana-program/system": false,
      "@solana-program/token": false,
      "@solana-program/memo": false,
      "@solana/kit": false,
      bs58: false,
    };

    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default withPWA(nextConfig);
