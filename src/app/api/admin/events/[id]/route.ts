import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { adminEventUpdateSchema } from "@/lib/validation";
import { verifyAdmin } from "@/lib/admin-auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = adminEventUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const validatedBody = parsed.data;
  const supabase = getServiceSupabase();

  // Explicit allowlist — never spread raw body into DB
  const ALLOWED_FIELDS = [
    "title", "description", "conference_name", "conference_location",
    "event_category", "event_date", "event_time", "event_timezone", "is_published", "is_featured", "slug",
    "access_code", "seminar_mode", "website_url", "start_date", "end_date",
    "notes", "session_name", "room_location", "is_guest_presenter", "session_end_time",
    "event_status", "event_status_override", "display_name_mode",
    "hosting_entity", "display_on_events_page",
  ] as const;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ALLOWED_FIELDS) {
    if (key in validatedBody) updates[key] = validatedBody[key as keyof typeof validatedBody];
  }

  const { data, error } = await supabase
    .from("event_presentations")
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
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getServiceSupabase();

  const { error } = await supabase
    .from("event_presentations")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
