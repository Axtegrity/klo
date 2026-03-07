import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const guestToken = request.headers.get("x-guest-token");

  if (!guestToken) {
    return NextResponse.json({ error: "No guest token" }, { status: 401 });
  }

  const supabase = getServiceSupabase();

  const { data: guest, error } = await supabase
    .from("conference_guests")
    .select(`
      id,
      display_name,
      event_id,
      access_code,
      created_at,
      event_presentations (
        id,
        title,
        slug,
        seminar_mode,
        conference_name,
        conference_location,
        event_date
      )
    `)
    .eq("guest_token", guestToken)
    .single();

  if (error || !guest) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  return NextResponse.json(guest);
}
