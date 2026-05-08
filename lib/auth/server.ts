import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@/lib/db/prisma';

const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
const vercelProjectUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : null;

const baseURL =
  process.env.BETTER_AUTH_URL ?? vercelProjectUrl ?? vercelUrl ?? 'http://localhost:3000';

// Trust the configured baseURL plus common dev hosts and any Vercel-injected
// URL (preview deploys get a unique vercelUrl per build).
const trustedOrigins = Array.from(
  new Set(
    [
      baseURL,
      vercelUrl,
      vercelProjectUrl,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) ?? []),
    ].filter((s): s is string => Boolean(s)),
  ),
);

export const auth = betterAuth({
  appName: 'Supernova',
  baseURL,
  trustedOrigins,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false,
  },
  // PWA homescreen launches feel like a fresh app every time, so the
  // default 7-day session was logging users out far too often. Extend
  // the session to 60 days, refresh it whenever the user comes back
  // after >7 days, and turn on the in-cookie session cache so the
  // common path (already-signed-in user reopens the app) doesn't even
  // need to hit the database.
  session: {
    expiresIn: 60 * 60 * 24 * 60, // 60 days
    updateAge: 60 * 60 * 24 * 7, // sliding refresh every 7 days
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes — short enough that revoke takes effect quickly
    },
  },
});

export type Auth = typeof auth;
