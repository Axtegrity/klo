# KLO App — Engagement/Conference Page QA Test Plan

**Site:** https://keithlodom.ai
**Route:** `/conference`
**Last Updated:** 2026-03-12
**Author:** Tim Adams / Maven QA

---

## 1. Test Matrix

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| **ENG-001** | No seminar mode active | 1. Ensure `seminar_mode.active = false` in conference settings. 2. Navigate to `/conference`. | Full-screen centered message: "Come Back Soon For Upcoming Events". No event cards, no tools. | [ ] |
| **ENG-002** | Seminar mode active, no events today | 1. Enable seminar mode. 2. Ensure no events in `event_presentations` have today's date. 3. Navigate to `/conference`. | Same "Come Back Soon For Upcoming Events" message. Identical to ENG-001 from the guest's perspective. | [ ] |
| **ENG-003** | Single event today — auto-selects | 1. Enable seminar mode. 2. Create one published event with today's date. 3. Navigate to `/conference`. | Event picker is skipped entirely. Page jumps straight to session selection showing the event's `conference_name` as the heading with date and location. | [ ] |
| **ENG-004** | Multiple events today — event picker | 1. Enable seminar mode. 2. Create 2+ published events with today's date. 3. Navigate to `/conference`. | "Select an Event" heading with "Live Today" badge. Each event rendered as a Card with conference_name, title (if different), date, location, and "Join >" CTA. | [ ] |
| **ENG-005** | Select event from picker | 1. From ENG-004 state, tap an event card. | Transitions to session selection screen for that event. Event heading, date, and location displayed. | [ ] |
| **ENG-006** | Single session for event — auto-selects | 1. Select (or auto-select) an event that has exactly 1 session. | Session picker is skipped. Page jumps directly to the active session view with interactive tools (Polls, Q&A, Word Cloud tabs). | [ ] |
| **ENG-007** | Multiple sessions — session picker | 1. Select an event that has 2+ sessions. | "Select a session to join." prompt. Each session rendered as a SessionCard showing title, time_label, speaker, room, and "Live" badge if `is_active`. | [ ] |
| **ENG-008** | Session card — active indicator | 1. From ENG-007, ensure one session has `is_active = true`. | Active session card has emerald-green left border, "Live" badge (green), and `shadow-lg` glow. Inactive sessions have no border highlight. | [ ] |
| **ENG-009** | Select a session | 1. From ENG-007, tap a session card. | Transitions to active session view. Heading and subtitle display per display_name_mode. Interactive tools load below. Session Notes section visible at bottom. | [ ] |
| **ENG-010** | No sessions available for event | 1. Select an event with 0 sessions in the database. | Card with message: "No sessions available yet. Check back soon!" No spinner (loading finished). | [ ] |
| **ENG-011** | Back button: session → session picker | 1. From active session view (with 2+ sessions), click "Back to Sessions". | Returns to session selection. `selectedSessionId` is cleared. Session list re-renders. | [ ] |
| **ENG-012** | Back button: session → (single session) | 1. From active session view when there's only 1 session, click "Back". | Button label reads "Back" (not "Back to Sessions"). Returns to session selection view, which re-auto-selects the single session (may appear to flash). | [ ] |
| **ENG-013** | Back button: session picker → event picker | 1. From session selection (when multiple events exist), click "Back to Events". | Returns to event picker. Both `selectedEventId` and `selectedSessionId` are cleared. | [ ] |
| **ENG-014** | Back button hidden for single event | 1. Navigate with only 1 event today. Reach session selection. | "Back to Events" button is NOT rendered (guarded by `liveEvents.length > 1`). | [ ] |
| **ENG-015** | Display name mode = "event" (default) | 1. Set event's `display_name_mode` to `"event"` (or null). 2. Select event + session. | Heading (h1, 4xl-6xl): `conference_name`. Subtitle (xl-2xl, muted): `session.title`. | [ ] |
| **ENG-016** | Display name mode = "session" | 1. Set event's `display_name_mode` to `"session"`. 2. Select event + session. | Heading (h1): `session.title`. Subtitle: `conference_name`. Swapped from ENG-015. | [ ] |
| **ENG-017** | Nav link hidden when seminar mode off | 1. Set seminar mode inactive. 2. Check TopNav links (desktop and mobile). | "Engagement" link (`/conference`) is NOT in the nav. All other links remain. | [ ] |
| **ENG-018** | Nav link visible when seminar mode on | 1. Set seminar mode active. 2. Check TopNav links. | "Engagement" link appears in nav between "Events" and "Invite Keith To Speak". | [ ] |
| **ENG-019** | Session notes — auto-save to localStorage | 1. On active session view, type text in the notes textarea. 2. Wait 1 second. | "Saved" indicator (green, with CheckCircle2 icon) appears briefly. `localStorage.getItem("klo-conference-notes")` matches typed text. | [ ] |
| **ENG-020** | Session notes — persist on refresh | 1. Type notes, wait for save. 2. Refresh the page. 3. Navigate back to active session. | Notes textarea pre-populated with previously saved text from localStorage. | [ ] |
| **ENG-021** | Session notes — word count | 1. Type "Hello world test" in notes. | Word count shows "3 words" below textarea. Empty textarea shows "No notes yet". | [ ] |
| **ENG-022** | Session notes — empty string edge case | 1. Clear all notes text (empty string). | No save triggered (guarded by `if (notes === "") return`). Display shows "No notes yet". | [ ] |
| **ENG-023** | ConferenceToolsTabs — receives correct props | 1. Select event "A" with session "B". 2. Inspect ConferenceToolsTabs render. | `eventId` = event A's ID. `sessionId` = session B's ID. Both passed as strings (not null). | [ ] |
| **ENG-024** | Polls tab — scoped to session | 1. On active session, select Polls tab. | Polls displayed via `LivePolling`. `usePolls` called with `sessionId` = selected session's ID and `eventId` = selected event's ID. Only polls for that session appear. | [ ] |
| **ENG-025** | Q&A tab — scoped to session | 1. Switch to Q&A tab. | Questions scoped to `effectiveSessionId`. QuestionInput and QuestionList rendered. Questions from other sessions do not appear. | [ ] |
| **ENG-026** | Q&A tab — disabled per session | 1. Set `qa_enabled = false` on the selected session. 2. Navigate to Q&A tab. | Yellow card: "Q&A is currently disabled for this session." with `MessageSquareOff` icon. No input or question list. | [ ] |
| **ENG-027** | Word Cloud tab — scoped to event | 1. Switch to Word Cloud tab. | `useWordCloud` called with `eventId` only (note: word cloud is event-scoped, not session-scoped). WordCloudInput and WordCloudCanvas rendered. | [ ] |
| **ENG-028** | Tab switching animation | 1. Click between Polls, Q&A, Word Cloud tabs. | Content fades in with `opacity: 0 → 1, y: 8 → 0` animation (200ms). Active tab has `bg-klo-slate` highlight. | [ ] |
| **ENG-029** | Announcements banner | 1. Create an announcement for the event via admin. | Banner appears above tabs with megaphone icon, title, message, and dismiss (X) button. | [ ] |
| **ENG-030** | Dismiss announcement | 1. Click X on an announcement banner. | Announcement slides out (AnimatePresence exit). Does not reappear until page refresh (dismissed in local state only). | [ ] |
| **ENG-031** | Realtime updates — sessions | 1. While viewing session list, admin activates/deactivates a session. | Session list refreshes via `useConferenceRealtime` → `onSessionsChange`. "Live" badge appears/disappears without manual refresh. | [ ] |
| **ENG-032** | Realtime updates — seminar mode | 1. While on `/conference`, admin toggles seminar mode off. | Page re-fetches settings via `useConferenceRealtime` → `onSettingsChange`. Page transitions to "Come Back Soon" without manual refresh. | [ ] |
| **ENG-033** | Realtime updates — announcements | 1. While on active session, admin creates new announcement. | New announcement banner appears via `useConferenceRealtime` → `onAnnouncementsChange`. | [ ] |
| **ENG-034** | Loading state — initial page load | 1. Navigate to `/conference` with slow network. | Page returns `null` (blank) while `seminarLoading` or `eventsLoading` is true. No flash of wrong content. | [ ] |
| **ENG-035** | Loading state — sessions fetching | 1. Select an event. Observe while sessions load. | Spinner (blue border-spin animation) displayed centered in session list area. Disappears when sessions arrive. | [ ] |
| **ENG-036** | Live events API — timezone handling | 1. Create event with `event_timezone = "America/New_York"` and today's date in that timezone. | API double-checks using event's own timezone. Event appears in results even if server is in a different timezone. | [ ] |
| **ENG-037** | Live events API — published filter | 1. Create event with `is_published = false` and today's date. | Event does NOT appear in `/api/live-events` response. Only published events are returned. | [ ] |
| **ENG-038** | Live events API — ordering | 1. Create 3 events with different `event_time` values. | API returns events ordered by `event_time` ascending (nulls last). Event picker cards match this order. | [ ] |
| **ENG-039** | Mobile — event picker cards | 1. View `/conference` on 390px viewport with multiple events. | Cards stack vertically, full width. Touch target is entire card (button wraps Card). Text doesn't overflow. | [ ] |
| **ENG-040** | Mobile — session picker cards | 1. View session selection on 390px viewport. | Session cards stack vertically. Title truncates with `truncate` class. Description limited to 2 lines (`line-clamp-2`). | [ ] |
| **ENG-041** | Mobile — tool tabs horizontal scroll | 1. View active session on narrow mobile viewport. | Tab bar scrolls horizontally (overflow-x-auto, scrollbar-hide). All 3 tabs accessible via swipe. | [ ] |
| **ENG-042** | Mobile — notes textarea | 1. On mobile, tap notes textarea. | Keyboard opens. Textarea is resizable (`resize-y`). Text size is `text-base` (16px) — no iOS zoom on focus. | [ ] |
| **ENG-043** | Mobile nav — engagement link | 1. Open hamburger menu on mobile with seminar mode active. | "Engagement" appears in mobile nav list. Tap navigates to `/conference` and closes menu. | [ ] |
| **ENG-044** | Presentation mode button | 1. On active session, verify PresentationModeButton renders. | Button appears in the tab bar row (right side on desktop, below tabs on mobile). | [ ] |
| **ENG-045** | Instructions section | 1. On active session, scroll below tool tabs. | InstructionsSection component renders below the tab content area. | [ ] |
| **ENG-046** | Guest not authenticated — Q&A behavior | 1. Access `/conference` without being logged in. Select a session. Go to Q&A tab. | Guest can submit questions. `isAuthenticated` is false — verify upvote/like behavior matches guest permissions. | [ ] |
| **ENG-047** | Notes shared across sessions | 1. Select session A, type notes. 2. Go back, select session B. | Notes persist — they use a single localStorage key (`klo-conference-notes`), NOT scoped per session. Same notes visible regardless of session. | [ ] |
| **ENG-048** | Profanity filter — Q&A | 1. Submit a question with a flagged term. | `profanityError` state populated. Error displayed via QuestionInput. Question not submitted. | [ ] |
| **ENG-049** | Event card — duplicate name suppression | 1. Create event where `conference_name === title`. | Event picker card shows `conference_name` only. The subtitle line (`title`) is suppressed (guarded by `conference_name !== title`). | [ ] |
| **ENG-050** | Session card — optional fields | 1. Create session with null `time_label`, null `speaker`, null `room`. | Card renders title only. No time/speaker/room metadata lines. No layout breakage. | [ ] |

