# Tutorial 08: Sending a Push Notification
**Duration estimate:** 5 minutes
**Series:** KLO Admin Video Tutorials

---

## Prerequisites

Before you start this tutorial, you need:
- Admin access (see Tutorial 01)
- A clear idea of what you want to say — title (short) and body (one to three sentences)
- The admin dashboard open at keithlodom.ai/admin

---

## What You Will Learn

By the end of this video, you will know how to compose a notification, choose who receives it, add an optional link, and send it to your members via push notification and email.

---

## How Notifications Work

When a member signs up and allows notifications, the system can reach them two ways:

- **Push notification** — appears on their phone or browser like any app notification
- **Email** — sent as a fallback if they do not have push notifications enabled

Every notification you send goes both ways automatically — members with push notifications receive a push, members who only have email receive an email. No one gets left out.

---

## Step-by-Step Instructions

### Step 1 — Open the Notifications tab

1. Click the **Notifications** tab in the tab row at the top of the admin dashboard.

[SHOW: the tab row with Notifications highlighted]

---

### Step 2 — Read the audience stats

At the top of the Notifications tab, you will see four stat cards:

| Stat | What it means |
|---|---|
| **Registered Users** | Total number of accounts in your system |
| **Reachable via Push** | Members who have enabled push notifications |
| **Reachable via Email** | Members who will receive email notifications |
| **Native (iOS + Android)** | Members using the native mobile app |

[SHOW: the four stat cards]
[NARRATE: "These numbers tell you how many people will receive your message. Reachable via Push and Reachable via Email are the important ones — together they represent everyone who will get your notification."]

---

### Step 3 — Choose your audience

Below the stat cards, look for the **Send Notification** section. It has two audience buttons:

1. **All Registered Users** — sends to every member in your system
2. **Specific User** — sends to one individual member

For most announcements, click **All Registered Users**.

If you need to send a test notification to yourself, or reach a specific member, click **Specific User** and then choose the person from the dropdown that appears.

[SHOW: the two audience buttons — All Registered Users selected]
[NARRATE: "All Registered Users is the broadcast option. Specific User is for targeted messages — for example, a reply to a member's inquiry or a test send before a broadcast."]

---

### Step 4 — Write the notification title

1. Click in the **Notification title** field.
2. Type a short, clear subject line.
3. Keep it under 10 words — push notifications truncate long titles on phone screens.
4. Example: "New content in the Vault — AI Executive Order Briefing"

[SHOW: the title field with an example typed]

---

### Step 5 — Write the notification body

1. Click in the **Notification body** field.
2. Type the message body — one to three sentences.
3. Be direct. State what is new and why it matters.
4. Example: "The latest AI policy briefing is now available in your Vault Library. This one breaks down the new executive order and what it means for your organization."

[SHOW: the body field with example text]
[NARRATE: "The body is what the member reads in the notification. Lead with the value — what do they get, and why should they tap? Avoid vague openers like 'Hey there' or 'We just wanted to let you know.'"]

---

### Step 6 — Add an optional link

If you want the notification to take the member to a specific page when they tap it:

1. Click in the **Link URL** field (labeled "Link URL — optional, e.g., /vault, /assessments").
2. Type a path relative to the site — for example:
   - `/vault` — takes them to the Vault Library
   - `/assessments` — takes them to the assessments page
   - `/events` — takes them to the events page
   - `/vault/your-article-slug` — takes them directly to a specific vault item

Leave this field blank if you do not need them to go anywhere specific.

[SHOW: the Link URL field with /vault typed as an example]

---

### Step 7 — Send the notification

1. Click the **Send Notification** button at the bottom of the compose form.
2. The button will show a spinning indicator while the notification is sending.
3. When complete, a green result panel appears showing:
   - How many members were reached
   - How many push notifications were sent
   - How many email notifications were sent
   - Any failed deliveries

[SHOW: the Send Notification button and the green result panel after sending]
[NARRATE: "The result panel shows you exactly what happened. If you see 'push: 0 sent,' it means no one has push notifications enabled and everyone was reached by email instead — which is fine."]

---

### Step 8 — Review the audience list

Below the compose form, you will see the **Audience** table. This lists every registered user and shows their notification channel — push only, email only, both, or no channel.

Use this table to:
- Confirm a specific member is in the audience
- Check who has push notifications enabled
- Search for a member by name or email using the search box above the table

[SHOW: the audience table with the channel badges visible]

---

## Troubleshooting

**Problem: The result panel showed 0 total targets.**
Fix: This should not happen unless you have zero registered users. If you have users, try refreshing the page and sending again. If the issue persists, contact your developer.

**Problem: A member says they did not receive the notification.**
Fix: Check the audience table for that member. If their channel shows "no channel," they have neither push nor email enabled — they opted out of notifications. Members must allow notifications when they sign up or in their account settings.

**Problem: The Send Notification button is greyed out.**
Fix: Both the title and body fields must have content before the button activates. Check that neither field is empty.

**Problem: I made a mistake in the notification — can I unsend it?**
Fix: No. Push notifications and emails cannot be recalled once sent. Always proofread the title and body before clicking Send Notification.

---

## Video Markers for Editor / Cameraman

- [SHOW: Notifications tab selected] — tab row close-up
- [SHOW: four stat cards] — zoom in so the numbers are readable
- [SHOW: two audience buttons — All Registered Users vs Specific User] — zoom in
- [SHOW: title field with example text typed] — zoom in, text must be legible
- [SHOW: body field with example text] — zoom in
- [SHOW: Link URL field with /vault as example] — zoom in
- [SHOW: Send Notification button — loading spinner, then green result panel] — capture both states
- [SHOW: audience table with channel badges] — wide shot of the table, then zoom to the badge column
- [NARRATE: closing] — "In Tutorial 09, we will learn how to manage booking and consultation inquiries from the Inquiries tab."

---

*This tutorial is part of the KLO Admin Video Tutorial series. All field names and button labels are taken directly from the live admin interface at keithlodom.ai.*
