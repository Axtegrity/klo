import { NextResponse } from "next/server";
import { verifyConferenceRole } from "@/lib/conference-auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const supabase = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("event_id");

  let query = supabase
    .from("conference_sessions")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("scheduled_at", { ascending: true });

  if (eventId) {
    query = query.eq("event_id", eventId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10" },
  });
}

export async function POST(request: Request) {
  const auth = await verifyConferenceRole(["admin", "moderator"]);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, scheduled_at, qa_enabled, release_mode, speaker, room, time_label, sort_order, event_id } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("conference_sessions")
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      scheduled_at: scheduled_at || null,
      qa_enabled: qa_enabled ?? true,
      release_mode: release_mode || "all",
      speaker: speaker?.trim() || null,
      room: room?.trim() || null,
      time_label: time_label?.trim() || null,
      sort_order: sort_order ?? 0,
      ...(event_id ? { event_id } : {}),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