---

## 2. Guest Flow Walkthrough

### Step 1: Arriving at the Site

A conference attendee opens `https://keithlodom.ai` on their phone (most likely scenario). They see the KLO homepage.

**If seminar mode is active**, the top navigation includes an "Engagement" link. On mobile, this appears in the hamburger menu.

**If seminar mode is NOT active**, the "Engagement" link is hidden entirely. The guest has no way to reach the `/conference` page via navigation (direct URL still works but shows the "Come Back Soon" message).

`[Screenshot placeholder: Homepage with Engagement link visible in nav]`

---

### Step 2: Navigating to `/conference`

Guest taps "Engagement" in the nav (or scans a QR code that links directly to `/conference`).

**If no events are live today**, the guest sees a full-screen centered message:

> "Come Back Soon For Upcoming Events"

No further action is possible. The page is a dead end.

`[Screenshot placeholder: "Come Back Soon" blank state]`

---

### Step 3: Event Selection (if multiple events)

If multiple events are happening today, the guest sees:
- "Live Today" gold badge
- "Select an Event" heading
- Event cards with conference name, title, date, location, and a "Join >" affordance
- Staggered fade-in animation on cards

Guest taps the relevant event card.

`[Screenshot placeholder: Event picker with 2+ event cards]`

**If only one event exists today**, this step is skipped entirely — the guest never sees event selection.

