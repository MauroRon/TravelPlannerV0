/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  logging: {
    fetches: {
      unclassified: 'warn',
    },
  },
  reactStrictMode: false,
}

export default nextConfig
