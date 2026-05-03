# Supernova

Personalized daily numerology PWA for Southeast Asia. Bahasa Indonesia + English.

## Stack
- Next.js 14 App Router, TypeScript strict
- Tailwind + shadcn/ui
- Prisma ORM on Postgres (single `DATABASE_URL`)
- Better Auth (email + password)
- Anthropic Claude (Sonnet 4.6)
- next-intl, Zustand, react-hook-form + zod
- next-pwa + web-push

## Setup

```bash
pnpm install
cp .env.example .env.local
# Fill in DATABASE_URL, BETTER_AUTH_SECRET, ANTHROPIC_API_KEY
# (RESEND_API_KEY only needed for M7+)
pnpm prisma migrate dev --name init
pnpm dev
```

Generate `BETTER_AUTH_SECRET`:

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

## Auth

Email + password via Better Auth. Min password length 8. Sign-up auto-signs the user in
and sends them straight to onboarding (`/[locale]/welcome`).

Resend is wired up but not on the auth path — it's reserved for M7 weekly recap emails.
