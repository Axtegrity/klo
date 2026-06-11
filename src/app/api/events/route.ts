import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getServiceSupabase();

  const { data: events, error } = await supabase
    .from("event_presentations")
    .select("*, event_files(*)")
    .eq("is_published", true)
    .eq("display_on_events_page", true)
    .order("event_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(events ?? []);
}
