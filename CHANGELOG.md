# Changelog — KLO App (keithlodom.ai)

All notable changes to the KLO platform. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] — July 26, 2026 Session

### Changed
- **Content Automation: Preview button icon restyled** — the Draft Review Queue's Preview button eye icon is now larger (18px, up from 14px) and colored with the `klo-accent` token, giving it more visual weight relative to the Publish/Discard buttons. Label and click behavior unchanged.

## [Unreleased] — July 25, 2026 Session

### Added
- **Content Automation: Trusted Sources** — a new "Trusted Sources" tab lets admins maintain an allowlist of domains (e.g. `technologyreview.com`) the weekly/on-demand research call is restricted to. Seeded with 14 sources across AI & Ethics and Church & Tech. When at least one source is active, the web search behind draft generation only returns results from those domains; with zero active sources, generation behaves exactly as before (unrestricted). Add sources with an optional category tag, and toggle any source active/inactive without deleting it.
- **Content Automation: scheduled publishing** — each draft card (and the preview modal) now has an optional "Schedule publish" date/time picker. Setting a date and clicking "Schedule" moves the draft to a `scheduled` state, shown as a "Scheduled for [date]" badge with a "Cancel Schedule" option in place of the usual Publish/Discard buttons. A new hourly cron job checks for scheduled drafts whose time has passed and publishes them automatically, using the same publish logic as a manual review.
- **Content Automation: full-article preview modal** — each draft card in the Draft Review Queue now has a "Preview" button that opens the complete draft body (not just the 300-char excerpt) in a scrollable modal, using the shared `Modal` component. Publish and Discard are also available directly in the modal's footer and call the exact same handlers as the card's own buttons — no duplicated fetch logic, same loading/toast/removal behavior. The modal closes itself immediately when Publish/Discard is clicked from inside it, before the request resolves, since the draft card unmounts from the list on success.

## [Unreleased] — July 24, 2026 Session

### Changed
- **Content Automation: extended max function duration to 300s** — the on-demand "Generate Drafts" endpoint (`/api/admin/content-automation/generate`) now sets `maxDuration = 300` (5 min, the max on Vercel Pro), since a single lane's research call alone has been measured running well past the platform default. No `vercel.json` change needed — Next.js App Router reads the route-segment `maxDuration` export directly.

### Added
- **Content Automation: 2-minute cooldown on "Generate Drafts"** — the button now disables itself for 2 minutes after any run completes (success or failure) and shows a live "Available in M:SS" countdown in place of the label. Client-side-only UX safeguard against accidental repeat-clicking; a single research call has been measured at 137K-193K input tokens, so repeat clicks have a real per-click cost.
- **Content Automation: on-demand "Generate Drafts" button, guidance/reference-file inputs, and source transparency** — the Draft Review Queue now has a "Generate Drafts" button to run generation immediately instead of waiting for the Monday batch, plus two optional inputs above it: a "Direction" textarea to steer the topic focus, and a compact file-attach control (PDF/DOCX, max 10MB) to supply reference material for that one run — uploads go directly to Supabase Storage via a signed URL, bypassing Vercel's request-body limit. Generated articles now end with a reputable-source citation gate (backend, `src/lib/claude.ts`): the model must cite only pre-approved, reputable sources found via live web search, and any topic lane that comes back without enough reputable sources produces an amber "Insufficient reputable sources found" banner instead of a draft. Each draft card also gets a collapsible "Sources" section showing the cited, clickable source links (or a "No sources listed" flag if the draft has none).
- **Content Automation pipeline** — a new "Content Automation" admin tab lets Keith's team review AI-generated Vault article drafts before anything goes live. A weekly batch job (Mondays 9am UTC) generates drafts across configurable topic lanes using web search + Claude; nothing auto-publishes. The Draft Review Queue shows each pending draft with a preview, category, and source, with one-click Publish (copies into the live Vault) or Discard (no confirmation needed — low-stakes and reversible). A Topic Lanes sub-section lets admins add new lanes and toggle existing ones active/inactive to control what the weekly generator covers.
- **Vault page split into Featured + Library sections** — the top of `/vault` now always shows the 6 most recently added resources (unfiltered); below it, a new "Library" section holds the full archive in a dense searchable/paginated row list (12 per page), with the search bar and category filter relocated there and the level/type/free-only dropdowns removed for that view.
- **Vault "Featured" eyebrow label** — a small icon + uppercase kicker now sits above the Featured card grid so it reads as a distinct, lighter-weight section from Library's full heading treatment below it.

