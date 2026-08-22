import type { NextConfig } from "next";

if (process.env.NODE_ENV === 'development') {
  import('@cloudflare/next-on-pages/next-dev').then(({ setupDevPlatform }) => {
    setupDevPlatform();
  }).catch(console.error);
}

const nextConfig: NextConfig = {
  transpilePackages: ["tesseract.js"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Handle tesseract.js worker files
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: "worker-loader" },
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
