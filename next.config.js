/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb'
    },
    serverComponentsExternalPackages: ['payload', '@payloadcms/db-postgres']
  }
};

export default nextConfig;