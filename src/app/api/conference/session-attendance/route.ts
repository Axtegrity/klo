import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// POST /api/conference/session-attendance — join a session
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "User ID not found" }, { status: 401 });
  }

  const { session_id } = await req.json();
  if (!session_id) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  // Get the target session's event_id
  const { data: targetSession } = await supabase
    .from("conference_sessions")
    .select("event_id, time_label")
    .eq("id", session_id)
    .single();

  if (!targetSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Check if user is already in an active session for the same event
  if (targetSession.event_id) {
    const { data: activeSessions } = await supabase
      .from("conference_session_attendees")
      .select("id, session_id, conference_sessions!inner(event_id)")
      .eq("user_id", userId)
      .is("left_at", null);

    const conflict = activeSessions?.find(
      (s: Record<string, unknown>) =>
        (s.conference_sessions as Record<string, unknown>)?.event_id === targetSession.event_id
    );

    if (conflict) {
      return NextResponse.json(
        {
          error: "You are already in a session for this event. Please leave that session first.",
          conflicting_session_id: conflict.session_id,
        },
        { status: 409 }
      );
    }
  }

  const { error } = await supabase
    .from("conference_session_attendees")
    .upsert(
      {
        session_id,
        user_id: userId,
        joined_at: new Date().toISOString(),
        left_at: null,
      },
      { onConflict: "session_id,user_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/conference/session-attendance — leave a session
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "User ID not found" }, { status: 401 });
  }

  const { session_id } = await req.json();

  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from("conference_session_attendees")
    .update({ left_at: new Date().toISOString() })
    .eq("session_id", session_id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
