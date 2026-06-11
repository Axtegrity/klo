import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getServiceSupabase();

  const { data: events, error } = await supabase
    .from("event_presentations")
    .select(
      `
      id, title, slug, conference_name, conference_location,
      event_date, event_time, event_timezone, description, notes,
      is_featured, access_code, website_url, start_date, end_date,
      session_name, room_location, display_name_mode, session_end_time,
      hosting_entity, display_on_events_page,
      seminar_mode, pinned_as_next,
      event_files (*)
    `
    )
    .eq("is_published", true)
    .eq("display_on_events_page", true)
    .order("event_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(events ?? []);
}
