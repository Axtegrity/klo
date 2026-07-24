# KLO App — Project Context for Claude Code

## Overview
Keith L. Odom's leadership assessment and advisory platform. SaaS app with AI coaching, 4 assessments, content vault, strategy rooms, conference/events, and subscription gating. Deployed as web app and native iOS/Android via Capacitor.

**Client project — never push directly to `main`.**
**Package manager: `bun` — never use `npm install`.**

## Stack
- **Framework**: Next.js 16 (App Router), React 19
- **Auth**: NextAuth v4 — credentials-only, JWT strategy, role-based (`owner` / `admin` / `moderator` / `subscriber` / `free`)
- **Database**: Supabase (`@supabase/supabase-js` direct client — NOT `@supabase/ssr`)
- **Styling**: Tailwind CSS v4 — mobile-first, clamp() typography, 40px+ touch targets
- **Animation**: Framer Motion
- **Payments**: Stripe
- **Email**: Resend
- **Rate limiting**: Upstash Redis + `@upstash/ratelimit`
- **Error tracking**: Sentry (`@sentry/nextjs`)
- **Documents**: pdf-lib, docx, pptxgenjs
- **Testing**: Playwright (ESM-only — use `.mjs` test files)
- **Mobile**: Capacitor 8 (iOS + Android), biometric auth via `@capgo/capacitor-native-biometric`

## CRITICAL — Never Add shadcn/ui
All UI components are custom-built. Never install or reference shadcn/ui.
Custom components live in `src/components/shared/`:
`AccessibleIcon`, `AnimatedImage`, `Badge`, `Button`, `Card`, `FadeInOnScroll`, `JsonLd`, `Modal`, `PricingCard`, `SubscriptionGate`, `UpgradeBanner`, `UpgradePrompt`

## Directory Structure
```
src/
  app/                    # Next.js App Router pages + API routes
    api/
      admin/              # Admin stats, users, activity
      ai-advisor/         # Claude streaming AI chat
      assessments/        # Scoring, PDF generation
      auth/               # NextAuth [...nextauth] handler
      conference/         # Event management
      stripe/             # Webhooks, checkout, portal
      subscription/       # Tier management
      push/               # Web push notifications
      maven/              # Internal diagnostics
    admin/                # Admin dashboard (role-gated)
    advisor/              # AI chat interface
    assessments/          # 4 assessment flows
    booking/              # Scheduling
    consult/              # Consultation pages
    events/               # Conference/live events
    feed/                 # Content feed
    marketplace/          # Resource marketplace
    strategy-rooms/       # Collaborative strategy sessions
    vault/                # Content vault (subscription-gated)
  components/
    shared/               # ONLY custom components — no shadcn
    layout/               # TopNav, Footer, sidebar wrappers
    home/                 # Landing page sections
    advisor/              # AI chat UI
    assessments/          # Assessment UI
    booking/              # Booking forms
    consult/              # Consult UI
    vault/                # Vault UI
  lib/
    auth.ts               # NextAuth authOptions + CREDENTIAL_ACCOUNTS
    supabase.ts           # Supabase client factory + DB type interfaces
    claude.ts             # Anthropic client wrapper
    stripe.ts             # Stripe client + helpers
    ratelimit.ts          # Upstash rate limiter
    email.ts              # Resend email helpers
    validation.ts         # Shared Zod schemas
    constants.ts          # App-wide constants
    haptics.ts            # Capacitor haptics wrapper
    push-notifications.ts # Capacitor push wrapper
    network-status.ts     # Capacitor network wrapper
  hooks/                  # Custom React hooks
  types/                  # Shared TypeScript interfaces
  features/               # Feature-specific logic modules
```

## Build & Dev Commands
```bash
bun run dev          # Start dev server
bun run build        # Production build (run before every PR)
bun run type-check   # tsc --noEmit (must pass clean)
bun run lint         # ESLint
bun run ci           # type-check + build combined
bun run cap:sync     # Sync web build to Capacitor native
bun run cap:open:ios     # Open in Xcode
bun run cap:open:android # Open in Android Studio
bun run test:e2e     # Playwright tests
```

## Environment Variables (names only — values in .env.local or Vercel)
```
NEXTAUTH_SECRET
NEXTAUTH_URL
OWNER_EMAIL / OWNER_PASSWORD
ADMIN_EMAIL / ADMIN_PASSWORD
MODERATOR_EMAIL / MODERATOR_PASSWORD
TEST1_EMAIL / TEST1_PASSWORD
TEST2_EMAIL / TEST2_PASSWORD
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DEV_SUPABASE_URL                 # optional — URL of dev Supabase project; when set and matched, guard allows writes
ALLOW_PROD_MUTATIONS             # optional — set to "1" for a session to bypass the prod-write guard (escape hatch)
ANTHROPIC_API_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
NEXT_PUBLIC_APP_URL
WEB_PUSH_PUBLIC_KEY
WEB_PUSH_PRIVATE_KEY
WEB_PUSH_CONTACT
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY               # service account private key; literal \n sequences are converted to real newlines in code
SENTRY_ORG
SENTRY_PROJECT
SENTRY_AUTH_TOKEN
NEXT_PUBLIC_SENTRY_DSN
CRON_SECRET                      # shared bearer secret for Vercel Cron routes (sync-events, auto-end-sessions)
```