---

### Step 4: Session Selection

After selecting (or auto-selecting) an event, the guest sees:
- Event conference name as the heading
- Date and location metadata
- "Select a session to join." prompt
- Session cards showing title, time label, speaker, room, and "Live" badge for active sessions
- A back button (only if there were multiple events)

Guest taps a session card to join.

`[Screenshot placeholder: Session picker with 3 sessions, one marked "Live"]`

**If only one session exists**, this step is skipped — the guest goes directly to the tools view.

---

### Step 5: Active Session — Interactive Tools

This is the main experience. The guest sees:

**Header area:**
- "Live Session" gold badge
- Heading: event name or session name (per `display_name_mode`)
- Subtitle: the opposite (session name or event name)
- Date and location
- Back button to return to sessions

**Interactive tools tabs:**
- **Polls** — Live polling with vote buttons and real-time results
- **Q&A** — Submit questions (with profanity filter), upvote/like others' questions
- **Word Cloud** — Submit words that build a real-time collaborative word cloud

**Announcements** — Banners above the tabs if the admin has posted any. Dismissible.

**Session Notes** — Textarea at the bottom for personal notes. Auto-saves to browser localStorage after 1 second of inactivity. Shows word count and "Saved" confirmation.

`[Screenshot placeholder: Active session view with Polls tab active]`
`[Screenshot placeholder: Q&A tab with questions list]`
`[Screenshot placeholder: Word Cloud tab with canvas]`
`[Screenshot placeholder: Session Notes textarea with "Saved" indicator]`

