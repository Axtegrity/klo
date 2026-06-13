import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyConferenceRole } from "@/lib/conference-auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyConferenceRole(["admin", "moderator"]);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getServiceSupabase();

  // Fetch the target poll's scope so we can close siblings in the same event/session
  const { data: targetPoll } = await supabase
    .from("conference_polls")
    .select("session_id, event_id")
    .eq("id", id)
    .single() as { data: { session_id: string | null; event_id: string | null } | null };

  if (targetPoll) {
    const closeQuery = supabase
      .from("conference_polls")
      .update({ is_active: false, closed_at: new Date().toISOString() })
      .neq("id", id)
      .eq("is_active", true);

    if (targetPoll.event_id) {
      await closeQuery.eq("event_id", targetPoll.event_id);
    } else if (targetPoll.session_id) {
      await closeQuery.eq("session_id", targetPoll.session_id);
    }
  }

  // Guard: require an active session before deploying. Polls are invisible to
  // attendees without one, so surface the gap here rather than silently deploying.
  if (targetPoll?.session_id) {
    const { data: activeSession } = await supabase
      .from("conference_sessions")
      .select("id")
      .eq("id", targetPoll.session_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!activeSession) {
      return NextResponse.json(
        { error: "No active session found. Activate a session before deploying polls." },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("conference_polls")
    .update({ is_deployed: true, is_active: true })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