## Auth Setup
- Provider: `CredentialsProvider` only (no OAuth)
- Strategy: JWT
- Roles: `owner`, `admin`, `moderator`, `subscriber`, `free`
- Accounts: hardcoded credential accounts in `src/lib/auth.ts` — passwords from env vars, bcrypt-hashed
- Session includes `role` — check it server-side on every protected route
- `getServerSession(authOptions)` for server components and API routes
- Sign-in page: `/auth/signin`

## Database (Supabase)
- Client: `@supabase/supabase-js` direct (NOT `@supabase/ssr`)
- Factories in `src/lib/supabase.ts`: `getSupabase()` (anon) + `getServiceSupabase()` (service role for server-side writes)
- RLS enabled on all tables — always include user_id filter on top of RLS
- Migrations in `supabase/migrations/` — additive only, never ALTER/DROP in production
- Key type interfaces exported from `src/lib/supabase.ts`: `Profile`, `AssessmentResult`, `VaultContent`, etc.
- **Prod project ref**: `yrztblvazkrzxgztfzzn` | **Dev project ref**: `ykregzbladhwzyagkkdf`
- **CLI must stay linked to prod as the default state** (`supabase/.temp/project-ref` should read `yrztblvazkrzxgztfzzn`). If a session needs to check dev, relink and then relink back to prod before ending — do not leave the CLI silently pointed at dev.

### Migration Discipline (MANDATORY — origin: 2026-07-08 reconciliation, PR #206)
The CLI was found silently linked to dev for weeks, causing 12 local migration filenames to drift from prod's actual applied version strings and 7 migrations to be applied directly to prod (dashboard/MCP) with no local file ever committed. `supabase db push` was completely broken for this repo until a full reconciliation.
1. Every schema change starts as a local migration file first — commit it before it ever touches prod.
2. `supabase db push` through Toya is the only approved path to prod. No direct dashboard SQL editor or MCP `apply_migration`/`execute_sql` DDL writes to prod except declared emergencies (logged, Tier-3 approved).
3. If a migration is ever applied outside the CLI path (emergency), immediately commit a matching local file with the exact prod-assigned version string — don't let drift accumulate.

## API Route Conventions
Every API route must:
1. Check session with `getServerSession(authOptions)` — return 401 if missing
2. Validate body with Zod `safeParse` — return 400 with `details` on failure
3. Use `getServiceSupabase()` for writes, `getSupabase()` for reads
4. Never interpolate user input into queries
5. Log errors with route context: `console.error('[POST /api/route]', error)`

