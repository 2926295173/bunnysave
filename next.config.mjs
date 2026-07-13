import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "assets.dealselected.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["react", "react-dom"],
  },
};

const sentryBuildOptions = {
  telemetry: false,
  silent: !process.env.CI,
  disableLogger: true,
};

export default process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryBuildOptions)
  : nextConfig;
