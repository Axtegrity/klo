import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ATTENDEE_CONTEXT = `
The KLO app (keithlodom.ai) is Pastor Keith L. Odom's conference engagement platform.

GETTING IN:
1. Download the KLO app from the App Store (search "Keith L. Odom") OR open keithlodom.ai in a browser
2. When Keith's event is live, the app shows a full-screen "Live now" entry screen automatically — no navigation needed
3. You can also go directly to keithlodom.ai/join on any device
4. If the event has an access code, Keith will announce it from the podium — enter it when prompted
5. If there are multiple sessions, tap the session name for your room
6. Once inside, you'll see only the Interactive Tools — polls, Q&A, and word cloud. No distractions.

ANSWERING POLLS:
1. Tap the Polls tab
2. Each question appears with multiple choice answers — tap one to submit
3. Results show immediately after you answer each question
4. A progress bar shows how many questions remain
5. When all questions are answered, a completion screen appears
6. You can still see all results after the session ends — they stay permanently at the same URL

Q&A:
1. Tap the Q&A tab at any time during the session
2. Type your question and submit
3. Keith or a moderator may release your question to the full audience

AFTER THE SESSION:
- Poll results remain permanently visible at keithlodom.ai/conference/[event-slug]
- Download results as CSV using the "Download Results" button
- Go back to Keith's site anytime using the "← Back to Keith's site" link

TROUBLESHOOTING:
- Can't find the session? Go to keithlodom.ai/join directly
- Wrong access code? Check with Keith or a team member for today's code
- Polls not showing? The presenter hasn't deployed them yet — wait a moment
- Page looks stuck? Pull down to refresh on mobile
`;

const HOST_CONTEXT = `
The KLO app host flow for Pastor Keith L. Odom:

PRE-EVENT SETUP (do this before the day):
1. Go to keithlodom.ai/admin → Events → select the event
2. Under Sessions — verify session title, speaker, time, room are correct
3. Under Polls — upload your poll document (.docx, .pdf, .txt) — AI parses it automatically
4. Review parsed questions — delete any that look wrong
5. Set an access code in event Details (optional but recommended for private events)
6. Tell attendees in advance: "Download the KLO app, search Keith L. Odom"

DAY OF EVENT:
1. Go to admin → Events → select the event → Sessions panel
2. Optional: click "Rehearse" to test polls privately — only you can see them
3. Click "Exit Rehearsal" when done — polls reset automatically, nothing is archived
4. When ready for attendees: click "Start Event"
5. Announce from podium: "Go to keithlodom.ai/join or open the KLO app"
6. If access code is set: announce the code from the podium

RUNNING POLLS:
1. After clicking Start Event, the Presenter Remote appears in the Sessions panel
2. Choose mode BEFORE deploying any polls:
   - "One at a Time" — deploy one poll, discuss results, move to next
   - "Deploy All" — all polls appear on attendee screens at once
3. One at a Time: click "Start Poll" → discuss results → "Close & Next"
4. Deploy All: click "Deploy All Polls" → all 12 appear simultaneously
5. Toggle "Show results after each question" ON = results show automatically as attendees answer
6. Toggle OFF = use "Push All Results" or per-question push buttons to reveal manually

ENDING THE SESSION:
1. Click "End Event" — archives all results permanently
2. Attendees can see results immediately at the conference page
3. View full results in admin → Events → History section
4. Download CSV from History or from the public conference page

REHEARSAL vs LIVE:
- Rehearse = test mode, non-admins blocked, polls reset on exit, nothing archived
- Start Event = live mode, all attendees can join, results archived when you end

LATECOMERS:
- Attendees can join at any time while the event is live
- If polls are already deployed, latecomers will see them immediately
- If using Deploy All mode, latecomers see all active polls at once

GUIDE:
- Full app guide at keithlodom.ai/guide (admin login required)
`;

