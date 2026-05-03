# Supernova

Personalized daily numerology PWA for Southeast Asia. Bahasa Indonesia + English.

## Stack
- Next.js 14 App Router, TypeScript strict
- Tailwind + shadcn/ui
- Prisma + Postgres + Prisma Accelerate
- Better Auth (magic link) + Resend
- Anthropic Claude (Sonnet 4.6)
- next-intl, Zustand, react-hook-form + zod
- AES-256-GCM for PII at rest
- next-pwa + web-push

## Setup

```bash
pnpm install
cp .env.example .env.local
# Fill in DATABASE_URL, BETTER_AUTH_SECRET, RESEND_API_KEY, DATA_ENCRYPTION_KEY, ANTHROPIC_API_KEY
pnpm dev
```

Generate `BETTER_AUTH_SECRET` and `DATA_ENCRYPTION_KEY`:

```bash
openssl rand -base64 32
```

## Scripts

- `pnpm dev` — Next dev server
- `pnpm build` — production build
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — ESLint
- `pnpm test` — Vitest (numerology + patterns)

## Roadmap

See `/root/.claude/plans/supernova-numerology-mighty-crescent.md` for the full milestone plan
(M0 setup → M9 polish).

## Email delivery in MVP

This app currently uses the Resend sandbox sender (`onboarding@resend.dev`). Magic links will
only deliver to the email address that owns the Resend account until a real sending domain is
verified. Plan to swap to a verified domain before public launch.
