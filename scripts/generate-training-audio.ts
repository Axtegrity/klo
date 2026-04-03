/**
 * generate-training-audio.ts
 *
 * Reads training section content, generates professional voice narration
 * via ElevenLabs, and writes MP3 files to public/training/audio/.
 *
 * Run: bun scripts/generate-training-audio.ts
 * Run single: bun scripts/generate-training-audio.ts --section users
 * Regenerate all: bun scripts/generate-training-audio.ts --force
 *
 * Designed to be called from a post-deploy hook or manually.
 * Only regenerates sections whose content has changed (hash-based).
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { createHash } from "crypto";
import { join } from "path";

// ----------------------------------------------------------------
// Config
// ----------------------------------------------------------------

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
if (!ELEVENLABS_API_KEY) {
  console.error("ELEVENLABS_API_KEY not set");
  process.exit(1);
}

// Clara - Corporate & Training Professional (neutral American female)
const VOICE_ID = "tMXujoAjiboschVOhAnk";
const MODEL_ID = "eleven_turbo_v2_5";
const VOICE_SETTINGS = {
  stability: 0.5,   // expressive
  similarity_boost: 0.85,
  style: 0.6,       // upbeat, engaging
  speed: 1.05,      // slightly brisk, not dragging
};

const AUDIO_DIR = join(process.cwd(), "public/training/audio");
const HASH_FILE = join(AUDIO_DIR, ".content-hashes.json");

// ----------------------------------------------------------------
// Training content — mirrors the structure in training/page.tsx
// Each section becomes one audio file with narration.
// ----------------------------------------------------------------

interface TrainingAudioSection {
  id: string;
  title: string;
  narration: string; // The full script to be narrated
}

const SECTIONS: TrainingAudioSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    narration: `Welcome to the KLO Admin Dashboard training guide. Let's start with how to access your dashboard and get oriented.

First, go to keithlodom.ai and click Sign In, or navigate directly to the sign-in page. Enter your admin email and password. Only users with the owner or admin role can access the dashboard.

Once signed in, you'll see a gold "Admin" link in the top navigation bar. Click it to open the dashboard.

The dashboard has twelve tabs across the top: Overview, Customize, Content Manager, Events, Conference, Inquiries, Notifications, Presentations, Users, Content Analytics, Revenue, and Tools.

In the top-right corner, you'll find four utility buttons: Changelog for version history, Request Update to submit change requests to Tim, Training Guide which brings you to this page, and Refresh to reload data on any tab.

A few things to keep in mind: Only admin and owner roles can see the Admin link. Moderators have limited conference access only. The Inquiries tab shows a blue badge with the count of unread inquiries. And if you need a change that isn't available in the dashboard, use the Request Update button.`,
  },
  {
    id: "overview",
    title: "Overview Dashboard",
    narration: `The Overview tab gives you a snapshot of your entire platform at a glance.

At the top, you'll see stat cards showing Total Users with weekly growth, Active Subscriptions, Monthly Recurring Revenue, AI Queries and token usage, Total Polls, and Active Polls.

Below that are three charts. The User Signups chart shows a line graph of new signups over the last 30 days. The Subscription Tiers chart is a bar graph showing how many users are on Free, Pro, and Executive plans. And the AI Advisor Usage chart tracks how often users are chatting with the AI advisor.

All charts refresh when you click the Refresh button in the header. Green arrows on stat cards mean positive week-over-week growth.`,
  },
  {
    id: "customize",
    title: "Customize",
    narration: `The Customize tab lets you control the look and feel of the app without touching any code.

Under Brand Colors, you can edit five colors using color pickers: Primary, Accent Gold, Background, Card Surface, and Body Text.

Feature Toggles let you enable or disable nine features: Assessments, Vault, AI Advisor, Booking, Events, Conference, Strategy Rooms, Feed, and Marketplace. At least three features must stay active at all times.

Homepage Sections lets you show, hide, and reorder seven sections on the homepage: Hero Banner, Upcoming Keynote, Latest Brief, Trending Topics, Featured Insight, AI Tool of the Week, and Assessment Call to Action. The Hero Banner is always visible and cannot be hidden.

When you're done, click Save to apply your changes with a confirmation dialog. Or click Reset to go back to the default settings. Changes take effect immediately for all users.`,
  },
  {
    id: "content-manager",
    title: "Content Manager",
    narration: `The Content Manager tab is where you edit all the text, images, and files that appear on the website — without needing to touch any code.

There are three main areas. Home Page Content lets you edit seven homepage sections: the Hero Banner with its heading and taglines, the Latest Brief, Trending Topics, Featured Insight, AI Tool of the Week, Testimonials, and Quick Links.

The Vault Library lets you manage all vault items. For each item, you can set the title, category, type, level, whether it's premium or free, the description, author, duration, and attach files.

Feed Posts lets you create, edit, delete, and schedule posts that appear in the community feed.

You can also upload PDFs and images to any content section. Each section shows when it was last edited so you can keep track of what's current.`,
  },
  {
    id: "events",
    title: "Events Management",
    narration: `The Events tab is where you create and manage all your conference events.

To add a new event, click the Add Event button. Fill in the title, date, location, conference details, timezone, and an optional access code.

Each event has several actions. The globe icon opens the event's public page so you can preview what attendees see. The star icon features the event on the homepage with a live countdown timer — only one event can be featured at a time. The pencil icon lets you edit all event details.

You can expand any event to upload files like PDFs, presentations, and documents up to 50 megabytes each. These become downloadable by attendees.

There's also an AI Document Parse feature. Upload a conference schedule document and the AI will automatically extract event details — it can handle multiple events from a single file.

Events are split into Current Events for future dates and Previous Events for past dates. The gold star marks the currently featured event.`,
  },
  {
    id: "conference",
    title: "Conference Tools",
    narration: `The Conference tab gives you real-time audience engagement tools for live events.

Start by selecting an event from the list. Once inside, you'll see tools organized into sub-sections.

The Sessions section lets you create individual sessions with a title, speaker, room, and time. You can auto-fetch schedules, toggle Q&A per session, and control which sessions are visible to attendees.

Live Polling lets you create poll questions, deploy them live, and see votes come in real-time. You can create polls one at a time or batch import from a CSV file. Results can be exported.

Q&A Moderation lets you approve or hide audience questions, mark them as answered, archive them, or delete them. Questions are ranked by upvote count.

The Word Cloud shows words that attendees submit in real-time, sized by frequency. You can delete individual words or clear the entire cloud.

Announcements let you broadcast messages to all attendees instantly.

And Settings gives you role management, a profanity filter, and the master engagement toggle.

The most important control is the LIVE switch in the top-right corner. Toggle it on when your event starts, and off when it ends.`,
  },
  {
    id: "inquiries",
    title: "Inquiries",
    narration: `The Inquiries tab shows all booking and consultation requests that come in through the website.

You can search inquiries by name or email. Filter by type — Booking or Consultation — and by status: New, Reviewed, Contacted, or Archived.

Click any inquiry to see the full details: the message, contact information, phone number, and organization.

The typical workflow is to move each inquiry through the stages. When a new one comes in, review it. Once you've read it, mark it as Reviewed. After you've reached out, change it to Contacted. And when it's fully handled, archive it.

The blue badge on the Inquiries tab shows how many unread inquiries are waiting for your attention.`,
  },
  {
    id: "notifications",
    title: "Push Notifications",
    narration: `The Notifications tab lets you send push notifications to users across web browsers, iOS, and Android.

At the top, you'll see subscriber stats with a breakdown by platform.

To send a notification, enter a title and body text. Optionally, add a URL to deep-link users to a specific page when they tap the notification — for example, the vault or an assessment.

You can broadcast to all subscribers or target a specific user. When you tap Send, you'll see a confirmation showing how many devices received it and if there were any failures.

Below the compose area is the full subscriber list showing each person's platform, name, email, and subscription date.`,
  },
  {
    id: "presentations",
    title: "Presentations",
    narration: `The Presentations tab is for uploading downloadable materials for your audience.

To add a new presentation, click Create and fill in the title, description, and category. Then upload files — PDFs, PowerPoints, Word documents, spreadsheets, or text files up to 50 megabytes each.

You can toggle each presentation between Published and Unpublished. Published presentations appear in the public Vault section of the website. Unpublished ones are hidden.

Click the expand arrow on any presentation to see and manage its attached files. You can add more files or remove existing ones.`,
  },
  {
    id: "users",
    title: "User Management",
    narration: `The Users tab is where you manage all registered users on the platform.

Each user appears on their own card showing their name, email, organization, subscription tier, role, and the date they joined.

Use the search bar at the top to find users by name or organization. Results filter as you type. You can also use the tier dropdown to show only Free, Pro, or Executive users.

Each user card has three action buttons at the bottom.

The Disable button temporarily blocks the user from signing in. Their account and data stay intact — they just can't log in. You can click Re-enable at any time to restore their access. This is the safest option when you need to restrict someone.

The Change Role button lets you assign a new role. User is the standard access level. Moderator lets them manage conference tools like Q&A. Admin gives them full dashboard access.

The Delete button permanently disables the account and removes the user's personal data. This cannot be undone, so always try Disable first if you might want to restore access later.

There are built-in safety protections. The owner account — that's Keith's account — is always protected. It cannot be disabled, deleted, or have its role changed by anyone. And you cannot modify your own account from the admin panel, so you can't accidentally lock yourself out.

Disabled users appear dimmed with a red Account Disabled badge on their card.`,
  },
  {
    id: "content-analytics",
    title: "Content Analytics",
    narration: `The Content Analytics tab gives you detailed metrics on assessments, vault content, and strategy rooms.

At the top are three stat cards: total Vault Content items, total Assessments Completed, and Active Strategy Rooms.

Below that is a line chart showing assessment completions over the last 30 days, plus breakdowns by assessment type and vault content type.

You can search assessment results by user name and filter by assessment type — Leadership, Strategic Vision, and others.

Scores are color-coded to help you spot trends at a glance: green for 70 percent and above, yellow for 40 to 69 percent, and red for below 40 percent. This makes it easy to identify users who may need follow-up coaching.

You can delete individual results or use the bulk delete in the Tools tab, which requires typing RESET as a safety measure.`,
  },
  {
    id: "revenue",
    title: "Revenue",
    narration: `The Revenue tab tracks your subscription income and conversion metrics.

The top cards show Monthly Recurring Revenue in dollars, total Paid Subscriptions, and your overall Conversion Rate — the percentage of users who have upgraded to a paid plan.

Below that are three charts. The Subscription Conversions chart shows new paid subscriptions over the last 30 days. The Tier Breakdown is a pie chart showing the distribution across Free, Pro, and Executive. And the Conversion Funnel shows the progression from Total Signups to Free to Pro to Executive with percentages at each stage.

The funnel is particularly useful for understanding where users drop off, so you can focus marketing efforts on the right areas. Revenue updates in real-time based on active Stripe subscriptions.`,
  },
  {
    id: "tools",
    title: "Tools",
    narration: `The Tools tab contains admin-only actions that should be used with care.

Currently, there is one tool: Reset All Assessments. This permanently deletes every assessment result in the system. To confirm, you must type the word RESET — this is a safety measure to prevent accidents.

This tab is intentionally minimal. Only use it when you need a complete fresh start on assessment data. This action cannot be undone.`,
  },
];

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function contentHash(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function loadHashes(): Record<string, string> {
  if (existsSync(HASH_FILE)) {
    return JSON.parse(readFileSync(HASH_FILE, "utf-8"));
  }
  return {};
}

function saveHashes(hashes: Record<string, string>) {
  writeFileSync(HASH_FILE, JSON.stringify(hashes, null, 2));
}

async function generateAudio(text: string, outputPath: string): Promise<void> {
  const resp = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: VOICE_SETTINGS,
      }),
    }
  );

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`ElevenLabs API error ${resp.status}: ${err}`);
  }

  const buffer = Buffer.from(await resp.arrayBuffer());
  writeFileSync(outputPath, buffer);
}

// ----------------------------------------------------------------
// Main
// ----------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const sectionFlag = args.indexOf("--section");
  const targetSection = sectionFlag >= 0 ? args[sectionFlag + 1] : null;

  mkdirSync(AUDIO_DIR, { recursive: true });

  const hashes = loadHashes();
  let generated = 0;
  let skipped = 0;

  const sections = targetSection
    ? SECTIONS.filter((s) => s.id === targetSection)
    : SECTIONS;

  if (targetSection && sections.length === 0) {
    console.error(`Section "${targetSection}" not found. Available: ${SECTIONS.map((s) => s.id).join(", ")}`);
    process.exit(1);
  }

  console.log(`\nGenerating training audio (${sections.length} sections)...\n`);

  for (const section of sections) {
    const hash = contentHash(section.narration);
    const outputPath = join(AUDIO_DIR, `${section.id}.mp3`);

    if (!force && hashes[section.id] === hash && existsSync(outputPath)) {
      console.log(`  [skip] ${section.id} — content unchanged`);
      skipped++;
      continue;
    }

    process.stdout.write(`  [gen]  ${section.id} — "${section.title}"...`);

    try {
      await generateAudio(section.narration, outputPath);
      hashes[section.id] = hash;
      const size = readFileSync(outputPath).length;
      console.log(` done (${(size / 1024).toFixed(0)}KB)`);
      generated++;
    } catch (err) {
      console.log(` FAILED`);
      console.error(`         ${err}`);
    }

    // Small delay between API calls to be respectful
    if (sections.indexOf(section) < sections.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  saveHashes(hashes);

  console.log(`\nDone: ${generated} generated, ${skipped} skipped (unchanged)\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
