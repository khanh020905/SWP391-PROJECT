import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      // Cloudflare R2 bucket serving book covers / media for the ported reading pages
      { protocol: "https", hostname: "pub-c71988294a9b45099e83dad66bb73426.r2.dev" },
    ],
  },
  async redirects() {
    return [
      {
        source: '/:locale/roadmap/diagnostic-test',
        destination: '/:locale/orientation',
        permanent: true,
      },
      {
        source: '/roadmap/diagnostic-test',
        destination: '/orientation',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
