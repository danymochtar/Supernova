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
  // Long session + cookie cache so PWA homescreen launches don't feel like a fresh login.
  session: {
    expiresIn: 60 * 60 * 24 * 60,
    updateAge: 60 * 60 * 24 * 7,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
});

export type Auth = typeof auth;