---

### Step 6: Switching Sessions or Events

Guest taps "Back to Sessions" to pick a different session, or "Back to Events" to pick a different event (if multiple exist). Navigation is linear — there is no breadcrumb or dropdown for quick switching.

`[Screenshot placeholder: Back button navigation]`

---

### Step 7: After the Event

When the admin deactivates seminar mode, the page transitions to the "Come Back Soon" state in real-time (no refresh needed). The "Engagement" link disappears from the nav. Guest notes remain in localStorage for later reference.

---

## 3. UX Recommendations

### What Works Well

- **Auto-selection logic** is smart. When there's only 1 event or 1 session, the guest skips straight past unnecessary selection screens. This is the right call for a conference where most events have a single active session.
- **Real-time updates** via Supabase realtime mean the admin can activate sessions, post announcements, and toggle features without guests needing to refresh. This is critical for a live event.
- **Staggered animations** are tasteful and give the page a polished feel without being slow.
- **Mobile-first text sizing** (`text-base` for inputs) avoids the iOS auto-zoom problem. Good.

### Concerns and Recommendations

**1. "Come Back Soon" message is too vague**
The message "Come Back Soon For Upcoming Events" does not tell the guest *why* nothing is showing. A guest who was told to go to this page during a conference will think the site is broken. Consider:
- Adding a line: "No live events are scheduled for today. If you're at a conference right now, ask your host for the event link."
- Or showing the next upcoming event with a date, so the guest knows something is planned.

**2. Notes are NOT scoped to session**
The localStorage key is `klo-conference-notes` — a single global key. If a guest attends two sessions and takes notes in both, the notes from session 1 are still there in session 2. This could be confusing, or it could be intentional (a single running notepad). Either way:
- If intentional: add a header like "All Session Notes" to make it clear.
- If not intentional: scope the key to `klo-conference-notes-${sessionId}`.

**3. No way to switch sessions without going "Back"**
The linear back-navigation works but adds friction. A guest who wants to hop between sessions (e.g., checking Q&A in one while polls are live in another) has to: back out → pick new session → wait for tools to load. Consider a session dropdown or a persistent session switcher in the header.

**4. Back button on single-session events creates a confusing loop**
When there's only 1 session, clicking "Back" goes to session selection, which immediately auto-selects the same session and returns to the tools view. The guest sees a brief flash. Consider hiding the back button entirely when there's only 1 session and 1 event (nothing to go back to).

