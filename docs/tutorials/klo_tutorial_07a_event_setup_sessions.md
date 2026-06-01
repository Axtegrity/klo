# Tutorial 07a: Event Setup and Adding Sessions
**Duration estimate:** 10 minutes
**Series:** KLO Admin Video Tutorials

---

## Prerequisites

Before you start this tutorial, you need:
- Admin access (see Tutorial 01)
- At least one event already created (see Tutorial 06)
- The admin dashboard open at keithlodom.ai/admin

---

## What You Will Learn

By the end of this video, you will know how to open the Conference tab, navigate to a specific event, understand the six sub-tabs available for each event, and add sessions to the event so they appear on the spotlight card and can be individually managed during a live conference.

---

## What is the Conference Tab?

The Conference tab is the live event control center. While the Events tab (Tutorial 06) is for creating and publishing event listings, the Conference tab is where you go when an event is actually happening — to manage polls, Q&A, announcements, and individual sessions in real time.

Before a conference goes live, you use the Conference tab to set up sessions. This tutorial covers that setup phase.

---

## Step-by-Step Instructions

### Step 1 — Open the Conference tab

1. Click the **Conference** tab in the tab row at the top of the admin dashboard.

[SHOW: the tab row with Conference highlighted]
[NARRATE: "The Conference tab is your event command center. Everything that happens in real time during a live event flows through here."]

---

### Step 2 — Read the Conference tab layout

The Conference tab opens to an event list. At the top, you will see an engagement status bar that shows whether any event is currently live.

- If the bar shows a **pulsing green dot** and says "Engagement ON," at least one event is currently active.
- If the bar is grey and says "Engagement OFF," no events are currently live.

Below the status bar is a list of all your events.

[SHOW: the engagement status bar — both states if possible]
[NARRATE: "You can quickly see at a glance whether you are in an active session. If you are about to start a conference and the bar is grey, that is expected — you will turn the event live in Tutorial 07b."]

---

### Step 3 — Select an event

1. Find the event you want to set up sessions for.
2. Click anywhere on the event name or the arrow icon on the right of the event card.

You will be taken into the event detail view. A header at the top shows the event name, date, and location.

[SHOW: the event list and clicking through to the event detail view]

---

### Step 4 — Read the six sub-tabs

Inside the event detail view, you will see a row of six sub-tabs:

| Sub-tab | What it is for |
|---|---|
| **Sessions** | Add and manage individual sessions or talk slots for this event |
| **Polls** | Create polls that go live during the event for the audience to answer |
| **Q&A** | See and moderate audience questions in real time |
| **Word Cloud** | Audience submits words; you see them visualized |
| **Announce** | Push a text announcement to all attendees in real time |
| **Settings** | Profanity filter and role management |

[SHOW: the six sub-tabs with each label visible]
[PAUSE: let them read the sub-tabs]
[NARRATE: "This tutorial focuses on Sessions — the setup work you do before the conference starts. Tutorial 07b will cover running the live tools: Polls, Q&A, Announce, and Word Cloud."]

---

### Step 5 — Click the Sessions sub-tab

1. Click the **Sessions** sub-tab (it should already be selected by default when you enter an event).

You will see the Sessions manager.

[SHOW: the Sessions sub-tab selected]

---

### Step 6 — Read the Sessions manager

The Sessions manager shows a list of sessions for this event (empty at first) and two buttons at the top right:

- **Add Session** — adds a new blank session row
- **Save Sessions** — saves all session rows to the database

Below that, each session row has five fields:

| Field | What it captures |
|---|---|
| **Session name** | The title of the session or talk — for example, "Opening Keynote" |
| **Start time** | When this session begins |
| **End time** | When this session ends |
| **Room** | The room or hall number (optional) |
| **Remove button** (trash icon) | Removes this session row |

[SHOW: the Sessions manager with the Add Session and Save Sessions buttons visible]

---

### Step 7 — Add your first session

