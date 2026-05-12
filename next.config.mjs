import createNextIntlPlugin from 'next-intl/plugin';
import nextPwa from 'next-pwa';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

const withPWA = nextPwa({
  dest: 'public',
  disable: process.env.NODE_ENV !== 'production',
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: ({ request, url }) =>
        url.origin === self.location.origin && request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supernova-pages',
        networkTimeoutSeconds: 4,
        expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\/_next\/static\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'supernova-static',
        expiration: { maxEntries: 128, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\/icons\/.*\.(?:png|svg)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'supernova-icons',
        expiration: { maxEntries: 32, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|webp|gif|svg)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'supernova-images',
        expiration: { maxEntries: 64, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\/api\/.*/,
      handler: 'NetworkOnly',
    },
  ],
});

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

export default withPWA(withNextIntl(nextConfig));
