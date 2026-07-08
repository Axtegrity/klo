import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { adminEventCreateSchema } from "@/lib/validation";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("event_presentations")
    .select(
      `
      *,
      event_files (*)
    `
    )
    .order("event_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = adminEventCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const {
    title,
    conference_name,
    conference_location,
    event_category,
    description,
    event_date,
    event_time,
    event_timezone,
    website_url,
    end_date,
    notes,
    session_name,
    room_location,
    is_guest_presenter,
    session_end_time,
    access_code,
  } = parsed.data;

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("event_presentations")
    .insert({
      title,
      slug,
      conference_name,
      conference_location,
      event_category: event_category || "Current Events",
      description: description || null,
      event_date,
      event_time: event_time || null,
      event_timezone: event_timezone || "America/Chicago",
      website_url: website_url || null,
      // start_date always mirrors event_date — enforced server-side, ignoring
      // whatever the client sent, since there's no independently-editable
      // start date exposed to admins.
      start_date: event_date,
      end_date: end_date || null,
      notes: notes || null,
      session_name: session_name || null,
      room_location: room_location || null,
      is_guest_presenter: is_guest_presenter || false,
      session_end_time: session_end_time || null,
      access_code: access_code || null,
      is_published: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
