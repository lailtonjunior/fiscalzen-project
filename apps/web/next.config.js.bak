const API_PROXY_TARGET = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';

/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${API_PROXY_TARGET}/api/v1/:path*`,
      },
    ];
  },
  reactStrictMode: true,
  transpilePackages: ['@fiscalzen/shared', '@fiscalzen/ui'],
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
