import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['tesseract.js'],
  webpack: (config, { isServer }) => {
    // Handle tesseract.js worker files
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: 'worker-loader' }
    });

    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    return config;
  },
};

export default nextConfig;
