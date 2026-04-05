/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'covers.openlibrary.org' },
      { protocol: 'https', hostname: 'images.isbndb.com' },
      { protocol: 'https', hostname: 'books.google.com' },
    ],
  },
};

export default nextConfig;