1. Click **Add Session**.
2. A new blank row appears in the list, numbered #1.
3. Click in the **Session name** field and type the session name.
   - Example: "Opening Keynote"
4. Click the **Start time** field and type or select the start time.
5. Click the **End time** field and type or select the end time.
6. If this session is in a specific room, click the **Room** field and type the room name or number.

[SHOW: a session row being filled in]
[NARRATE: "Sessions appear on the spotlight card on the public events page — so attendees at a large conference can see exactly when and where Keith's session is. Keep session names clear and concise."]

---

### Step 8 — Add more sessions

1. Click **Add Session** again for each additional session.
2. You can add up to 10 sessions per event.
3. Fill in each session row the same way.

[SHOW: multiple session rows filled in]

---

### Step 9 — Save the sessions

When all sessions are entered:

1. Click **Save Sessions** at the top-right of the Sessions manager.
2. The button will show a spinning indicator while saving.
3. When saving is complete, a green **Saved** confirmation appears next to the button.

[SHOW: the Save Sessions button — loading state, then Saved confirmation]
[NARRATE: "Sessions are not live to the audience until you turn the event on. Saving here just records the session list — turning the event on is covered in Tutorial 07b."]

---

### Step 10 — Verify sessions on the public events page

1. Open a new browser tab.
2. Go to **keithlodom.ai/events**.
3. Find the event's spotlight card.
4. Confirm the sessions are listed with their times and rooms.

[SHOW: the public events page showing the sessions list on the spotlight card]
[NARRATE: "The sessions list shows on the public events page automatically once saved. Members can see the schedule before the conference even starts."]

---

### Step 11 — Return to the event list

1. Click the back arrow (left-arrow button) at the top-left of the event detail view.
2. You are back to the full event list in the Conference tab.

[SHOW: the back arrow and return to event list]

---

## Troubleshooting

**Problem: I saved sessions but they are not showing on the public events page.**
Fix: Confirm the event is published (see Tutorial 06, Step 8). Also confirm "Display on Events Page" is toggled on in the event's edit form in the Events tab. Sessions only show on published, visible events.

**Problem: The Add Session button is greyed out.**
Fix: You have reached the maximum of 10 sessions per event. Remove a session row if you need to add a different one.

**Problem: The session times are showing wrong hours.**
Fix: The time fields use 24-hour format internally but display in 12-hour format. Make sure AM/PM is set correctly when entering times. Also verify the timezone set on the event in the Events tab matches the event's actual location.

**Problem: I cannot find my event in the Conference tab list.**
Fix: The Conference tab pulls from the same events database as the Events tab. If you just created an event, try clicking the Refresh button (circular arrow) at the top of the page, or scroll down — events are listed with the most recent at the top.

---

## Video Markers for Editor / Cameraman

- [SHOW: Conference tab selected in tab row] — zoom in
- [SHOW: engagement status bar — green and grey states] — show both if possible
- [SHOW: event list — clicking through to event detail] — smooth click-through transition
- [SHOW: six sub-tabs with all labels readable] — wide shot, then slow pan
- [PAUSE: let them read the sub-tabs] — hold 4 seconds
- [SHOW: Sessions sub-tab selected] — zoom in on active tab
- [SHOW: Sessions manager — Add Session and Save Sessions buttons] — labeled callouts
- [SHOW: session row being filled in — all five fields] — zoom in so fields are readable
- [SHOW: multiple session rows] — pull back to show the full list
- [SHOW: Save Sessions — loading, then Saved confirmation] — capture both states
- [SHOW: public events page — spotlight card with sessions list] — full-page screenshot
- [SHOW: back arrow returning to event list] — show the navigation
- [NARRATE: closing] — "Tutorial 07b covers the live conference tools — polls, Q&A, announcements, and the Word Cloud — which you use during the actual event."

---

*This tutorial is part of the KLO Admin Video Tutorial series. All sub-tab labels, field names, and button labels are taken directly from the live admin interface at keithlodom.ai.*
