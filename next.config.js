/** @type {import('next').NextConfig} */
const nextConfig = {
    // Note: Static export disabled to support dynamic API routes for transcription
    // output: 'export',
    reactStrictMode: true,
    swcMinify: true,
    images: {
        unoptimized: true,
    },
    trailingSlash: true,
}

module.exports = nextConfig
