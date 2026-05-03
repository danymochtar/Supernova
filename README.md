# Supernova

Personalized daily numerology PWA for Southeast Asia. Bahasa Indonesia + English.

## Stack
- Next.js 14 App Router, TypeScript strict, mobile-first
- Tailwind, lucide-react icons
- Prisma ORM on Postgres (single `DATABASE_URL`)
- Better Auth (email + password)
- Anthropic Claude (Sonnet 4.6) for daily reading, About Me synthesis,
  Q&A chat (streaming, Node runtime), and conversation rollups
- next-intl, react-hook-form + zod
- PWA: manifest + theme color + icons (offline service worker deferred)

## Setup

```bash
pnpm install
cp .env.example .env.local
# Fill in DATABASE_URL, BETTER_AUTH_SECRET, ANTHROPIC_API_KEY
# Optional: RESEND_API_KEY (M7 weekly recap), ADMIN_EMAILS (M9 admin)
pnpm prisma migrate deploy   # apply existing migrations to your DB
pnpm dev
```

Generate `BETTER_AUTH_SECRET`:

```bash
openssl rand -base64 32
```

For first-time DB bootstrap from a fresh Postgres, the migrations in
`prisma/migrations/` are pre-checked — `migrate deploy` will apply them
in order. There is no shadow DB requirement; new schema changes go in
as hand-authored SQL alongside `schema.prisma` updates.

## Scripts

- `pnpm dev` — Next dev server
- `pnpm build` — production build (runs `prisma generate` + `prisma migrate deploy` + `next build`)
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — ESLint
- `pnpm test` — Vitest (numerology engine + pattern aggregation)

## Architecture map

```
app/[locale]/
  page.tsx              landing
  (auth)
    login/page.tsx      sign in / sign up (Better Auth)
    welcome/            first-time onboarding (firstName/middleName/lastName + DOB + tz)
  (app)                 — gated by BottomNav presence; not a route group, just a logical grouping
    dashboard/          home tab: greeting + daily reading + about me + cycles + cards
    journey/            year forecast + life chapters
    ask/                Curhat / Chat — streaming Claude with hierarchical history
    people/             list + add + detail + edit + compatibility
    patterns/           rating distribution by PD / weekday / tag (≥14-day gate)
    me/                 settings hub: profile, locale switch, sign out, admin link
    profile/edit/       edit profile (deep change → wipes NumerologyCache)
    admin/usage/        env-allowlisted ($ADMIN_EMAILS) AI usage breakdown
  api/
    auth/[...all]       Better Auth handler
    qa/stream           Node-runtime SSE-ish ndjson streaming for chat
lib/
  numerology/           pure deterministic engine (LP/Expression/SU/Personality/Birthday,
                        pinnacles/challenges/cycles, personal year/month/day, Y-vowel,
                        karmic debt detection, ageAt)
  ai/                   prompts (daily, qa, conversation, aboutMe, rollup) + client + cost
  conversation/         smart context loader + hierarchical rollup (DAILY/WEEKLY/MONTHLY)
  compatibility/        score + cross-component pattern detection
  patterns/             feedback aggregation
  db/repositories/      Prisma-backed view layer
content/
  meanings/             curated number meanings per type × digit (LP, Expression, etc.)
  compatibility/        LP×LP narrative pack (45 unique pairs per locale)
```

## Operator runbook

### Rotating the Anthropic API key
1. Issue a new key in console.anthropic.com.
2. Update `ANTHROPIC_API_KEY` on Vercel (Production env) → redeploy.
3. Revoke the old key after the redeploy reports healthy.

The SDK client is constructed lazily, so rotating doesn't require any
code change — only env. If you change `ANTHROPIC_MODEL`, the next AI
call picks it up.

### Updating prompts
Prompt templates live in `lib/ai/prompts/`:
- `daily.ts` — 4-section daily reading
- `qa.ts` — legacy single-shot Q&A (no longer routed; left in place)
- `conversation.ts` — chat / curhat system prompt with language-mirror rule
- `aboutMe.ts` — one-shot profile synthesis
- `rollup.ts` — daily/weekly/monthly summarization

