import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Allow Next.js <Image> to serve files from the local public/ folder
    // and any future external hosts without domain errors.
    remotePatterns: [],
    // Treat all /images/** paths under public/ as local — no domain required.
    // In production we'll serve thumbnails from an API route outside `public`,
    // so disable the Image Optimization pipeline to avoid re-fetching/encoding.
    unoptimized: true,
  },
};

export default nextConfig;
