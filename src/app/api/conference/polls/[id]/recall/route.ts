import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyConferenceRole } from "@/lib/conference-auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyConferenceRole(["admin", "moderator"]);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getServiceSupabase();

  // Delete all votes cast against this poll
  const { error: votesError } = await supabase
    .from("conference_poll_votes")
    .delete()
    .eq("poll_id", id);

  if (votesError) {
    return NextResponse.json({ error: votesError.message }, { status: 500 });
  }

  // Reset poll to undeployed state
  const { data, error } = await supabase
    .from("conference_polls")
    .update({
      is_deployed: false,
      is_active: false,
      show_results: false,
      closed_at: null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
