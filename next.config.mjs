import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/v0/b/**' },
      { protocol: 'https', hostname: '**.firebasestorage.app' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    qualities: [75],
    minimumCacheTTL: 60 * 60 * 24 * 7,
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
      { source: '/og/product/:id.jpg', destination: '/og/product/:id' },
      { source: '/og/package/:id.jpg', destination: '/og/package/:id' },
    ];
  },
  async headers() {
    const cache = { key: 'Cache-Control', value: 'public, max-age=3600, must-revalidate' };
    const iconCache = {
      key: 'Cache-Control',
      value: 'public, max-age=86400, stale-while-revalidate=604800',
    };
    const indexable = {
      key: 'X-Robots-Tag',
      value: 'index, follow, max-image-preview:large, max-snippet:-1',
    };
    const coop = {
      key: 'Cross-Origin-Opener-Policy',
      value: 'same-origin-allow-popups',
    };
    return [
      {
        source: '/:path*',
        headers: [coop],
      },
      {
        source: '/robots.txt',
        headers: [cache],
      },
      {
        source: '/favicon.ico',
        headers: [iconCache],
      },
      {
        source: '/favicon-96x96.png',
        headers: [iconCache],
      },
      {
        source: '/apple-touch-icon.png',
        headers: [iconCache],
      },
      {
        source: '/web-app-manifest-:size.png',
        headers: [iconCache],
      },
      {
        source: '/sitemap.xml',
        headers: [cache, indexable],
      },
      {
        source: '/llms.txt',
        headers: [cache, indexable],
      },
      {
        source: '/llms-full.txt',
        headers: [cache, indexable],
      },
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
