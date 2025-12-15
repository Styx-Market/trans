/** @type {import('next').NextConfig} */
const nextConfig = {
    // Removed static export to support dynamic routes
    reactStrictMode: true,
    swcMinify: true,
    images: {
        unoptimized: true,
    },
}

module.exports = nextConfig
