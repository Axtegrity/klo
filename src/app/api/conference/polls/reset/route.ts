import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyConferenceRole } from "@/lib/conference-auth";

// POST /api/conference/polls/reset?event_id=X
// Pulls ALL polls for an event back to queue — sets is_deployed=false,
// is_active=false, show_results=false on every poll for this event.
// Also catches polls that only have session_id (no event_id) via a
// session lookup so nothing is missed.
export async function POST(request: Request) {
  const auth = await verifyConferenceRole(["admin", "moderator"]);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("event_id");
  if (!eventId) {
    return NextResponse.json({ error: "event_id required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  // Get all session IDs for this event so we catch polls without event_id
  const { data: eventSessions } = await supabase
    .from("conference_sessions")
    .select("id")
    .eq("event_id", eventId);
  const sessionIds = (eventSessions ?? []).map((s: { id: string }) => s.id);

  const resetValues = {
    is_deployed: false,
    is_active: false,
    show_results: false,
    closed_at: null,
  };

  // Get all poll IDs for this event so we can delete votes
  const { data: eventPolls } = await supabase
    .from("conference_polls")
    .select("id")
    .eq("event_id", eventId);

  const pollIds = (eventPolls ?? []).map((p: { id: string }) => p.id);

  // Delete all votes for these polls
  if (pollIds.length > 0) {
    await supabase
      .from("conference_poll_votes")
      .delete()
      .in("poll_id", pollIds);
  }

  // Reset polls tagged with event_id
  const { error: e1 } = await supabase
    .from("conference_polls")
    .update(resetValues)
    .eq("event_id", eventId);

  // Reset polls that belong to sessions of this event (legacy — no event_id set)
  if (sessionIds.length > 0) {
    await supabase
      .from("conference_polls")
      .update(resetValues)
      .in("session_id", sessionIds)
      .is("event_id", null);
  }

  if (e1) {
    return NextResponse.json({ error: e1.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
