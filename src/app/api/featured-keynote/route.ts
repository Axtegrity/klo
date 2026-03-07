import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function getLocalTime(tz: string) {
  const now = new Date();
  const local = new Date(now.toLocaleString("en-US", { timeZone: tz }));
  const today = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
  const nowMinutes = local.getHours() * 60 + local.getMinutes();
  return { today, nowMinutes };
}

export async function GET() {
  const supabase = getServiceSupabase();

  const defaultTz = "America/Chicago";

  // Use default timezone to compute a rough "today" for the initial query filter
  const { today } = getLocalTime(defaultTz);

  // Fetch all upcoming published events (today and future)
  const { data: events, error } = await supabase
    .from("event_presentations")
    .select("id, title, conference_name, conference_location, event_date, event_time, event_timezone, description, slug")
    .eq("is_published", true)
    .or(`event_date.gte.${today},event_date.eq.SAVE THE DATE`)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!events || events.length === 0) {
    return NextResponse.json(null);
  }

  // Get today's events that have times set, using each event's own timezone
  const todayEvents = events.filter((e) => {
    if (!e.event_time) return false;
    const tz = e.event_timezone || defaultTz;
    const { today: localToday } = getLocalTime(tz);
    return e.event_date === localToday;
  });

  if (todayEvents.length > 0) {
    const parseTime = (t: string): number => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + (m || 0);
    };

    // Use the first event's timezone for "now" (all same-day events likely share a timezone)
    const tz = todayEvents[0].event_timezone || defaultTz;
    const { nowMinutes } = getLocalTime(tz);

    // Rotation logic:
    // - Start with the earliest event as featured
    // - 60 minutes after an event starts, the NEXT event takes over
    for (let i = todayEvents.length - 1; i >= 0; i--) {
      if (i === 0) {
        return NextResponse.json(todayEvents[0]);
      }
      const prevStart = parseTime(todayEvents[i - 1].event_time!);
      if (nowMinutes >= prevStart + 60) {
        return NextResponse.json(todayEvents[i]);
      }
    }

    // Fallback: show earliest
    return NextResponse.json(todayEvents[0]);
  }

  // No timed events today — return the nearest upcoming event (skip SAVE THE DATE)
  const upcoming = events.find((e) => e.event_date !== "SAVE THE DATE");
  return NextResponse.json(upcoming ?? events[0]);
}
