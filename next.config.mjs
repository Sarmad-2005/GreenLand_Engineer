/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep sharp's native binary out of the bundle so it loads from node_modules
  // at runtime on Vercel serverless (fixes "Failed to load external module sharp").
  serverExternalPackages: ['sharp'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
}

export default nextConfig
