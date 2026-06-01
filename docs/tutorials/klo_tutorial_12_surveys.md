# Tutorial 12: Creating and Reviewing Surveys
**Duration estimate:** 10 minutes
**Series:** KLO Admin Video Tutorials

---

## Prerequisites

Before you start this tutorial, you need:
- Admin access (see Tutorial 01)
- A clear idea of what you want to survey — a title and at least a rough set of questions
- The admin dashboard open at keithlodom.ai/admin

---

## What You Will Learn

By the end of this video, you will know how to create a new survey, activate it so members can take it, display it as a callout on the home page, review the live response data, use the cross-filter to break down answers by segment, and export results to a spreadsheet.

---

## How Surveys Work

Surveys in KLO are multi-question forms that members complete from the website. Responses are stored in the database and viewable in real time in the admin dashboard.

Each survey has:
- A title and description
- An optional intro message shown before the questions begin
- An active/inactive toggle that controls whether members can submit responses
- A homepage toggle that places a "Take the Survey" callout on the home page

Questions and sections are managed by your developer in the database. This tutorial focuses on the admin actions you control: creating the survey shell, activating it, managing visibility, and reviewing results.

---

## Step-by-Step Instructions

### Step 1 — Open the Surveys tab

1. Click the **Surveys** tab in the tab row at the top of the admin dashboard.

[SHOW: the tab row with Surveys highlighted]

---

### Step 2 — Read the Surveys list

The Surveys tab opens to a list of all surveys you have created. Each survey card shows:
- The survey title
- The response count
- Whether it is active or inactive
- Whether it is displayed on the home page

Action icons on the right of each card:
- **Power icon** — activates or deactivates the survey
- **Eye icon** — shows or hides the homepage callout
- **Bar chart icon** — opens the results view for this survey
- **Pencil icon** — opens the edit modal
- **Trash icon** — deletes the survey permanently

[SHOW: the survey list with action icons labeled]

---

### Step 3 — Create a new survey

1. Click the **New Survey** button in the top-right corner of the Surveys tab.

A modal window will appear with a form.

[SHOW: the New Survey button and the modal opening]

---

### Step 4 — Fill in the survey form

**Title** (required)
- The name of the survey — shown to members.
- Example: "AI Readiness Survey"

**Slug** (required)
- Auto-generated from the title. It becomes part of the survey URL.
- Example: `ai-readiness-survey`
- The slug is auto-filled from the title — you can leave it as is unless you need a custom URL.
- Important: only lowercase letters, numbers, and hyphens. No spaces.

[SHOW: the title and slug fields]
[NARRATE: "The slug creates the survey's URL. Once you share the survey link with members, changing the slug will break that link. Choose it carefully before activating the survey."]

**Description**
- A brief description shown to participants before they begin.
- Example: "This survey helps us understand how ready your organization is to adopt AI strategies."

**Intro text**
- A welcome message shown on the survey's opening screen, before the first question.
- Use this for instructions, a personal note from Keith, or context about why you are asking.

**Active toggle**
- When on (green), members can access and submit the survey.
- When off, the survey exists in your system but no one can submit responses.

**Show on homepage toggle**
- When on (blue), a "Take the Survey" callout appears on the home page.
- When off, the survey is only accessible via its direct URL.

[SHOW: the two toggles at the bottom of the form]
[NARRATE: "You can create a survey with both toggles off — useful for drafting a survey before it is ready to go live. Turn Active on when you are ready for responses. Turn Homepage on only when you want to promote it prominently."]

---

### Step 5 — Save the survey

1. Click **Create survey** at the bottom of the modal.
2. The modal will close and the new survey will appear in the Surveys list.

[SHOW: the Create survey button and the new survey appearing in the list]

---

### Step 6 — Activate the survey

If you created the survey with Active toggled off, activate it when you are ready:

1. Find the survey in the list.
2. Click the **Power icon** on the right side of the survey card.
3. The icon turns green, and the survey status shows "Active."

[SHOW: the power icon turning green — active state]
[NARRATE: "Active means members can open the survey URL and submit responses. Nothing forces them to take it — Active just means the door is open."]

---

### Step 7 — Enable the homepage callout (optional)

To place a survey callout on the home page:

1. Find the survey in the list.
2. Click the **Eye icon** on the right side of the card.
3. The icon turns blue, and "On Homepage" appears next to the response count.

[SHOW: the eye icon turning blue]
[NARRATE: "The homepage callout drives participation. When it is on, members see a prompt to take the survey every time they visit the home page. Turn this off when the survey is closed or when you no longer want to feature it prominently."]

---

### Step 8 — Review survey results

1. Find the survey in the list.
2. Click the **bar chart icon**, or click the survey title itself.
3. You will enter the results view.

