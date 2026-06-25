import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Public endpoint — no auth required
// Returns the most recent session snapshot for an event
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("event_id");

  if (!eventId) {
    return NextResponse.json({ error: "event_id required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("conference_session_snapshots")
    .select("id, session_id, event_id, created_at, snapshot_data")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(null);
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
