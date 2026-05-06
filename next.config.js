/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // We can add rewrites if we want to point to the Express server during migration
  // but for now let's stick to pure Next.js for the admin panel.
};

module.exports = nextConfig;