The results view shows:
- The total number of respondents at the top
- Each question grouped by section
- For single-choice and multiple-choice questions: a bar chart with vote counts and percentages
- For open-text questions: a scrollable list of written responses
- The leading answer is highlighted in gold

[SHOW: the results view with bar charts and response counts]
[PAUSE: let them read the results]
[NARRATE: "The results update in real time — if a member submits a response while you are looking at this screen, you can refresh to see it. There is no delay between submission and display."]

---

### Step 9 — Expand and collapse sections

If the survey has multiple sections, each section is shown as a collapsible block.

1. Click on a section header to expand it and see the questions inside.
2. Click again to collapse it.

All sections start expanded by default.

[SHOW: collapsing and expanding a section]

---

### Step 10 — Use the Cross-Filter

The cross-filter lets you segment results by one question's answer. For example: "Show me only the responses from people who answered 'Executive' to the role question."

1. In the results view, look for the **Cross-Filter** panel near the top.
2. Click the first dropdown — **Filter by question** — and choose a single-choice question from your survey.
3. A second dropdown will appear — **Select answer** — choose a specific answer to filter by.
4. Click **Apply**.

The results for all other questions will now show only the responses from people who gave that specific answer.

[SHOW: the cross-filter panel with both dropdowns and the Apply button]
[NARRATE: "Cross-filter is your most powerful analysis tool. If you want to know what executives think versus individual contributors, or how one region answered differently from another, this is how you find out."]

**To clear the filter:**
1. Click the **Clear** button that appears after applying a filter.
2. The results return to showing all respondents.

---

### Step 11 — Export results to CSV

1. In the results view, look for the **Export CSV** button in the top-right area.
2. Click **Export CSV**.
3. Your browser will download a file named after the survey — for example, `ai-readiness-survey-results.csv`.
4. Open it in Excel, Google Sheets, or any spreadsheet app.

The CSV contains one row per question per answer option, with vote counts and percentages.

[SHOW: the Export CSV button and the file downloading]
[NARRATE: "CSV files open in any spreadsheet. This is how you share results with a team, create charts for a presentation, or archive the data from a completed survey."]

---

### Step 12 — Deactivate and archive the survey

When the survey period is over:

1. Click the **Power icon** on the survey card to turn it off (it returns to grey).
2. Click the **Eye icon** to turn off the homepage callout if it was on.

Members who try to access the survey URL will see that it is closed. Their existing responses are preserved in the database.

[SHOW: power icon turning grey — survey showing Inactive]

---

## Troubleshooting

**Problem: The survey is Active but members say they cannot find it.**
Fix: If the homepage callout is off, members can only reach the survey via its direct URL. Share the URL with them or turn on the homepage callout so it is visible.

**Problem: The response count is stuck at zero even though members are taking the survey.**
Fix: Click the back button to exit the results view, then click back in. The count on the survey card refreshes when you re-enter. If the count is genuinely zero after members have taken it, contact your developer.

**Problem: Export CSV downloaded a blank or corrupted file.**
Fix: Try again from a different browser. If the survey has zero responses, the CSV will be nearly empty — confirm there are actual responses before exporting.

**Problem: I cannot see the cross-filter panel.**
Fix: The cross-filter only appears if the survey has at least one single-choice question. Open-text-only surveys do not support cross-filtering.

**Problem: I deleted a survey by accident.**
Fix: Deletion is permanent and cannot be undone from the admin panel. Contact your developer immediately — recovery may be possible from a database backup if caught quickly.

---

## Video Markers for Editor / Cameraman

- [SHOW: Surveys tab selected] — tab row close-up
- [SHOW: survey list with action icons labeled] — wide shot with callouts
- [SHOW: New Survey button — modal opening] — smooth transition
- [SHOW: title and slug fields filled] — zoom in, text legible
- [SHOW: description and intro text fields] — scroll down to show both
- [SHOW: Active and Show on Homepage toggles] — zoom in on both
- [SHOW: Create survey button] — zoom in
- [SHOW: new survey in list] — confirm it appears
- [SHOW: power icon turning green — Active status] — slow click
- [SHOW: eye icon turning blue — On Homepage] — slow click
- [SHOW: results view with bar charts] — wide shot showing all sections
- [PAUSE: let them read the results] — hold 4 seconds
- [SHOW: section being collapsed and expanded] — smooth animation
- [SHOW: cross-filter panel — both dropdowns in use — Apply button] — zoom in
- [SHOW: Export CSV button and download] — capture the file downloading
- [SHOW: power icon turning grey — Inactive] — confirm off state
- [NARRATE: closing] — "That completes the KLO Admin Video Tutorial series. You now have everything you need to run and maintain your platform independently. If you ever need help, use the Request Update button in the admin dashboard to reach your developer team."

---

*This tutorial is part of the KLO Admin Video Tutorial series. All field names, toggle labels, button labels, and feature names are taken directly from the live admin interface at keithlodom.ai.*