After editing, deploy. Cached `aboutMe-v2` rows in `NumerologyCache` will
NOT auto-regenerate — bump the cache key (e.g. `aboutMe-v3`) in
`lib/ai/aboutMe.ts` to force fresh generations across all users.

### Model routing & cost
Each AI surface picks its model via `model(feature)` in `lib/ai/client.ts`:

| Surface              | Default model         | Why                                              |
|----------------------|-----------------------|--------------------------------------------------|
| Chat (`/api/qa/stream`) | `claude-sonnet-4-6` | High quality — most-used user-facing feature     |
| Daily reading        | `claude-sonnet-4-6`   | User reads it every day; nuance + warm voice     |
| About Me synthesis   | `claude-sonnet-4-6`   | Anchors user identity on dashboard               |
| Daily/weekly/monthly rollup | `claude-haiku-4-5` | Internal; just compresses turns into context     |

Override either default via env: `ANTHROPIC_MODEL` (user-facing) or
`ANTHROPIC_ROLLUP_MODEL` (rollups). Prompt caching is enabled on the
chat path — both the system prompt and the per-turn smart-context
block carry `cache_control: ephemeral`, so subsequent messages within
the 5-min window pay ~10% input cost on the cached prefix. Inspect
`AiUsage` rows or `/admin/usage` to verify cache hit rate via the
`cache_read_input_tokens` field.

### Updating the meanings or compatibility packs
JSON files in `content/meanings/{id,en}.json` and
`content/compatibility/{id,en}.json` are imported at build time. Edit
and redeploy — no migration needed.

To extend Person numbers (Expression, Soul Urge, Personality, Birthday)
with type-specific narratives in compatibility, add a new key prefix to
the lookup function in `lib/compatibility/lookup.ts`.

### Adding admin users
Set `ADMIN_EMAILS` to a comma-separated list of emails (case-insensitive
match on the user's signed-in email). Admin-only `/admin/usage` is then
visible from the Me tab for those users.

### Adding a Person field
1. Edit `prisma/schema.prisma`.
2. Hand-author migration SQL under `prisma/migrations/<timestamp>_<name>/migration.sql`.
3. Update `lib/db/repositories/person.ts` (input + view shape).
4. Update Add/Edit Person form + the actions schema in
   `app/[locale]/people/actions.ts`.
5. `pnpm prisma generate && pnpm typecheck`. Vercel build applies the
   migration.

## PWA

Manifest at `/public/manifest.json` with both the source SVG and pre-
rendered PNGs (192, 512, maskable 512, plus an iOS apple-touch-icon at
180). Installable on Android Chrome, desktop Chrome, and iOS Safari
("Add to Home Screen") out of the box.

PNG variants are rendered from `public/icons/icon.svg` via `@resvg/
resvg-js`:

```sh
pnpm icons:gen   # writes icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
```

Run after editing the SVG and commit the resulting PNGs.

Service-worker offline caching is deferred. The cached `last DailyReading`
+ static profile shell is the minimum useful offline read; can be added
without schema changes.

## Auth

Email + password via Better Auth. Min password length 8. Sign-up auto-
signs the user in and routes to onboarding. The Better Auth secret is
the only auth-critical env — rotate per the standard secret rotation
procedure.

Resend is wired up but not on the auth path — reserved for M7 weekly
recap emails.

## Numerology engine notes

The engine in `lib/numerology/` is fully pure and tested. Conventions:
- Master numbers 11/22/33 are preserved through reductions where the
  Decoz convention preserves them; reduced single-digit form is used
  in age-boundary math (e.g. Pinnacle 1 ends at `max(27, 36 - reducedLP)`).
- Karmic debt 13/14/16/19 is detected on every compound — surfaces as
  a small badge + tooltip on `<CompoundReduced>`.
- Personal Year resets on Jan 1 in the user's timezone. Personal Month
  and Day cascade from PY.
- Y-as-vowel uses a position-based heuristic plus an explicit override
  table (`yVowelOverrides.ts`) seeded with names where the heuristic is
  known to be wrong (Mary, Yvonne, Bryan, Lynn, Tyrone, etc.).

100+ vitest cases cover the full engine + pattern aggregation. Add a
fixture in `tests/fixtures/profiles.ts` whenever introducing a new
calculation rule.
