import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function getTodayInTimezone(tz: string): string {
  const now = new Date();
  const local = new Date(now.toLocaleString("en-US", { timeZone: tz }));
  return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
}

export async function GET() {
  const supabase = getServiceSupabase();
  const defaultTz = "America/Chicago";
  const today = getTodayInTimezone(defaultTz);

  // Fetch all published events for today
  const { data: events, error } = await supabase
    .from("event_presentations")
    .select("id, title, slug, conference_name, conference_location, event_date, event_time, event_timezone, description, website_url, start_date, end_date")
    .eq("is_published", true)
    .eq("event_date", today)
    .order("event_time", { ascending: true, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Double-check using each event's own timezone
  const liveEvents = (events ?? []).filter((e) => {
    const tz = e.event_timezone || defaultTz;
    const localToday = getTodayInTimezone(tz);
    return e.event_date === localToday;
  });

  return NextResponse.json(liveEvents);
}
