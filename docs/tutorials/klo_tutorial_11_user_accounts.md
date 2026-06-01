# Tutorial 11: Managing User Accounts
**Duration estimate:** 8 minutes
**Series:** KLO Admin Video Tutorials

---

## Prerequisites

Before you start this tutorial, you need:
- Admin access (see Tutorial 01)
- The admin dashboard open at keithlodom.ai/admin

---

## What You Will Learn

By the end of this video, you will know how to view all registered users, search and filter by tier, read a user's account details, disable or re-enable an account, change a user's role, and permanently delete an account.

---

## Step-by-Step Instructions

### Step 1 — Open the Users tab

1. Click the **Users** tab in the tab row at the top of the admin dashboard.

[SHOW: the tab row with Users highlighted]
[NARRATE: "The Users tab shows every account that has ever been registered on the site — free members, paid subscribers, moderators, and admins. It is your member roster."]

---

### Step 2 — Read the Users tab layout

At the top of the Users tab, you will see:
1. A **search box** on the left — filters by name or organization
2. A **tier filter dropdown** on the right — filters by Free, Pro, or Executive
3. A total user count below the filters — for example, "47 users total"
4. A list of user cards below the count

[SHOW: the search box, tier filter dropdown, and user count]

---

### Step 3 — Search for a specific user

1. Click in the search box.
2. Type the person's name or organization name.
3. The list filters as you type.

[SHOW: typing in the search box and the list filtering]
[NARRATE: "The search matches against the user's full name and organization name. It does not search by email address. If you need to find someone by email, you will need to scroll the list or use the browser's find function."]

---

### Step 4 — Filter by subscription tier

1. Click the **All Tiers** dropdown.
2. Choose one:
   - **Free** — free accounts
   - **Pro** — Pro subscribers
   - **Executive** — Executive subscribers
3. The list updates to show only users in that tier.

[SHOW: the tier dropdown open with all options visible]

---

### Step 5 — Read a user card

Each user card shows:

| Field | What it means |
|---|---|
| **Full name** | The user's name as registered |
| **Email** | Their email address |
| **Organization** | Their organization if they provided one |
| **Subscription tier badge** | Free, Pro, or Executive |
| **Role badge** | user, moderator, or admin |
| **Joined date** | When they registered |
| **Account Disabled badge** | Only shows if the account has been disabled |

On the right side of the card, you will see action buttons — but only for accounts you are allowed to manage. Your own account shows a **You** badge and has no action buttons. The owner account (the main admin) is protected and shows an **Owner** badge.

[SHOW: a user card with all fields labeled]
[PAUSE: let them read the fields]

---

### Step 6 — Disable an account

Use the Disable action when a member's behavior warrants temporary suspension — or when you need to block access while you investigate something. The account is not deleted; the person simply cannot sign in until re-enabled.

1. Find the user card.
2. Click the **Disable** button on the right side of the card.
3. A confirmation modal will appear: "Disable [name]? They will not be able to sign in until re-enabled."
4. Click **Disable** to confirm, or **Cancel** to go back.

[SHOW: the Disable button and the confirmation modal]
[NARRATE: "A disabled account shows an 'Account Disabled' badge on its card and the card appears dimmed. The user cannot log in, but all their data is preserved."]

---

### Step 7 — Re-enable a disabled account

1. Find the user's card — it will show an "Account Disabled" badge and appear dimmed.
2. Click the **Re-enable** button (it replaces the Disable button when an account is disabled).
3. A confirmation modal appears: "Re-enable [name]? They will be able to sign in again."
4. Click **Enable** to confirm.

[SHOW: a disabled card with the Re-enable button, and the Enable confirmation in the modal]

---

### Step 8 — Change a user's role

Roles control what level of access a user has beyond their subscription tier.

| Role | What they can do |
|---|---|
| **user** | Standard member access — no admin privileges |
| **moderator** | Can moderate Q&A and content |
| **admin** | Full admin dashboard access |

To change a role:

1. Find the user card.
2. Click the **Change Role** button.
3. A modal will appear with a dropdown.
4. Click the dropdown and choose the new role: **user**, **moderator**, or **admin**.
5. Click **Update Role**.

[SHOW: the Change Role modal with the role dropdown open]
[NARRATE: "Be very careful about granting admin access. Admin accounts have full control of the site — they can delete content, change settings, send notifications, and manage other users. Only give admin access to people you fully trust and who genuinely need it."]

---

### Step 9 — Delete an account permanently

Use this only when an account must be removed entirely — for example, a fraudulent account or a user who has formally requested deletion under privacy law.

Deletion is permanent and cannot be undone. The user's data will be anonymized.

1. Find the user card.
2. Click the **Delete** button.
3. A confirmation modal will appear with a red warning: "This action cannot be undone. This will permanently disable [name]'s account and anonymize their data."
4. Click **Delete** to confirm, or **Cancel** to go back.

[SHOW: the Delete confirmation modal with the red warning text visible]
[NARRATE: "The system anonymizes data rather than hard-deletes it — this is required for audit trail and legal compliance. The user cannot log in, and their personally identifiable information is removed, but system records remain for integrity purposes."]

---

### Step 10 — Navigate between pages

If you have more than 20 users, the list paginates.

1. Look at the bottom of the user list for the pagination controls.
2. Click **Previous** or **Next** to move between pages.
3. A counter shows your current position — for example, "Page 2 of 5."

[SHOW: the pagination controls at the bottom]

---

## Troubleshooting

**Problem: I cannot see any action buttons on a user card.**
Fix: Action buttons do not appear on your own account (marked "You") or on the Owner account (marked "Owner"). These are protected. For other accounts, check that you are logged in as an admin or owner.

**Problem: A user says they cannot log in, but I see no "Account Disabled" badge on their card.**
Fix: The issue may be with their password or email address rather than their account status. Ask them to use the "Forgot Password" feature on the sign-in page. If they still cannot log in, contact your developer to reset credentials.

**Problem: I changed a user's role but they say their access did not change.**
Fix: The user needs to sign out and sign back in for role changes to take effect. Role information is stored in their session, which only refreshes on a new sign-in.

---

## Video Markers for Editor / Cameraman

- [SHOW: Users tab selected] — tab row close-up
- [SHOW: search box, tier dropdown, user count] — labeled wide shot
- [SHOW: typing in search box — list filtering] — smooth typing, list responds
- [SHOW: tier dropdown open — all options visible] — capture the full dropdown
- [SHOW: a user card with all fields visible] — zoom in so text is readable
- [PAUSE: let them read the fields] — hold 3 seconds
- [SHOW: Disable button — confirmation modal] — zoom in on modal text
- [SHOW: disabled card (dimmed) — Re-enable button] — show the visual difference
- [SHOW: Change Role modal — dropdown open with three options] — zoom in on role options
- [SHOW: Delete confirmation modal — red warning text] — zoom in on the warning
- [SHOW: pagination controls at bottom] — zoom in
- [NARRATE: closing] — "In Tutorial 12, we will learn how to create a survey and review the responses from the Surveys tab."

---

*This tutorial is part of the KLO Admin Video Tutorial series. All button labels, role names, and confirmation text are taken directly from the live admin interface at keithlodom.ai.*
