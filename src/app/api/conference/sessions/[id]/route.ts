import { NextResponse } from "next/server";
import { verifyConferenceRole } from "@/lib/conference-auth";
import { getServiceSupabase } from "@/lib/supabase";
import { sessionUpdateSchema } from "@/lib/validation";

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
  const parsed = sessionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const validatedBody = parsed.data;
  const supabase = getServiceSupabase();

  const updates: Record<string, unknown> = {};
  if (typeof validatedBody.title === "string") updates.title = validatedBody.title.trim();
  if (typeof validatedBody.description === "string") updates.description = validatedBody.description.trim() || null;
  if (validatedBody.scheduled_at !== undefined) updates.scheduled_at = validatedBody.scheduled_at;
  if (typeof validatedBody.is_active === "boolean") updates.is_active = validatedBody.is_active;
  if (typeof validatedBody.qa_enabled === "boolean") updates.qa_enabled = validatedBody.qa_enabled;
  if (typeof validatedBody.release_mode === "string") updates.release_mode = validatedBody.release_mode;
  if (typeof validatedBody.speaker === "string") updates.speaker = validatedBody.speaker.trim() || null;
  if (typeof validatedBody.room === "string") updates.room = validatedBody.room.trim() || null;
  if (typeof validatedBody.time_label === "string") updates.time_label = validatedBody.time_label.trim() || null;
  if (typeof validatedBody.sort_order === "number") updates.sort_order = validatedBody.sort_order;

  // Mode lock: session_mode cannot change once polls are deployed
  if (typeof validatedBody.session_mode === "string") {
    const { count: deployedCount } = await supabase
      .from("conference_polls")
      .select("*", { count: "exact", head: true })
      .eq("session_id", id)
      .eq("is_deployed", true);

    if ((deployedCount ?? 0) > 0) {
      return NextResponse.json(
        { error: "Session mode cannot be changed after polls have been deployed." },
        { status: 400 }
      );
    }
    updates.session_mode = validatedBody.session_mode;
  }

  // If activating this session, deactivate others in the same event only
  if (validatedBody.is_active === true) {
    const { data: thisSession } = await supabase
      .from("conference_sessions")
      .select("event_id, release_mode")
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

    // Push this session's content ON — reopen deployed polls; only mass-release
    // questions when mode is "all" (single/hide_all require manual per-question control)
    const effectiveMode = validatedBody.release_mode ?? thisSession?.release_mode;
    await supabase.from("conference_polls").update({ is_active: true }).eq("session_id", id).eq("is_deployed", true);
    if (!effectiveMode || effectiveMode === "all") {
      await supabase.from("conference_questions").update({ released: true }).eq("session_id", id).eq("is_hidden", false).is("archived_at", null);
    }
  }

  // If deactivating this session, pull back its content
  if (validatedBody.is_active === false) {
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
