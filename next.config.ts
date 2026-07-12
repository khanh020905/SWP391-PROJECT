import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
