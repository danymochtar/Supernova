import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { magicLink } from 'better-auth/plugins';
import { prisma } from '@/lib/db/prisma';
import { sendMagicLinkEmail } from '@/lib/email/resend';
import { isLocale, type Locale } from '@/lib/i18n/config';

function pickLocaleFromUrl(url: string): Locale {
  try {
    const parsed = new URL(url);
    const seg = parsed.pathname.split('/').filter(Boolean)[0] ?? '';
    return isLocale(seg) ? seg : 'id';
  } catch {
    return 'id';
  }
}

export const auth = betterAuth({
  appName: 'Supernova',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  // Email + password disabled — magic link is the only auth method.
  emailAndPassword: { enabled: false },
  plugins: [
    magicLink({
      expiresIn: 60 * 10, // 10 minutes
      sendMagicLink: async ({ email, url }) => {
        try {
          await sendMagicLinkEmail({
            to: email,
            url,
            locale: pickLocaleFromUrl(url),
          });
        } catch (err) {
          console.error('[auth] sendMagicLink failed', { email, err });
          throw err;
        }
      },
    }),
  ],
});

export type Auth = typeof auth;
