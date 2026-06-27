/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint is useful in dev, but we do not want stray lint warnings to block the
  // production build for this educational project. Type errors still fail the build.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
