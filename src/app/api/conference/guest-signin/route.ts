import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();
  const { display_name, access_code } = body;

  if (!display_name?.trim() || !access_code?.trim()) {
    return NextResponse.json(
      { error: "Name and access code are required" },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();

  // Verify the access code matches an event
  const { data: event, error: eventError } = await supabase
    .from("event_presentations")
    .select("id, title, slug, seminar_mode")
    .eq("access_code", access_code.trim().toUpperCase())
    .single();

  if (eventError || !event) {
    return NextResponse.json(
      { error: "Invalid access code" },
      { status: 401 }
    );
  }

  // Create guest record
  const { data: guest, error: guestError } = await supabase
    .from("conference_guests")
    .insert({
      event_id: event.id,
      display_name: display_name.trim(),
      access_code: access_code.trim().toUpperCase(),
    })
    .select("id, guest_token, display_name, event_id")
    .single();

  if (guestError) {
    return NextResponse.json(
      { error: guestError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    guest_token: guest.guest_token,
    guest_id: guest.id,
    display_name: guest.display_name,
    event_id: guest.event_id,
    event_title: event.title,
    event_slug: event.slug,
  }, { status: 201 });
}
