import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ATTENDEE_CONTEXT = `
The KLO app (keithlodom.ai) is Pastor Keith L. Odom's conference engagement platform.

ATTENDEE FLOW:
1. Download the KLO app from the App Store (search "Keith L. Odom") OR open keithlodom.ai in a browser
2. When Keith's event is live, the app shows a full-screen "Live now" entry screen automatically
3. If the event has an access code, enter the code Keith announces from the podium
4. If there are multiple sessions, tap the session name to join your room
5. Once inside, tap the Polls tab to see and answer poll questions
6. Each question has multiple choice answers — tap one to submit
7. After answering, results show immediately for that question
8. Progress bar at top shows how many questions remain
9. When all questions are answered, a completion screen appears
10. Use the Q&A tab to submit questions to Keith at any time during the session
11. Results remain visible at keithlodom.ai/conference/[event-slug] after the session ends
12. Download poll results as CSV using the "Download Results" button

ACCESS:
- Web: keithlodom.ai/join (shows current live session)
- App: Download from App Store, search "Keith L. Odom"
- Direct link: keithlodom.ai/conference/northern-nevada-first-jurisdiction-holy-convocation
`;

const HOST_CONTEXT = `
The KLO app host flow for Pastor Keith L. Odom:

PRE-EVENT SETUP:
1. Go to keithlodom.ai/admin → Events → select the event
2. Under Sessions, verify the session is set up with correct title, speaker, time
3. Under Polls, verify all 12 polls are uploaded and queued (not deployed)
4. Set an access code in event Details if you want to restrict entry
5. Tell attendees: "Download the KLO app, search Keith L. Odom"

DAY OF EVENT:
1. Go to admin → Events → select the event → Sessions
2. Click "Start Event" — this opens the event to attendees
3. Announce the access code from the podium if one is set
4. Attendees go to keithlodom.ai/join or open the app

RUNNING POLLS:
1. In the Sessions panel, the Presenter Remote appears after clicking Start Event
2. Choose "One at a Time" or "Deploy All" mode
3. One at a Time: click "Start Poll" for each question, discuss results, click "Close & Next"
4. Deploy All: click "Deploy All Polls" — all 12 appear on attendee screens at once
5. With "Show results after each question" toggle ON — results show automatically as attendees answer
6. With toggle OFF — use "Push All Results" or per-question push buttons to reveal results manually

ENDING THE SESSION:
1. Click "End Event" in the Presenter Remote — archives all results
2. Results are permanently available at the conference page for attendees
3. View full results in admin → Events → History section
4. Download CSV from History or from the public conference page

REHEARSAL MODE:
1. Click "Rehearse" instead of "Start Event" to test without attendees seeing
2. Click "Exit Rehearsal" when done — polls reset automatically, nothing is archived
3. Rehearsal does not block you from going live afterward

HOST DASHBOARD (mobile):
- Go to keithlodom.ai/host on your phone for a mobile-optimized control panel
`;

const ADMIN_CONTEXT = `
The KLO app admin flow for managing events, sessions, and polls:

EVENT MANAGEMENT:
- Admin → Events → New Event to create
- Fill in: event name, date, location, access code (optional)
- Toggle "Display on Events Page" to show on public events listing
- Toggle "Pin as Up Next" to feature on home page

SESSION MANAGEMENT:
- Inside an event → Sessions → Add Session
- Set session title, speaker, time label, room
- Multiple sessions appear as a picker in the attendee entry screen
- Q&A can be enabled/disabled per session
- Q&A release modes: Show All (public), Single Release (Keith approves each), Hide All

POLL MANAGEMENT:
- Inside a session → Polls → Upload a file (.docx, .pdf, .txt)
- AI parses the document and extracts questions automatically
- Review questions in the poll list — delete any that parsed incorrectly
- Polls sit as "Queued" until deployed during a live session
- Reset All clears all votes and resets polls to queued state

RESULTS AND HISTORY:
- Admin → Events → History section shows all past session snapshots
- Each snapshot shows full poll results with vote bars and percentages
- Download CSV button available on each snapshot
- Public results visible at the conference page after session ends

REALTIME BEHAVIOR:
- All pages update automatically when event state changes — no manual refresh needed
- When Keith clicks Start Event, attendee screens activate within seconds
- When Keith ends session, all screens update automatically

EVENT STATE RULES:
- seminar_mode ON = event is live, attendees can participate
- rehearsal_mode ON = rehearsal only, non-admins blocked
- Today's events show in "Today" section on events page
- Past events move automatically at 11:59 PM on last day
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
