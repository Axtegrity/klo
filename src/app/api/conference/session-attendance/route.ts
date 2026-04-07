import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { sessionAttendanceSchema } from "@/lib/validation";
import { logError, logRequest } from "@/lib/logger";

export const dynamic = "force-dynamic";

// GET /api/conference/session-attendance?event_id=X — check current session for an event
export async function GET(req: NextRequest) {
  logRequest(req);
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "User ID not found" }, { status: 401 });
  }

  const eventId = req.nextUrl.searchParams.get("event_id");
  if (!eventId) {
    return NextResponse.json({ error: "event_id required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("conference_session_attendees")
    .select("session_id, conference_sessions!inner(id, event_id, title, description, scheduled_at, is_active, qa_enabled, release_mode, speaker, room, time_label, sort_order, created_at)")
    .eq("user_id", userId)
    .is("left_at", null)
    .eq("conference_sessions.event_id", eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ session: null });
  }

  // Return the first active session attendance for this event
  const active = data[0];
  return NextResponse.json({ session: active.conference_sessions });
}

// POST /api/conference/session-attendance — join a session
export async function POST(req: NextRequest) {
  logRequest(req);
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "User ID not found" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = sessionAttendanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }
  const { session_id } = parsed.data;

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
    logError(error, { endpoint: '/api/conference/session-attendance', method: 'POST', session_id, userId });
    return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: 500 });
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

  const deleteBody = await req.json();
  const deleteParsed = sessionAttendanceSchema.safeParse(deleteBody);
  if (!deleteParsed.success) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from("conference_session_attendees")
    .update({ left_at: new Date().toISOString() })
    .eq("session_id", deleteParsed.data.session_id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
