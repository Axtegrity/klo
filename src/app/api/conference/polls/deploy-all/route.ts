import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyConferenceRole } from "@/lib/conference-auth";

// POST /api/conference/polls/deploy-all
// Deploys multiple polls simultaneously without closing siblings
export async function POST(request: Request) {
  const auth = await verifyConferenceRole(["admin", "moderator"]);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { poll_ids, auto_show_results } = body as { poll_ids?: string[]; auto_show_results?: boolean };

  if (!poll_ids || !Array.isArray(poll_ids) || poll_ids.length === 0) {
    return NextResponse.json({ error: "poll_ids array required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  // Deploy all polls simultaneously — no sibling closing
  const { data, error } = await supabase
    .from("conference_polls")
    .update({ is_deployed: true, is_active: true, show_results: auto_show_results === true })
    .in("id", poll_ids)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