### Fixed
- **Content Automation guidance/reference file now clear after a successful Generate run** — the Direction textarea and attached reference file previously persisted after Generate completed and were silently resent on every subsequent click until manually removed. Both now reset (and the file input is cleared) once a run succeeds; a failed run leaves them in place so the admin can retry without re-entering anything. Training copy updated to describe this corrected behavior.
- **Content Automation "insufficient sources" banner reworded to be reassuring, not just factual** — was "Insufficient reputable sources found for [lane]. No draft created." Now: "Not enough reputable sources found for [lane] this run. Try adding more specific direction or try again next week." — matches the training page's own framing and gives a clear next step instead of reading like an error.
- **Content Automation topic lanes constrained to Vault categories** — the "Add Lane" form previously accepted any free-form name; a lane name outside the 7 fixed `VAULT_CATEGORIES` would have published articles with no reachable category filter on `/vault`. The form is now a dropdown limited to categories that don't already have a lane, with an appropriate empty state once all 7 are taken, and both the Zod schema and the lanes API return a clear 409 (rather than a raw DB error) on a duplicate.
- **Content Automation cron failures are now visible** — the weekly cron route previously discarded per-lane failure detail entirely, so a lane silently failing every week would have gone unnoticed by anyone. Per-lane failures are now reported to Sentry, and the cron response includes the full `laneResults` plus a `failed` lane-name list for anyone checking Vercel's cron logs.

### Security
- **Next.js upgraded 16.2.7 → 16.2.11** — patches 5 HIGH-severity advisories disclosed 2026-07-22 (cache confusion of response bodies, Turbopack/single-locale middleware bypass, Server Actions SSRF, Server Actions DoS, rewrites SSRF via attacker-controlled hostname). All five affected the `>=16.0.0 <16.2.11` range.
- **Content Automation `referenceFilePath` now constrained to this feature's own signed-upload paths** — the generate endpoint previously accepted any string as `referenceFilePath` and downloaded it from the shared `documents` Storage bucket with no ownership/prefix check, so a direct API call (bypassing the UI) could point it at any other object in that bucket (e.g. a different feature's uploaded document) and have its contents forwarded into the Anthropic prompt. `contentAutomationGenerateSchema` now requires the path to match the exact `content-automation-refs/...` shape `sign-upload/route.ts` mints, rejecting anything else with a 400. Also added `admin_activity_log` entries for reference-file uploads and on-demand generate runs, matching the audit-trail pattern already used elsewhere in this feature.

### Added
- **`firebase-admin` dependency** — added for upcoming server-side Firebase Cloud Messaging work.
- **Native push (iOS/Android) now actually sends** — `src/lib/push-server.ts` previously logged native tokens without sending. Now sends real notifications via `firebase-admin`'s FCM client, using `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`. Invalid/expired tokens (`messaging/registration-token-not-registered`, `messaging/invalid-registration-token`) are cleaned up from `push_subscriptions` the same way expired web push subscriptions already were.

### Fixed
- **iOS native push no longer sent through FCM (and no longer deletes valid subscriptions)** — `@capacitor/push-notifications` returns a raw APNs token on iOS, not an FCM registration token. Sending it via `firebase-admin`'s FCM client was failing with `messaging/invalid-registration-token`, which the cleanup logic incorrectly treated as a dead subscription and deleted. iOS tokens are now skipped (logged, counted as failed, subscription preserved) until real APNs delivery is wired up. Android is unaffected — it already returns a valid FCM token and continues to send via FCM exactly as before.

## [Unreleased] — July 11, 2026 Session

