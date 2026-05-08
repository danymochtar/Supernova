import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // 10mb covers résumé PDF uploads (typically <5mb). The limit is
      // per-request so other server actions are unaffected.
      bodySizeLimit: '10mb',
    },
  },
};

export default withNextIntl(nextConfig);
