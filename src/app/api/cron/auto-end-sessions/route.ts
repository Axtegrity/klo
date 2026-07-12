import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Safety-net auto-end: if a host forgets to click "End Event", this cron
// soft-ends the event (seminar_mode: false, event_status: "ended") once its
// own session_end_time has passed by more than GRACE_PERIOD_MS. This is the
// "soft" End Event action, not the "hard" Close Event action — polls stay
// open for stragglers, matching the manual End Event button's behavior.
const GRACE_PERIOD_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_TZ = "America/Chicago";

// Zero-dependency timezone conversion — same native Intl/toLocaleString trick
// as getTodayInTimezone() in src/app/api/live-events/route.ts, extended to
// resolve a full epoch instant rather than just a date string.
//
// `dateStr` is a bare "YYYY-MM-DD" (event_date), `timeStr` is a bare "HH:MM"
// (session_end_time) — neither carries timezone info on its own, so we
// interpret the pair against the event's own `tz`.
//
// This relies on the runtime's own local timezone being UTC when parsing a
// zone-less date string (true for Vercel serverless functions, which default
// TZ=UTC) — the offset math below is what makes it correct regardless, but
// documenting the assumption since it's the one implicit dependency here.
function zonedTimeToUtcInstant(dateStr: string, timeStr: string, tz: string): Date | null {
  const naiveUtc = new Date(`${dateStr}T${timeStr}:00Z`);
  if (isNaN(naiveUtc.getTime())) return null;

  // What does this instant read as, displayed in the target timezone?
  const tzLocalStr = naiveUtc.toLocaleString("en-US", { timeZone: tz });
  const tzAsIfUtc = new Date(tzLocalStr);
  if (isNaN(tzAsIfUtc.getTime())) return null;

  // The gap between the two tells us the UTC offset in effect at this date
  // (correctly handles DST since it's derived from the actual date, not a
  // fixed offset table).
  const offsetMs = naiveUtc.getTime() - tzAsIfUtc.getTime();
  return new Date(naiveUtc.getTime() + offsetMs);
}

interface LiveEventRow {
  id: string;
  event_date: string;
  session_end_time: string | null;
  event_timezone: string | null;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();

  const { data: liveEvents, error } = await supabase
    .from("event_presentations")
    .select("id, event_date, session_end_time, event_timezone")
    .eq("seminar_mode", true)
    .not("session_end_time", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const idsToEnd: string[] = [];

  for (const event of (liveEvents ?? []) as LiveEventRow[]) {
    if (!event.session_end_time) continue;
    const tz = event.event_timezone || DEFAULT_TZ;
    const endInstant = zonedTimeToUtcInstant(event.event_date, event.session_end_time, tz);
    if (!endInstant) continue;
    if (now - endInstant.getTime() >= GRACE_PERIOD_MS) {
      idsToEnd.push(event.id);
    }
  }

  if (idsToEnd.length > 0) {
    const { error: updateError } = await supabase
      .from("event_presentations")
      .update({
        seminar_mode: false,
        event_status: "ended",
        updated_at: new Date().toISOString(),
      })
      .in("id", idsToEnd);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    auto_ended_count: idsToEnd.length,
    auto_ended_ids: idsToEnd,
  });
}
