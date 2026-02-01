/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output só em Linux/Docker (Windows não suporta symlinks sem admin)
  output: process.platform === 'win32' ? undefined : 'standalone',

  // Temporarily ignore ESLint during builds (circular reference issue)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Opt-in to caching (restore Next.js 14 behavior)
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
