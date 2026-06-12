import { NextResponse } from "next/server";
import { verifyConferenceRole } from "@/lib/conference-auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyConferenceRole(["admin"]);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sessionId } = await params;
  const supabase = getServiceSupabase();

  // 1. Verify session mode is 'simultaneous'
  const { data: session, error: sessionError } = await supabase
    .from("conference_sessions")
    .select("session_mode")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.session_mode !== "simultaneous") {
    return NextResponse.json(
      { error: "Deploy All is only available in simultaneous mode." },
      { status: 400 }
    );
  }

  // 2. Check if any polls are already deployed
  const { count: deployedCount, error: countError } = await supabase
    .from("conference_polls")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("is_deployed", true);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((deployedCount ?? 0) > 0) {
    return NextResponse.json(
      { error: "Polls are already deployed. Use Close All first." },
      { status: 400 }
    );
  }

  // 3. Deploy all undeployed polls in a single query
  const { data, error } = await supabase
    .from("conference_polls")
    .update({ is_deployed: true, is_active: true })
    .eq("session_id", sessionId)
    .eq("is_deployed", false)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deployed: (data || []).length });
}