### File uploads must never send the file body through a Next.js API route
Vercel serverless functions cap request bodies at ~4.5MB. A route handler's own
size check (e.g. "max 50MB") never runs if Vercel rejects the request first —
the client gets a non-JSON error page it can't parse, which surfaces as a
generic "Upload failed" with no useful detail. This bit us in
`/api/admin/events/[id]/files` (PR #203, 2026-07-06): files under ~4MB worked,
anything bigger silently failed.

Pattern to follow for any new upload feature (see `sign-upload/route.ts` +
`SessionFiles.tsx` for the reference implementation):
1. Client requests a signed Supabase Storage upload URL from a small JSON
   endpoint (`fileName`, `fileSize` in the body — validate size/ext here).
2. Browser uploads the file directly to Supabase Storage using that signed
   URL (`supabase.storage.from(bucket).uploadToSignedUrl(path, token, file)`),
   bypassing the Vercel function entirely.
3. Client POSTs small JSON metadata (`filePath`, `fileName`, `fileSizeBytes`)
   to record the DB row — server re-validates and confirms the file landed in
   storage via `.storage.from(bucket).list()` before inserting.

## Security Headers
All security headers are set in `next.config.ts` via `headers()`:
CSP, HSTS, X-Frame-Options (SAMEORIGIN), X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
Sentry wrapped via `withSentryConfig`. Do not remove or weaken these.

## Mobile (Capacitor)
- Run `bun run cap:sync` after every build before testing on device
- Capacitor plugins available: push notifications, biometric auth, haptics, keyboard, network, share, splash screen, status bar, screen orientation, browser
- Native-specific logic goes in `src/lib/` helpers (haptics, push-notifications, network-status, biometric-auth)
- CSP in next.config.ts includes `capacitor:` in `frame-ancestors` — keep it

## Deployment
- **Platform**: Vercel (`tim-adams-projects-6c46d12d/klo-app`)
- **URLs**: https://klo-app.vercel.app | https://app.keithlodom.io (awaiting DNS CNAME in GoDaddy)
- **Branch**: `main` — never push directly; use `feature/`, `fix/`, `chore/` branches + PR
- **GitHub**: github.com/Axtegrity/klo

## Testing

### PR Merge Gate — Both Seats Required (MANDATORY)
Before merging ANY PR that touches attendee-facing features (polls, Q&A, conference page, events page, voting, real-time):

1. Post the Vercel preview URL with two checklists — admin steps and attendee steps
2. Explicitly ask Tim: "Have you tested from both the admin seat and the attendee seat?"
3. **Do NOT merge until Tim confirms both.** If no answer, block the merge:
   > "We haven't confirmed the attendee experience yet. If we merge now, Keith's audience discovers the bug before we do. Test on the preview URL first."
4. If Tim explicitly overrides, log it and merge — but state the risk clearly first.

**Why:** The polling deploy bug (2026-06-11) shipped because we only tested the admin UI. The attendee vote flow was broken in production. Keith's audience found it before we did.

### General Testing Rules
- Playwright for E2E — test files must be `.mjs` (ESM-only project)
- Accessibility: `@axe-core/playwright` is installed — use it in E2E for a11y checks
- Write tests for: auth flows, API route validation, subscription gating logic
- Skip tests for: pure Tailwind styling, static pages

## UI Testing & Deployment Verification

### Before any test prompt is sent to Toya or any QA agent:

1. **Always include the HEAD SHA** in the test prompt.
   Get it with: git rev-parse --short HEAD
   Add to the prompt: "Confirm deployed SHA matches: {SHA} before testing."

2. **Toya must verify SHA before running any checklist.**
   If the Vercel deployment SHA does not match, she reports "build stale"
   and waits. She does not test against a stale build under any circumstance.

3. **Never declare a feature verified without a SHA match.**
   Type-check and lint passing prove the code compiles. They do not prove
   the feature works. A verified feature requires:
   - SHA match on Vercel preview
   - Functional checklist completed by Toya or equivalent QA agent
   - Pass/fail reported for every checklist item

4. **Force-push updates the branch but not instantly the preview.**
   After any force-push, wait for Vercel to finish building before
   sending a test prompt. Check Vercel dashboard for build status.
   Typical build time: 2–4 minutes.

5. **PR #s are not enough — always reference the branch name and SHA.**
   Vercel previews are keyed to branch names. The same URL serves
   different code at different times. SHA is the only reliable identifier.

### Test prompt template (use this every time):

```
BEFORE TESTING — verify build:
Branch: {branch-name}
Expected SHA: {git rev-parse --short HEAD}
Vercel preview URL: {url}

Go to Vercel dashboard → confirm deployed SHA matches expected SHA.
If mismatch: report "build stale, waiting" — do not proceed.

CHECKLIST:
[items here]

For each item report: PASS, FAIL, or BLOCKED (with reason).
```

## Change Protocol

### Training must be updated with every UI change.

Any commit that changes a user-facing workflow, adds a new UI element, renames a feature, or changes where a button or action lives MUST include a corresponding update to the training page at `src/app/admin/training/page.tsx`.

This is not optional. If the code changes how Keith uses the app, the training changes too — in the same PR, same commit if possible.

After any change to src/app/admin/training/page.tsx, always run both bun run lint AND bun run type-check before committing. The training file has strict TypeScript types — lint alone will not catch type errors.

Examples of changes that require training updates:
- New feature added (setup strip, war room tabs, access code toggle)
- Workflow step added, removed, or reordered
- Button or action moved to a different location
- Feature renamed (e.g. CSV → PDF, Sessions → Live Sessions)
- New page or route that Keith or his team will use

Examples that do NOT require training updates:
- Bug fixes with no UX change
- Performance improvements
- Internal refactors
- CHANGELOG updates
- Dev tooling changes

## Key Conventions
- Path alias: `@/` maps to `src/`
- Import order: external packages → `@/lib` → `@/components` → `@/types`
- All props interfaces — no `any` types, no `@ts-ignore`
- `as const` for enum-like literals
- Subscription gating: use `<SubscriptionGate>` component, check `session.user.role` server-side
- Feature flags/constants in `src/lib/constants.ts`
- No `dangerouslySetInnerHTML` with unsanitized content
- Playwright tests deprecated path: `~/Developer/keithodom-web` — ignore it, use `~/klo-app` only
