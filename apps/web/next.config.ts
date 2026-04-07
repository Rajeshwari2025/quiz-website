import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@quiz/shared", "@quiz/ui"],
};

export default nextConfig;

