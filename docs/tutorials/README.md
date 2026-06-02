# KLO Admin Video Tutorial Series

Complete tutorial collection for Keith Lodom to manage keithlodom.ai admin dashboard content, events, vault, and user management.

**Total runtime:** ~101 minutes across 13 modular videos (5–12 minutes each).

---

## Tutorial Index

### Getting Started
1. **Getting Into the Admin Dashboard** (5 min)
   - File: `klo_tutorial_01_getting_started.md`
   - Learn: Sign in, navigate to Admin, read the 15 tabs, use header buttons

### Home Page Management
2. **Editing Your Home Page Text** (10 min)
   - File: `klo_tutorial_02_home_page_text.md`
   - Learn: Edit Hero Banner, Latest Intelligence Brief, Trending Topics, Featured Insight, AI Tool of the Week

3. **Changing the Home Page Background Image** (8 min)
   - File: `klo_tutorial_03_home_page_image.md`
   - Learn: Upload images, set as background, adjust overlay opacity, restore slideshow

### Vault Management
4. **Adding a New Item to the Vault Library** (10 min)
   - File: `klo_tutorial_04_vault_new_item.md`
   - Learn: Create new vault items with title, category, type, body, tier (free vs. premium)

5. **Editing, Hiding, and Archiving Vault Items** (8 min)
   - File: `klo_tutorial_05_vault_edit_hide_archive.md`
   - Learn: Edit existing items, toggle visibility, archive vs. delete, republish archived items

### Events & Conference
6. **Creating and Publishing an Event** (12 min)
   - File: `klo_tutorial_06_create_event.md`
   - Learn: Set up event with title, date, location, add multiple sessions with times and rooms

7a. **Event Setup & Sessions** (10 min)
   - File: `klo_tutorial_07a_event_setup_sessions.md`
   - Learn: Create events, add guest presenters, generate access codes, add and edit sessions

7b. **Running a Live Conference** (10 min)
   - File: `klo_tutorial_07b_live_conference.md`
   - Learn: Go live, create polls, review Q&A, send announcements, monitor word cloud, export results

### Daily Operations
8. **Sending a Push Notification** (5 min)
   - File: `klo_tutorial_08_push_notification.md`
   - Learn: Compose and send push notifications to all users or specific individuals

9. **Managing Booking Inquiries** (7 min)
   - File: `klo_tutorial_09_booking_inquiries.md`
   - Learn: Search inquiries, filter by type/status, update status workflow (New → Reviewed → Contacted → Archived)

### Site Customization
10. **Customizing Brand Colors and Features** (8 min)
    - File: `klo_tutorial_10_brand_colors_features.md`
    - Learn: Change brand colors, toggle features on/off, reorder home page sections

### Administration
11. **Managing User Accounts** (8 min)
    - File: `klo_tutorial_11_user_accounts.md`
    - Learn: Search users, filter by tier, disable/enable accounts, change user roles

12. **Creating and Reviewing Surveys** (10 min)
    - File: `klo_tutorial_12_surveys.md`
    - Learn: Create surveys with multiple question types, publish, review responses, export CSV

---

## How to Use These Tutorials

### For Video Production
Each markdown file contains:
- **Step-by-step instructions** — numbered, click-by-click
- **Video markers** — `[SHOW: ...]`, `[NARRATE: ...]`, `[PAUSE: ...]` for cameraman/editor
- **Screenshot descriptions** — what to display on screen (e.g., "zoom in on the Address Bar")
- **Troubleshooting** — common mistakes and fixes
- **Button labels** — all pulled directly from the actual KLO admin interface

**To produce a video:**
1. Open the `.md` file
2. Follow the step-by-step instructions on screen while recording
3. Use the video markers as cues for what to show and when to pause
4. Narrate the [NARRATE] sections in your own words

### For Self-Learning
Keith can also read these files directly as a text reference guide without video.

---

## File Naming Convention

`klo_tutorial_[number]_[topic].md`

- Numbers 01–13 indicate tutorial order
- Topic slugs match the workflow (e.g., `vault_new_item`, `brand_colors_features`)

---

## Session-Length Design

Each tutorial is designed to be completed in one session:
- **5 min tutorials:** Quick reference tasks (getting started, notifications)
- **8 min tutorials:** Single workflow (hide vault items, change background)
- **10 min tutorials:** Multi-step operations (add event, edit home page text, surveys)
- **12 min tutorials:** Complex workflows with sub-steps (event creation with sessions)

No tutorial exceeds 15 minutes — if a task is larger, it's split (e.g., Conference is 07a + 07b).

---

## Button Labels & UI Elements

All button names, tab names, and field labels in these tutorials are extracted directly from the KLO source code at:
- `src/app/admin/page.tsx` (tabs)
- `src/components/admin/ConferenceAdminTab.tsx` (conference features)
- `src/components/admin/ContentManagerTab.tsx` (content sections)
- `src/components/admin/VaultContentManager.tsx` (vault fields)
- `src/components/admin/EventsAdminTab.tsx` (event form)

Last verified: 2026-06-01

---

## Questions or Updates?

If Keith has questions while using these tutorials, note them in a request at **Admin Dashboard → Request Update** button. Updates to tutorials based on feedback can be made at any time.

---

*Generated: 2026-06-01 | Part of the KLO Admin Tutorial Series*
