import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/todos",
        destination: "/productivity?tab=todos",
        permanent: true,
      },
      {
        source: "/notes",
        destination: "/productivity?tab=notes",
        permanent: true,
      },
      {
        source: "/calendar",
        destination: "/productivity?tab=calendar",
        permanent: true,
      },
      {
        source: "/baby",
        destination: "/health",
        permanent: true,
      },
      {
        source: "/baby/:path*",
        destination: "/health",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
