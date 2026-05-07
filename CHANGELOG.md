# Changelog — KLO App (keithlodom.ai)

All notable changes to the KLO platform. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

---

## [2026-05-07] — Admin Feedback & QA Standards

### Added
- **Admin save toasts** — every section save in the admin CMS now shows a success toast ("Saved — changes are live") or an error toast with the failure reason. Admins always know if an action worked.
- **Admin QA flows** — `.forensic-qa.json` now includes 5 authenticated admin tests: login, CMS page loads, sections visible, edit modal opens, upload route responds. Quill now catches broken admin saves before they reach Keith.
- **Toast system** (`ToastContext`) — lightweight global toast provider (no third-party library); success = KLO cyan, error = red; auto-dismisses after 4 s.

---

## [2026-05-06] — Document Viewer

### Added
- **Paginated Word doc viewer** — documents split into ~5 pages with Previous/Next navigation, animated dot indicators, and page counter ("2 / 5"). Content fades on page change; card scrolls to top automatically.
- **In-app document viewer** (`/documents/view`) — Word docs render as HTML (via `mammoth`) on a cream paper card floating on the dark KLO background. PDFs open in a native iframe. Unsupported formats show a download fallback.
- **Document viewer toolbar** — Back link, file-type badge, filename, Download button.
- **KLO brand accent stripe** on paper card (blue → cyan gradient).
- **`.klo-doc-body` CSS** — light-mode prose typography: near-black text, 1.85 line-height, styled headings, blockquotes, tables.

### Fixed
- **Admin document upload** — uploading a file in "Latest Intelligence Brief" now saves to Supabase Storage and auto-populates the "Read More" link with the in-app viewer URL.
- **All home sections wired to Supabase** — Latest Intelligence Brief, Trending Topics, Featured Insight, AI Tool of the Week, Quick Assessment CTA all persist changes via the admin CMS. Previously all sections had hardcoded mock data.
- **Word doc mammoth conversion** — resolved `@xmldom/xmldom` 0.9.x incompatibility (pinned to 0.8.13) that caused `DOMParser.parseFromString` failures and silent fallback to "Preview not available".
- **CSP `frame-src`** — expanded to include `*.supabase.co` so PDF iframes render correctly.

---

## [2026-04-24] — Push Notifications

### Added
- **In-app push opt-in pre-prompt** — soft permission request shown before the browser native dialog, on both web and native (Capacitor). Respects previous decisions; forces re-ask on app update.

---

## [2026-04-20] — Admin Broadcast

### Added
- **Admin broadcast notifications** — admin can send a push notification + email fallback to every registered user from the admin dashboard.

---

## [2026-04-15] — CI/CD & QA Infrastructure

### Added
- **Vercel Preview Deploys on every PR** — every pull request gets a preview URL before merge.
- **Flow QA manifest** (`.maven/flow-qa.yaml`) — fleet-wide user-flow QA spec seeded.

### Fixed
- **CI lint** — all lint warnings cleared; `bun run lint` wired into CI gate.

---

## [2026-04-14] — Events Spotlight

### Added
- **Events spotlight system** — countdown timer, session listing, per-section visibility toggles (show/hide heading, countdown, sessions independently).
- **Per-element visibility controls** on the spotlight card.

### Fixed
- **Mobile nav Admin item** — tappable on iPhone with proper 44px+ touch targets.
- **Spotlight event name** — always shows even when session subtitle is present.
- **Spotlight Save button** — always enabled; manual mode with no event picked shows a loud warning before save.

---

## [2026-04-13] — Home Page Editor

### Added
- **Visual click-to-edit home editor** at `/admin/edit` — non-technical admins can click any section on the live home page preview to open an inline editor.
- **Home-page images editable** from the admin interface without touching code.
- **EditorTopBar Exit button** with dirty-state guard — warns before discarding unsaved changes.

### Fixed
- `section_images` column added to DB; async testimonials load fixed; editor dead zone cleared.

---

## [2026-04-12] — Survey & Security

### Added
- **"Optional" pill** on non-required survey questions.
- **Journey-audit spec** and dev-seed.sql (`.maven/`).
- **Prod-write guard** — blocks accidental dev→prod Supabase mutations.

### Fixed
- **Survey Q19/27/28** replaced with single-select; Q31/Q32 optional fields added.
- **Q31/Q32 inserts** made idempotent.
- **Survey answers API** paginated to prevent timeout on large result sets.

---

## [2026-04-10] — CMS & Vault Fixes

### Added
- **Testimonials admin UI** — approve, edit quote, manage visibility.
- **Content visibility toggles** — hide/archive items without deleting.
- **Runtime feedback loop** + Function Audit tool.

