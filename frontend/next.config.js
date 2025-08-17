/** @type {import('next').NextConfig} */
const nextConfig = {
  // حذف appDir از experimental
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
}

module.exports = nextConfig