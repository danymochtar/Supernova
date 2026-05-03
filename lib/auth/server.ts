import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@/lib/db/prisma';

const baseURL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';

// Accept both localhost and 127.0.0.1 in dev so the browser's chosen host
// always matches Better Auth's CSRF check.
const trustedOrigins = Array.from(
  new Set([
    baseURL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) ?? []),
  ]),
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
});

export type Auth = typeof auth;
