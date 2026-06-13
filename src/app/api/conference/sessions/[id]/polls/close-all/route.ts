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

  // Single query: close all active polls in this session
  const { data, error } = await supabase
    .from("conference_polls")
    .update({ is_active: false, closed_at: new Date().toISOString() })
    .eq("session_id", sessionId)
    .eq("is_active", true)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ closed: (data || []).length });
}