### Fixed
- **Vault & Feed** — admin CMS writes now appear on the public site (removed ghost CMS pattern).
- **Marketing testimonials** — admin write connected to public read.
- **SAST workflow** — ESLint Security was failing on every commit; fixed.
- **Creative Studio crash** on parallax preset (missing transition).

---

## [2026-04-09] — Hero & Deployment

### Added
- **Vercel auto-deploy GitHub Action** — pushes to `main` deploy automatically.

### Changed
- **Hero slideshow** — crossfade between Keith's photos at 3-second intervals (was static).
- **Google Play Store badge** — activated as a live CTA link.

---

## [2026-04-07] — Survey Launch

### Added
- **Full survey system** — "AI in the Black Church" survey with 32 questions, AI-powered analysis, progress bar, OG metadata.
- **Auto-advance** on single-select answers.
- **Start Over CTA** in survey navigation.
- **Survey link** in top navigation.

### Fixed
- Atomic submission, input validation, rate limiting.
- Scroll-to-top on route change.

---

## [2026-04-02] — Security Hardening & Training

### Added
- **Security hardening** — rate limiting, MFA, JWT rotation, SAST scanning, structured logging.
- **Admin training guide** — video walkthrough (2:15) covering all 12 dashboard tabs, with professional voice narration and audio toggle.
- **Admin user management** — disable, delete, role changes via card layout UI.

### Fixed
- **CI switched to Bun** (was npm) — resolves lockfile mismatch on every build.

---

## [2026-03-06] — Admin Polish

### Added
- **Inquiries system** — DB-persisted inquiries table, admin Inquiries tab.

### Fixed
- **Poll file upload** — success/error feedback added.
- **Poll creation** — success/error feedback for single and batch creation.
- **Auth hardening** — env var passwords trimmed to prevent trailing-newline failures; dev-login removed.

---

## [2026-03-05] — Conference Engagement

### Added
- **Events page** — featured keynote with daily auto-sync cron.
- **Enhanced poll system** — queue/deploy workflow, file upload, batch creation, admin announcements.
- **Publish/unpublish toggle** for events.
- **Conference schedule admin** — sessions stored in DB (replaced hardcoded data).
- **QR lead magnet page** for engagement.
- **Consultation intake form** at `/consult`.
- **Vault: Event presentations** — admin-managed, shown on home page and vault.

### Changed
- **Vault content** — all items now public; hide/archive is authoritative (removed static seed merging).
- **AI chatbot** opened to all signed-in users (was subscriber-gated).
- **Post-assessment CTA** → Book A Consultation.

### Fixed
- **Conference scalability** hardened for 100+ concurrent users.
- **Word cloud** `voter_fingerprint` NOT NULL constraint fixed.
- **Tablet nav** breakpoint switched `md → lg`.
- **Mobile/tablet responsiveness** on conference and presentation views.

---

## [2026-03-04] — Conference V2

### Added
- **Conference V2** — multi-role system (owner/admin/moderator), live sessions, profanity filter, question likes, archive.
- **Conference Companion** — live polling, Q&A, word cloud.
- **Conference V2 user guide** (HTML, PPTX, PDF).

---

## [2026-03-02] — App Store & Mobile

### Added
- **Capacitor native wrapper** — iOS and Android platform support.
- **Mobile UI polish** — edge-to-edge fullscreen, safe area handling.
- **Generated app icons, splash screens, PWA icon assets**.
- **Playwright E2E tests** baseline.
- **App Store / Google Play badges** in footer.

### Changed
- **Version bumped to 1.0.0**.
- **CSP headers hardened** for app store submission.

---

## [2026-03-01] — Visual Redesign

### Added
- **Hybrid visual redesign** — keithodom-web color palette + Tony Robbins energy + real photos.
- **Animated images** — Ken Burns effect, fade-in on scroll, hover zoom.
- **Photo marquee** on `/consult` — edge-to-edge seamless scroll.
- **Admin analytics dashboard** with role-based access.

---

## [2026-03-01] — Platform Launch

### Added
- **Full KLO platform** built across 5 phases:
  - AI-powered advisory chat ("KLO Intelligence")
  - 4 leadership assessments with PDF/Word/PPT download
  - Content vault (subscription-gated)
  - Booking system
  - Admin dashboard (12 tabs)
- **Role-based auth** — owner / admin / moderator / subscriber / free
- **Stripe subscription** integration
- **Resend email** notifications
- **Supabase** database with RLS
- **Upstash Redis** rate limiting
- **Sentry** error tracking
