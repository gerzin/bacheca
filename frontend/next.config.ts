import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Docker production builds
  output: "standalone",
};

export default nextConfig;