**5. Page refresh mid-session loses selection state**
`selectedEventId` and `selectedSessionId` are in React state only. A page refresh (or accidental swipe-back on mobile) drops the guest back to step 1. They have to re-select the event and session. Consider:
- Persisting selection in `sessionStorage` or URL query params (`/conference?event=abc&session=def`).
- This is especially important on mobile where accidental refreshes are common.

**6. Loading state returns `null` — may flash white**
During initial load, the page returns `null`, which renders nothing. Depending on the layout wrapper, this could flash a blank white screen before the "Come Back Soon" message or event picker appears. Consider rendering a centered spinner or skeleton instead of `null`.

**7. No onboarding or explainer for interactive tools**
A first-time guest lands on the Polls tab with no context. There is an `InstructionsSection` component at the bottom, but it's below the fold. Consider:
- A brief one-line prompt above the tabs: "Participate in live polls, ask questions, and contribute to the word cloud."
- Or a first-visit tooltip/toast.

**8. Announcement dismissal is not persistent**
Dismissing an announcement uses in-memory state (`dismissedIds`). If the guest switches tabs or refreshes, dismissed announcements reappear. Consider storing dismissed IDs in localStorage or sessionStorage.

**9. Accessibility concerns**
- **Tab bar**: The tab buttons lack `role="tab"` / `aria-selected` / `role="tabpanel"` semantics. Screen readers won't identify this as a tabbed interface.
- **Event/session cards**: The entire card is a `<button>` which is good for click targets, but the button has no `aria-label`. Screen readers will read the full card content, which may be verbose.
- **"Saved" indicator**: The brief animated "Saved" text relies purely on vision. No `aria-live` region announced for screen readers.
- **Color contrast**: The `text-klo-muted` color on the dark background should be verified for WCAG AA (4.5:1 contrast ratio).
- **Session card truncation**: `truncate` on session titles may cut off important information on narrow screens. Consider a tooltip or expanded view.

**10. Font size and readability**
- Headings are appropriately large: `text-4xl` (36px) to `text-6xl` (60px) on desktop. Good for a conference setting where people may be reading from a distance.
- Body text is `text-base` (16px) to `text-lg` (18px). Adequate for mobile.
- Session card title uses `text-lg` (18px) with `font-semibold`. This is fine for card titles.
- The metadata (date, location) uses `text-sm` (14px) — this is on the small side for a conference attendee glancing at their phone while standing in a crowd. Consider bumping to `text-base`.
- Word count and "Saved" indicators use `text-xs` (12px). Acceptable as secondary information.

**11. Mobile experience for conference attendees**
- Conference attendees are typically standing, holding phones one-handed, in potentially low-light environments. The dark theme is good for this.
- Touch targets on event/session cards are full-width buttons — excellent.
- The tab bar uses `overflow-x-auto` with hidden scrollbar. With only 3 tabs (Polls, Q&A, Word Cloud), they likely all fit on screen. But if labels get longer or a 4th tab is added, guests won't know they can scroll (hidden scrollbar = no scroll affordance).
- The notes textarea has `resize-y` which on mobile can conflict with the native scroll behavior. Consider disabling resize on mobile or using auto-growing textarea.

**12. Word Cloud is event-scoped, not session-scoped**
Unlike Polls and Q&A (which filter by `sessionId`), the Word Cloud uses `eventId` only. This means all sessions share one word cloud. This may be intentional (collaborative across sessions), but it could confuse guests who expect each session to have its own cloud. Document this behavior or add a note in the UI.

**13. Edge case: event timezone mismatch**
The `/api/live-events` route uses `America/Chicago` as the default timezone and double-checks each event's own timezone. If an event has no timezone set and the guest is in a different timezone, the event might not appear at the expected time. Consider defaulting to the event's timezone or the user's browser timezone for the display.

---

## Summary

The engagement flow is well-built for its primary use case: a single event with 1-3 sessions where guests participate via their phones during a live presentation. The auto-selection logic, real-time updates, and clean UI make it feel polished.

The main gaps are around **edge cases and resilience**: page refresh losing state, the vague blank-state message, notes not scoped per session, and the back-button loop on single-session events. These are all straightforward fixes that would significantly improve the experience for guests who aren't on a perfect happy path.
