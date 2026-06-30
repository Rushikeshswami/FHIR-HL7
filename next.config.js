/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // This tells Next.js to make static files for GitHub
  images: {
    unoptimized: true, // This is required for static exports
  },
};

module.exports = nextConfig;
