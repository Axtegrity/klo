import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { announcementCreateSchema } from "@/lib/validation";
import { verifyConferenceRole } from "@/lib/conference-auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("event_id") || undefined;
  const supabase = getServiceSupabase();

  let query = supabase
    .from("conference_announcements")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (eventId) query = query.eq("event_id", eventId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=3, stale-while-revalidate=10" },
  });
}

export async function POST(request: Request) {
  const auth = await verifyConferenceRole(["admin", "moderator"]);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = announcementCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Title and message are required" },
      { status: 400 }
    );
  }
  const { title, message, event_id } = parsed.data;

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("conference_announcements")
    .insert({ title: title.trim(), message: message.trim(), ...(event_id ? { event_id } : {}) })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: Request) {
  const auth = await verifyConferenceRole(["admin", "moderator"]);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from("conference_announcements")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
