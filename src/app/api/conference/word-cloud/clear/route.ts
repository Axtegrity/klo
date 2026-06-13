import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyConferenceRole } from "@/lib/conference-auth";

export async function DELETE(request: Request) {
  const auth = await verifyConferenceRole(["admin", "moderator"]);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("event_id") || undefined;

  const supabase = getServiceSupabase();
  let query = supabase
    .from("conference_word_cloud")
    .delete();

  if (eventId) {
    query = query.eq("event_id", eventId);
  } else {
    query = query.neq("id", "00000000-0000-0000-0000-000000000000"); // delete all rows
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
