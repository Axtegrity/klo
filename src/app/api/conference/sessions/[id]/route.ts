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

  // If activating this session, deactivate all others first
  if (body.is_active === true) {
    await supabase
      .from("conference_sessions")
      .update({ is_active: false })
      .neq("id", id);
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
  const { error } = await supabase
    .from("conference_sessions")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
