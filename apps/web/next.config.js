/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@fiscalzen/shared', '@fiscalzen/ui'],
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
