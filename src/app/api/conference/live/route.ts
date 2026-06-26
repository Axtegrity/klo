import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getServiceSupabase();

  const { data: event, error } = await supabase
    .from("event_presentations")
    .select("id, title, slug, conference_name, conference_location, event_date, seminar_mode, rehearsal_mode, access_code")
    .eq("seminar_mode", true)
    .eq("is_published", true)
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!event) {
    return NextResponse.json(null);
  }

  const { data: sessions } = await supabase
    .from("conference_sessions")
    .select("id, title, speaker, time_label, room, is_active")
    .eq("event_id", event.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      slug: event.slug,
      conference_name: event.conference_name,
      conference_location: event.conference_location,
      event_date: event.event_date,
      rehearsal_mode: event.rehearsal_mode,
      requires_code: !!event.access_code,
      access_code: event.access_code,
    },
    sessions: sessions ?? [],
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
