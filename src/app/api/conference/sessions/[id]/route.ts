import { NextResponse } from "next/server";
import { verifyConferenceRole } from "@/lib/conference-auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyConferenceRole(["admin"]);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const supabase = getServiceSupabase();

  const updates: Record<string, unknown> = {};
  if (typeof body.title === "string") updates.title = body.title.trim();
  if (typeof body.description === "string") updates.description = body.description.trim() || null;
  if (body.scheduled_at !== undefined) updates.scheduled_at = body.scheduled_at;
  if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
  if (typeof body.qa_enabled === "boolean") updates.qa_enabled = body.qa_enabled;
  if (typeof body.release_mode === "string") updates.release_mode = body.release_mode;
  if (typeof body.speaker === "string") updates.speaker = body.speaker.trim() || null;
  if (typeof body.room === "string") updates.room = body.room.trim() || null;
  if (typeof body.time_label === "string") updates.time_label = body.time_label.trim() || null;
  if (typeof body.sort_order === "number") updates.sort_order = body.sort_order;

  // If activating this session, deactivate others in the same event only
  if (body.is_active === true) {
    const { data: thisSession } = await supabase
      .from("conference_sessions")
      .select("event_id")
      .eq("id", id)
      .single();

    // Deactivate sibling sessions (and cascade their content OFF)
    let siblingQuery = supabase
      .from("conference_sessions")
      .select("id")
      .neq("id", id);

    if (thisSession?.event_id) {
      siblingQuery = siblingQuery.eq("event_id", thisSession.event_id);
    } else {
      siblingQuery = siblingQuery.is("event_id", null);
    }

    const { data: siblings } = await siblingQuery;

    if (siblings && siblings.length > 0) {
      const siblingIds = siblings.map((s) => s.id);
      await Promise.all([
        supabase.from("conference_sessions").update({ is_active: false }).in("id", siblingIds),
        supabase.from("conference_polls").update({ is_active: false }).in("session_id", siblingIds),
        supabase.from("conference_questions").update({ released: false }).in("session_id", siblingIds),
      ]);
    }

    // Push this session's content ON — reopen deployed polls, re-release questions
    await Promise.all([
      supabase.from("conference_polls").update({ is_active: true }).eq("session_id", id).eq("is_deployed", true),
      supabase.from("conference_questions").update({ released: true }).eq("session_id", id).eq("is_hidden", false).is("archived_at", null),
    ]);
  }

  // If deactivating this session, pull back its content
  if (body.is_active === false) {
    await Promise.all([
      supabase.from("conference_polls").update({ is_active: false }).eq("session_id", id),
      supabase.from("conference_questions").update({ released: false }).eq("session_id", id),
    ]);
  }

  const { data, error } = await supabase
    .from("conference_sessions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyConferenceRole(["admin"]);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getServiceSupabase();

  // Get poll IDs for this session so we can delete their votes
  const { data: sessionPolls } = await supabase
    .from("conference_polls")
    .select("id")
    .eq("session_id", id);

  const pollIds = (sessionPolls || []).map((p) => p.id);

  // Delete votes for those polls, then polls and questions, then the session
  if (pollIds.length > 0) {
    await supabase
      .from("conference_poll_votes")
      .delete()
      .in("poll_id", pollIds);
  }

  await Promise.all([
    supabase.from("conference_polls").delete().eq("session_id", id),
    supabase.from("conference_questions").delete().eq("session_id", id),
  ]);

  const { error } = await supabase
    .from("conference_sessions")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
