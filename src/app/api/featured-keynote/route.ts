import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getServiceSupabase();

  // Always show the nearest upcoming published event (closest future date first)
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("event_presentations")
    .select("id, title, conference_name, conference_location, event_date, description, slug")
    .eq("is_published", true)
    .or(`event_date.gte.${today},event_date.eq.SAVE THE DATE`)
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
