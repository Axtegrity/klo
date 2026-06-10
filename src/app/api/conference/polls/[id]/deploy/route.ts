import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getServiceSupabase();

  // Find the poll's event_id + session_id so we can close sibling polls
  const { data: target } = await supabase
    .from("conference_polls")
    .select("event_id, session_id")
    .eq("id", id)
    .single();

  // Close all other active polls at the same scope before going live.
  // Also resets show_results so audience doesn't see stale results from the previous poll.
  // Prefer event_id scope; fall back to session_id when event_id is absent.
  if (target?.event_id) {
    await supabase
      .from("conference_polls")
      .update({ is_active: false, show_results: false, closed_at: new Date().toISOString() })
      .eq("event_id", target.event_id)
      .eq("is_active", true)
      .neq("id", id);
  } else if (target?.session_id) {
    await supabase
      .from("conference_polls")
      .update({ is_active: false, show_results: false, closed_at: new Date().toISOString() })
      .eq("session_id", target.session_id)
      .eq("is_active", true)
      .neq("id", id);
  }

  const { data, error } = await supabase
    .from("conference_polls")
    .update({ is_deployed: true, is_active: true })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
