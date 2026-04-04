/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'covers.openlibrary.org' },
      { protocol: 'https', hostname: 'images.isbndb.com' },
    ],
  },
  env: {
    API_URL: process.env.API_URL ?? 'http://localhost:3000',
  },
};

export default nextConfig;
