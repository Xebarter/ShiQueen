import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['sharp'],
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
  async rewrites() {
    return [
      { source: '/sw.js', destination: '/api/pwa/sw' },
      { source: '/api/dpo/callback', destination: '/api/payments/card/callback' },
      { source: '/og/product/:id.jpg', destination: '/api/og/product/:id' },
      { source: '/og/package/:id.jpg', destination: '/api/og/package/:id' },
    ];
  },
  async redirects() {
    return [
      { source: '/loyalty', destination: '/packages', permanent: true },
      {
        source: '/supplier',
        destination: '/suppliers',
        permanent: true,
      },
      {
        source: '/supplier/:path*',
        destination: '/suppliers/:path*',
        permanent: true,
      },
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
