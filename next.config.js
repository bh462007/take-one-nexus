const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
    ],
  },
  async rewrites() {
    if (process.env.VERCEL || process.env.NEXT_DISABLE_API_PROXY === 'true') {
      return [];
    }

    const legacyApiOrigin = process.env.LEGACY_API_ORIGIN || 'http://127.0.0.1:5001';

    return [
      {
        source: '/api/:path*',
        destination: `${legacyApiOrigin}/api/:path*`,
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  // Sentry Options
  silent: true,
  org: "take-one",
  project: "nexus-frontend",
}, {
  // Upload Options
  widenClientFileUpload: false, // Don't widen client uploads
  transpileClientSDK: false,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: true,
  disableClientSide: true, // Specifically disable on the client
});

