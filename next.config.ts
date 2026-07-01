import type { NextConfig } from "next";

const siteDomain = process.env.NEXT_PUBLIC_SITE_DOMAIN;

const nextConfig: NextConfig = {
  output: "export",
   trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      ...(siteDomain
        ? [
            {
              protocol: "https" as const,
              hostname: siteDomain,
            },
            {
              protocol: "http" as const,
              hostname: siteDomain,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
