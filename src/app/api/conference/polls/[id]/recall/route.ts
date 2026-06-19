import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyConferenceRole } from "@/lib/conference-auth";

// POST /api/conference/polls/:id/recall
// Resets a single poll — deletes all votes, sets back to queued state
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

  // Delete all votes for this poll
  const { error: voteErr } = await supabase
    .from("conference_poll_votes")
    .delete()
    .eq("poll_id", id);

  if (voteErr) {
    return NextResponse.json({ error: voteErr.message }, { status: 500 });
  }

  // Reset poll to queued state
  const { data, error } = await supabase
    .from("conference_polls")
    .update({
      is_active: false,
      is_deployed: false,
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
