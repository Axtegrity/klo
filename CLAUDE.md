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
SENTRY_ORG
SENTRY_PROJECT
SENTRY_AUTH_TOKEN
NEXT_PUBLIC_SENTRY_DSN
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

## API Route Conventions
Every API route must:
1. Check session with `getServerSession(authOptions)` — return 401 if missing
2. Validate body with Zod `safeParse` — return 400 with `details` on failure
3. Use `getServiceSupabase()` for writes, `getSupabase()` for reads
4. Never interpolate user input into queries
5. Log errors with route context: `console.error('[POST /api/route]', error)`

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
- **GitHub**: github.com/timjeromeadams1109/klo

## Testing
- Playwright for E2E — test files must be `.mjs` (ESM-only project)
- Accessibility: `@axe-core/playwright` is installed — use it in E2E for a11y checks
- Write tests for: auth flows, API route validation, subscription gating logic
- Skip tests for: pure Tailwind styling, static pages

## Key Conventions
- Path alias: `@/` maps to `src/`
- Import order: external packages → `@/lib` → `@/components` → `@/types`
- All props interfaces — no `any` types, no `@ts-ignore`
- `as const` for enum-like literals
- Subscription gating: use `<SubscriptionGate>` component, check `session.user.role` server-side
- Feature flags/constants in `src/lib/constants.ts`
- No `dangerouslySetInnerHTML` with unsanitized content
- Playwright tests deprecated path: `~/Developer/keithodom-web` — ignore it, use `~/klo-app` only
