import { NextResponse } from "next/server";
import { verifyConferenceRole } from "@/lib/conference-auth";
import { getServiceSupabase } from "@/lib/supabase";
import { conferenceSettingsUpdateSchema } from "@/lib/validation";

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

  // Per-event seminar mode
  const eventId = searchParams.get("event_id");
  if (eventId) {
    const { data: eventData } = await supabase
      .from("event_presentations")
      .select("seminar_mode")
      .eq("id", eventId)
      .single();

    return NextResponse.json({
      active: eventData?.seminar_mode ?? false,
    });
  }

  // Global seminar mode (fallback)
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

  // Fetch slug of the live event when seminar mode is active
  let eventSlug: string | null = null;
  if (data.value?.active) {
    const { data: liveEvent } = await supabase
      .from("event_presentations")
      .select("slug")
      .eq("seminar_mode", true)
      .maybeSingle();
    eventSlug = liveEvent?.slug ?? null;
  }

  return NextResponse.json({
    ...data.value,
    activeSession: activeSession || null,
    eventSlug,
  });
}

export async function PUT(request: Request) {
  const auth = await verifyConferenceRole(["admin", "moderator"]);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = conferenceSettingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const validatedBody = parsed.data;
  const supabase = getServiceSupabase();

  // Update conference_settings key-value
  if (typeof validatedBody.key === "string" && typeof validatedBody.value === "string") {
    const { error } = await supabase
      .from("conference_settings")
      .upsert({ key: validatedBody.key, value: validatedBody.value, updated_at: new Date().toISOString() });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  // Update seminar mode — per-event or global
  if (typeof validatedBody.active === "boolean") {
    if (validatedBody.event_id) {
      // Per-event seminar mode
      const { error } = await supabase
        .from("event_presentations")
        .update({ seminar_mode: validatedBody.active, updated_at: new Date().toISOString() })
        .eq("id", validatedBody.event_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Global seminar mode
      const { error } = await supabase
        .from("app_settings")
        .update({ value: { active: validatedBody.active }, updated_at: new Date().toISOString() })
        .eq("key", "seminar_mode");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  // Update active session settings (qa_enabled, release_mode)
  if (validatedBody.session_id) {
    const sessionUpdates: Record<string, unknown> = {};
    if (typeof validatedBody.qa_enabled === "boolean") sessionUpdates.qa_enabled = validatedBody.qa_enabled;
    if (typeof validatedBody.release_mode === "string") sessionUpdates.release_mode = validatedBody.release_mode;

    if (Object.keys(sessionUpdates).length > 0) {
      const { error } = await supabase
        .from("conference_sessions")
        .update(sessionUpdates)
        .eq("id", validatedBody.session_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true });
}
