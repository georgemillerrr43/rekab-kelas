/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Mengizinkan file uploads diakses secara publik
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