### Added
- **Session lifecycle: Live → Ended → Closed** — events now have an explicit three-state lifecycle. "End Event" (new, on /host) takes an event off the home page but leaves its polls open for stragglers. "Close Event" (new, on /host) locks every poll and moves the event to Past for good. A two-step inline confirm replaces `window.confirm()` for both.
- **Session End Time is now a required field** — Admin → Events → Details. Every new event must set an end time; existing events can be saved without one until it's filled in, but the "Save Details" button will block a save that clears it.
- **Event Status: new "Ended" option** — Admin → Events → Details → Event Status dropdown now has Upcoming → Live → Ended → Past.
- **Auto-end safety net (cron)** — a background job checks every 5 minutes for live events whose Session End Time passed more than 30 minutes ago (using the event's own timezone) and automatically sets them to "Ended." Backstop only — not a substitute for clicking End Event.
- **Public Events page: "Open Polls" section** — lists any "Ended" event that still has open polls, with a direct "Take Poll" link. No countdown/urgency chrome — just the event name and a CTA.
- **Top nav: "Events" renamed to "Events / Polls"** — reflects that attendees can still vote after an event ends.

### Fixed
- **"New Event" quick-create was missing Session End Time** — since it's now a required field on creation, the create modal collects it before allowing "Create & Set Up."

## [Unreleased] — June 18-19, 2026 Session

### Added
- **Admin: Unified Events tab** — replaces the separate Conference tab and Events Page tab with a single Events tab; Details, Sessions, Polls, Q&A, Word Cloud, Announcements, Files, Roles, Publish, and History all live inside one event record in a top-to-bottom accordion flow
- **Polls moved inside sessions** — poll management now lives within each session accordion rather than as a top-level event section
- **Live run panel** — control panel appears inside the Publish section when Go Live is ON; Keith can manage the active session from within the event detail view
- **Deploy All bulk endpoint** — deploys all polls for a session in one action without closing sibling polls
- **Reset All** — deletes all poll votes for a clean redeploy before a live run
- **Sequential vs simultaneous poll mode** — admin toggle controls whether attendee polls deploy one-at-a-time or all at once
- **Reopen All Polls button** — reopens all polls in a session with a single click
- **Delete event from event detail** — admins can delete an event directly from the event detail view
- **Numbered question parser** — imports Keith's numbered docx question format (1., 2., 3.) and maps them to poll questions automatically
- **E2E Playwright lifecycle test** — 12-step test covering the full poll lifecycle (create → deploy → vote → results → reset); all passing
- **Host: result sharing controls** — Show All Results and Stop Sharing buttons appear on /host when closed polls exist; no separate presenter view needed
- **Events page search + filter** — search bar filters by title/description/location in real time; tabs default to "Upcoming"
- **Ask Keith RAG** — AI advisor performs keyword-based retrieval against `vault_content` before each response; top 3 matching articles injected as context
- **Q&A release_mode fully wired** — all three modes work: `all` (immediate), `single` (per-question Eye toggle), `hide_all` (nothing shown to guests)
- **Strategy Room join URL field** — admins can paste a Zoom/Teams/Meet link per session; shown as a "Join Session" button to registered members only
- **Home page strategy room widget — live tier badge** — "Next Strategy Room" card now renders the correct Pro or Executive tier badge from the real session record
- **Vault feed quick-toggle** — ⭐ Feed button on each vault article for instant featured-in-feed toggling without opening an edit modal
- **Training sync validation system** — CI workflow + pre-commit hook enforcing every admin tab has a corresponding training section
- **Strategy Rooms training section** — admin training page documents the Strategy Rooms tab: create/edit/publish/delete flows, tier selection, seat limits, replay URL, notes URL

### Fixed
- **JSZip replaces mammoth for docx parsing** — eliminates DOMParser error that caused silent import failures; docx files now parsed reliably in the browser
- **PDF upload require() fix** — dynamic require() in the PDF upload path replaced with a compatible import; fixes runtime error on Vercel Edge
- **Session delete cascade fix** — deleting a session now cascades to its polls and votes; previously left orphaned records causing deploy errors
- **Scroll restoration fix** — `ScrollToTop` now uses `behavior: "instant"` and sets `window.history.scrollRestoration = "manual"` to prevent browser from restoring scroll position on route change
- **Florida Cocoa spotlight** — auto mode now correctly picks the nearest upcoming event; Florida Cocoa Church of God convention spotlighted as expected
- **Poll deploy error message simplified** — error surfaced to admin is now plain English instead of a raw Supabase error object
- **QA bypass user ID** — E2E test bypass path now uses a valid UUID format; previously caused FK constraint errors in test runs
- **Conference: `likeQuestion` called wrong endpoint** — authenticated heart-likes now route correctly to `/api/conference/questions/[id]/like`; previously both paths hit `/upvote`
- **SessionManager: clear `event_presentations.session_name` when last session is deleted** — prevents stale subtitle showing on public Events page spotlight card (bug root cause: session create synced title to parent event but delete did not reverse it)
- **Session/event file upload silently failed above ~4MB** — uploads now go directly from the browser to Supabase Storage via a signed upload URL instead of through the Next.js API route body, avoiding Vercel's ~4.5MB serverless function request limit; files up to the app's 50MB cap now upload reliably

### Changed
- **Presenter route retired** — /presenter now redirects to /host; one URL for everything
- **Admin: Conference tab removed** — event creation and management fully consolidated into the Unified Events tab
- **Conference: Create Event inline** — "New Event" button in the tab header creates the event and auto-selects it
- **Host war room: tabs eliminated** — single scrollable page when a session is active; Q&A expanded by default, Announce and History collapsible
- **Host war room: idle screen** — shows session picker immediately on load; no extra button required

### Security
- Bump Next.js to 16.2.6 (CVE-2026-44573/44574/44575/44578/45109 — middleware auth bypass + DoS)
- **Conference: Monitor View gated to admins** — "Monitor View" button was shown to all users; now only admins see it
- **Conference: draft polls hidden from guests** — `GET /api/conference/polls` now filters to `is_deployed=true` for non-admin callers
- **Conference: questions scoped per event** — `GET /api/conference/questions` returns `[]` when caller is not admin and no `event_id`/`session_id` is provided

---

## [2026-06-16] — Host War Room, Event Setup Flow, Conference URL State

### Added
- **Host war room** — rebuilt `/host` as a 6-tab unified view: Sessions, Polls, Q&A, Word Cloud, Announcements, and Moderator access; sessions can be activated directly from the war room; live poll results visible in real time (PR #183)
- **Events: access code toggle** — create and edit event forms now include an access code field; toggle reveals the code input; code is stored per event and enforced on the attendee conference join flow (PR #184)
- **Conference: active setup strip** — replaced the passive progress checklist with a sequential setup strip guiding Keith through Step 1 (Add sessions), Step 2 (Create polls), and Step 3 (Go live); strip transitions to a live indicator with "Open war room →" once the event is active; dismissible (PR #184)
- **UI testing and deployment verification protocol** — SHA-match gate documented in KLO CLAUDE.md; Toya must confirm deployed SHA matches expected commit before running any test checklist; stale-build and force-push caveats documented (PR #184)

### Fixed
- **Events: auto-navigate to Conference tab after creation** — creating an event now reliably navigates to the Conference tab with the new event pre-selected; previous implementation used a `window.dispatchEvent` CustomEvent with a 100ms race condition that fired before the tab component mounted; fix lifts `selectedEventId` to page-level state (PR #184)
- **Admin: tab and event state lost on refresh** — switching tabs now updates the URL (`/admin?tab=conference`); selecting a conference event updates the URL (`/admin?tab=conference&event=ID`); refresh and direct links reload the exact view the admin was on (PR #184, closes #185)
- **Events: page scroll to bottom on form close** — both submit and cancel paths now call `window.scrollTo({ top: 0, behavior: "smooth" })` after closing the create form (PR #184)

### Changed
- **Training: Going Live workflow rewritten** — step-by-step guide rebuilt; adds Host Duties section, corrects End Session location, fixes terminology throughout; PDF export updated (PR #181)
- **Training: schedule item terminology** — "session entries" replaces the previous ambiguous label for schedule display items in the Going Live workflow (PR #182)

---

## [2026-06-10] — Conference Polish, Presenter Remote, Events Admin

### Added
- **Presenter Remote** — phone-friendly stage remote at `/conference/present?event_id=X` for Keith to drive polls on stage; shows live vote count, Show/Hide Results toggle, Next button to advance queue; accessible to admin/owner only (PR #124)
- **Admin Events search box** — search input above the event list filters by event name, conference, or location as you type; includes clear (✕) button (PR #127)

### Fixed
- **Conference polls — server-side deploy gate** — `POST /api/conference/polls/[id]/deploy` now checks whether a poll is already active/deployed before setting it live; prevents double-deploy from concurrent requests (PR #123)
- **Conference polls — sequential deploy** — `deployAllPolls` in PollManager now uses a sequential `for...of` loop instead of `Promise.all`; eliminates race condition where two polls could go active simultaneously (PR #123)
- **Conference polls — session_id fallback** — deploy route now closes sibling polls by `session_id` when `event_id` is absent, so polls without an event assignment still correctly deactivate each other (PR #123)
- **Conference polls — stale results on advance** — closing a poll now resets `show_results: false` so the audience never sees the previous poll's results when the next poll goes live (PR #123)
- **Conference — owner role not recognized as admin** — `useConferenceRoles` only checked `appRole === "admin"`, so the owner account (Keith) was treated as an attendee; Presenter Remote button was hidden and poll controls were disabled; fixed by adding `appRole === "owner"` to the admin check (PR #125)
- **Q&A single-release — questions visible immediately** — `released` column in `conference_questions` defaulted to `true`, meaning every submitted question was immediately visible to guests even in single-release sessions; DB migration 20260610000002 sets `DEFAULT false` and updates the `submit_conference_question` RPC to explicitly pass `released = false` (PR #126)
- **Florida Cocoa polls reset** — all 12 Florida Cocoa Church of God 102nd State Convention polls were stuck in "all active" state from a pre-fix deploy; reset directly in DB: `is_deployed=false, is_active=false, show_results=false` on all 12 so the Presenter Remote queue works correctly for the live event
- **Admin Events sort order** — events API was ordered `ascending: false` (furthest-away first); changed to `ascending: true` so the next closest event (Florida Cocoa, June 10) appears at the top of the list (PR #127)

---


## [2026-05-07f] — Strategy Rooms: Full Database-Backed System

### Added
- **Strategy Rooms database tables** — `strategy_sessions` and `strategy_registrations` tables with RLS policies; migrations `20260507000001` and `20260507000002` (seed all 8 mock sessions).
- **Public API: `GET /api/strategy-rooms`** — returns all published sessions with live `registered_count`; supports `?limit=N`.
- **Public API: `GET /api/strategy-rooms/[slug]`** — single session by slug with `registered_count` and `is_registered` for logged-in users.
- **Registration API: `POST/DELETE /api/strategy-rooms/[slug]/register`** — server-side tier gating (pro/executive), seat availability check, upsert with conflict-safe insert, confirmation email on success.
- **Admin API: `GET/POST /api/admin/strategy-rooms`** — list all sessions (including unpublished) with counts; create new sessions with Zod validation.
- **Admin API: `PUT/DELETE /api/admin/strategy-rooms/[id]`** — update or delete sessions by UUID; delete blocked when active registrations exist.
- **Strategy Rooms admin tab** — full CRUD interface in the admin dashboard: create/edit modal, inline publish toggle, delete with confirmation, all with loading states and success/error toasts.
- **`StrategyRoomsAdminTab`** wired into `src/app/admin/page.tsx` as the "Strategy Rooms" tab.
- **Strategy Room confirmation email** — `sendStrategyRoomConfirmation()` in `src/lib/email.ts`; fire-and-forget, never fails the registration request.
- **`StrategySessionRow` and `StrategyRegistrationRow` interfaces** added to `src/lib/supabase.ts`.
- **Zod schemas** `strategySessionCreateSchema` and `strategySessionUpdateSchema` added to `src/lib/validation.ts`.

### Changed
- **`/strategy-rooms`** — converted to server component; fetches live data from Supabase directly; tab UI extracted to `StrategyRoomsClient` (client component) with real register/unregister API calls, loading states, and toast feedback.
- **`/strategy-rooms/[id]`** — converted to server component; fetches session + related sessions from DB; interactive parts extracted to `StrategyRoomDetailClient`.
- **Home page** — `UpcomingStrategyRoom` now auto-pulls the next upcoming published session from the DB; falls back to admin `strategy_config`, then to component defaults.

### Removed
- **`src/lib/strategy-rooms-data.ts`** — mock data file deleted; `sampleDiscussionComments` moved to `src/lib/strategy-rooms-discussion-mock.ts` (discussion thread deferred to future phase).

---

## [2026-05-07e] — Admin Content Batch: Date Fields, Testimonial Create, Survey CRUD

### Added
- **AI Tool of the Week — "Week of / Date" field** — admins can now set a date label (e.g. "Week of May 5, 2026") for the featured tool card. Rendered as muted text next to the category badge. Wired through `ToolConfig` interface, `tool_config` Zod schema, `HomeContentManager`, and `AIToolOfTheWeek` component.
- **Trending Topics — "Week of / Date" field** — admins can set a date label for the trending topics card. Rendered inline next to "Popular this week." Wired through `TrendingConfig` interface, `trending_config` Zod schema, `HomeContentManager`, and `TrendingTopics` component.
- **Testimonials — "Add Testimonial" button** — admins can now create testimonials manually from the Testimonials tab. Opens a create modal (email, organizer name, star rating, quote). New testimonials are created as pending and appear immediately in the list. POST `/api/admin/marketing/testimonials` already existed with full Zod validation.
- **Surveys — Create/Edit/Delete from admin UI** — replaced the "Surveys are created via the database seed" empty state with a full CRUD interface: "New Survey" button in header, per-row Edit (pencil) and Delete (trash) buttons, create/edit modal with Title, Slug (auto-generated from title, editable), Description, Intro Text, is_active toggle, show_on_homepage toggle. Slug uniqueness conflict returns a clear 409 error message.

### Changed
- **Surveys API — POST Zod validation** — `POST /api/admin/surveys` now uses `surveyCreateSchema` (Zod safeParse) instead of ad-hoc body checks.
- **Surveys API — PATCH Zod validation + slug support** — `PATCH /api/admin/surveys/[id]` now uses `surveyUpdateSchema` (Zod safeParse) and accepts `slug` updates.

---

## [2026-05-07d] — Hero Label Field

### Added
- **Hero banner label line is now admin-editable** — the "Technology Innovator • Strategic Advisor • Speaker" text above Keith's name can now be changed from the admin Home Content Manager. Wired through HeroConfig type, Zod schema, HeroBanner component, and page.tsx.

---

## [2026-05-07c] — Admin Save One-Click Fix

### Fixed
- **Admin saves now work on first click** — the Home Content Manager edit modal required two clicks to save (Save Changes → Confirm), causing every admin edit to silently not save if the user didn't notice the second confirmation step. Removed the confirmation dialog. Save Changes now saves immediately; the success/error toast is the only feedback needed.

---

## [2026-05-07b] — Hero Banner Admin Fix + Strategy Config

### Fixed
- **Hero banner edits now persist correctly** — the admin PATCH route previously replaced the entire `hero_config` JSONB column, so saving headline/tagline via the Home Content Manager would wipe the background image set by the Page Composer (and vice-versa). The route now reads the current row and deep-merges JSONB columns so each admin panel only updates its own fields.
- **All JSONB config columns protected** — the merge semantics apply to every column (`hero_config`, `brief_config`, `trending_config`, `insight_config`, `tool_config`, `assessment_config`, `strategy_config`), so no future admin save can silently clobber another panel's fields.
- **Strategy Room saves no longer error on live site** — `strategy_config` column was missing from the production database; migration added.

---

## [2026-05-07] — Document Viewer & Archive UX

### Fixed
- **Document viewer now routes through the KLO app** — "Read More" links pointing to raw Supabase storage URLs are automatically wrapped in the `/documents/view` viewer so users see the KLO-branded page, not a blank browser PDF tab.
- **Future uploads always set the viewer URL** — admin doc uploads now always populate the link field with the viewer URL, not the raw storage URL.

### Improved
- **Document viewer matches vault visual** — `/documents/view` now uses the same dark hero, gradient overlay, title treatment, back button, and container layout as vault detail pages.
- **Admin vault archive UX** — archived items no longer appear in the main Published/Hidden list. A collapsible "Archived Items" section at the bottom shows all archived content with per-item Republish buttons. The Archive toggle is now amber so its state is visually distinct.

---

## [2026-05-07] — Vault Rich Content Fix

### Fixed
- **Vault brief content now displays** — selecting a vault topic (e.g. "Navigating the Moral Frontier of Generative AI in Ministry") now renders the full structured brief (overview, takeaways, pull quote, implementation steps, conclusion) instead of blank. Root cause: API routes returned items with a `db-<uuid>` ID but the rich-content map keys are `v-001`–`v-017`; the lookup always missed. Fix reads `legacy_id` from each row's metadata JSONB (stored at seed time) so the lookup succeeds.

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
