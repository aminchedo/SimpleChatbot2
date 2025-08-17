/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    webpackBuildWorker: true,
  },
  swcMinify: true, // یا false اگر مشکل SWC باقی ماند
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
}

module.exports = nextConfig