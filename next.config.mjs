/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: '/loyalty', destination: '/packages', permanent: true },
      { source: '/wholesale/bundles', destination: '/packages', permanent: true },
      { source: '/wholesale/bundles/:id', destination: '/packages/:id', permanent: true },
      { source: '/admin/wholesale/packages', destination: '/admin/packages', permanent: true },
      {
        source: '/admin/wholesale/packages/:path*',
        destination: '/admin/packages/:path*',
        permanent: true,
      },
    ];
  },
}

export default nextConfig