const ADMIN_CONTEXT = `
The KLO app admin reference for managing the conference platform:

EVENT MANAGEMENT:
- Admin → Events → New Event to create
- Required: event name, start date
- Optional: end date (for multi-day events), location, access code, website URL
- Toggles: Display on Events Page, Feature on Home Page, Pin as Up Next
- Event states: Upcoming (future date), Today (event date = today), Past (after 11:59 PM on last day)
- Live overrides all states — seminar_mode ON = LIVE regardless of date
- Events move to Past automatically based on date — no manual update needed
- event_status field can force "past" manually if needed

SESSION MANAGEMENT:
- Inside an event → Sessions → Add Session
- Fields: title, speaker, time label, room, start/end time
- Multiple sessions appear as a picker in the attendee entry screen at keithlodom.ai/join
- Q&A modes per session: Show All (public), Single Release (approve each), Hide All
- Sessions can be activated (is_active) independently

POLL MANAGEMENT:
- Inside a session → Polls → Upload a file (.docx, .pdf, .txt, .xlsx)
- AI parses document and extracts questions automatically
- Question numbers in the document are stripped — not included as answer options
- Review parsed questions in the poll list before going live
- Delete individual polls using the trash icon
- Reset All clears all votes and resets polls to Queued state
- Polls deploy from the Presenter Remote during a live session — not from the setup view

ATTENDEE ENTRY:
- keithlodom.ai/join — dedicated entry URL, always shows current live session
- Home page (keithlodom.ai) — shows full-screen gate when event is live
- Simplified mode: when joining via /join, nav/header/footer are hidden — attendees only see polls and Q&A
- Access code gate appears before session entry if code is set on the event
- "← Back to Keith's site" link always visible in simplified mode

RESULTS AND HISTORY:
- Admin → Events → History — shows all past session snapshots
- Each snapshot: poll results with vote bars, percentages, attendee count, Q&A
- Download CSV button on each snapshot (admin view)
- Public results: visible at conference page after session ends, with Download Results CSV button
- Results are permanent — never deleted unless event is deleted

REALTIME BEHAVIOR:
- All pages update automatically — no manual refresh needed
- Start Event → attendee screens activate within seconds
- End Event → all screens update automatically
- seminar_mode change → home page, events page, and conference page all update instantly

GUIDE:
- This guide lives at keithlodom.ai/guide
- Regenerates with AI on every tab click — always reflects current app state
- Update src/app/api/conference/guide/route.ts context strings after every feature change
`;

const CONTEXTS: Record<string, string> = {
  attendee: ATTENDEE_CONTEXT,
  host: HOST_CONTEXT,
  admin: ADMIN_CONTEXT,
};

const PROMPTS: Record<string, string> = {
  attendee: "Write a clear, friendly, step-by-step guide for non-technical attendees joining Keith's live conference session. Use simple language a senior citizen or teenager could follow. Format with numbered steps and short paragraphs. Include what to do if something goes wrong.",
  host: "Write a clear step-by-step guide for Pastor Keith Odom to run his conference session using the KLO app. Cover pre-event setup, going live, running polls, and ending the session. Include tips for common situations like latecomers or technical issues.",
  admin: "Write a comprehensive admin reference guide for managing the KLO conference platform. Cover event creation, session setup, poll management, results, and system behavior. Use clear headings and bullet points.",
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI service not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const tab = body.tab as string;

  if (!tab || !CONTEXTS[tab]) {
    return NextResponse.json({ error: "Invalid tab. Must be attendee, host, or admin." }, { status: 400 });
  }

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      system: `You are a technical writer creating guides for the KLO conference app. Here is the current state of the app:\n\n${CONTEXTS[tab]}`,
      messages: [{ role: "user", content: PROMPTS[tab] }],
    }),
  });

  if (!anthropicRes.ok) {
    return NextResponse.json({ error: "AI service temporarily unavailable." }, { status: 502 });
  }

  const data = await anthropicRes.json();
  const text = data.content?.[0]?.text || "Could not generate guide.";

  return NextResponse.json({ text });
}
