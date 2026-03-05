import { NextResponse } from "next/server";
import { verifyConferenceRole } from "@/lib/conference-auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  const supabase = getServiceSupabase();

  // If a specific conference_settings key is requested
  if (key) {
    const { data } = await supabase
      .from("conference_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    return NextResponse.json({ key, value: data?.value ?? null });
  }

  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "seminar_mode")
    .single();

  if (error) {
    return NextResponse.json({ active: false });
  }

  // Also fetch active session settings if one exists
  const { data: activeSession } = await supabase
    .from("conference_sessions")
    .select("id, title, qa_enabled, release_mode")
    .eq("is_active", true)
    .maybeSingle();

  return NextResponse.json({
    ...data.value,
    activeSession: activeSession || null,
  });
}

export async function PUT(request: Request) {
  const auth = await verifyConferenceRole(["admin", "moderator"]);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = getServiceSupabase();

  // Update conference_settings key-value
  if (typeof body.key === "string" && typeof body.value === "string") {
    const { error } = await supabase
      .from("conference_settings")
      .upsert({ key: body.key, value: body.value, updated_at: new Date().toISOString() });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  // Update seminar mode
  if (typeof body.active === "boolean") {
    const { error } = await supabase
      .from("app_settings")
      .update({ value: { active: body.active }, updated_at: new Date().toISOString() })
      .eq("key", "seminar_mode");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Update active session settings (qa_enabled, release_mode)
  if (body.session_id) {
    const sessionUpdates: Record<string, unknown> = {};
    if (typeof body.qa_enabled === "boolean") sessionUpdates.qa_enabled = body.qa_enabled;
    if (typeof body.release_mode === "string") sessionUpdates.release_mode = body.release_mode;

    if (Object.keys(sessionUpdates).length > 0) {
      const { error } = await supabase
        .from("conference_sessions")
        .update(sessionUpdates)
        .eq("id", body.session_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true });
}
