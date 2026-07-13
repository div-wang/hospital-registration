import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.GITHUB_ACTIONS ? "export" : undefined,
  basePath: process.env.GITHUB_ACTIONS ? "/hospital-registration" : "",
  assetPrefix: process.env.GITHUB_ACTIONS ? "/hospital-registration/" : "",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
