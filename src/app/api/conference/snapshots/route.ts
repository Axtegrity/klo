import { NextResponse } from "next/server";
import { verifyConferenceRole } from "@/lib/conference-auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const auth = await verifyConferenceRole(["admin"]);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("event_id");
  const sessionId = searchParams.get("session_id");

  const supabase = getServiceSupabase();

  // Select summary fields only — snapshot_data is excluded from the list view
  // to keep payloads small. Clients fetch the detail route for full data.
  let query = supabase
    .from("conference_session_snapshots")
    .select("id, session_id, event_id, created_at, created_by")
    .order("created_at", { ascending: false });

  if (sessionId) {
    query = query.eq("session_id", sessionId);
  } else if (eventId) {
    query = query.eq("event_id", eventId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with session title via a separate fetch (avoids a join on a table
  // that may have ON DELETE SET NULL — session_id can be null after deletion).
  const sessionIds = [...new Set((data || []).map((s) => s.session_id).filter(Boolean))];
  const sessionTitles: Record<string, string> = {};

  if (sessionIds.length > 0) {
    const { data: sessions } = await supabase
      .from("conference_sessions")
      .select("id, title")
      .in("id", sessionIds as string[]);
    for (const s of sessions || []) {
      sessionTitles[s.id] = s.title as string;
    }
  }

  const enriched = (data || []).map((snap) => ({
    ...snap,
    session_title: snap.session_id ? (sessionTitles[snap.session_id] ?? null) : null,
  }));

  return NextResponse.json(enriched, {
    headers: { "Cache-Control": "no-store" },
  });
}
