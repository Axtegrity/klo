import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

// GET /api/strategy-rooms
// Public — returns all published sessions with registered_count computed.
// Optional ?limit=N query param.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.max(1, Math.min(100, parseInt(limitParam, 10))) : undefined;

    const supabase = getServiceSupabase();

    let query = supabase
      .from("strategy_sessions")
      .select("*")
      .eq("published", true)
      .order("session_date", { ascending: true, nullsFirst: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error("[GET /api/strategy-rooms]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Compute registered_count for each session
    const sessionIds = sessions.map((s) => s.id);
    const { data: regCounts } = await supabase
      .from("strategy_registrations")
      .select("session_id")
      .in("session_id", sessionIds)
      .eq("status", "registered");

    const countMap: Record<string, number> = {};
    for (const row of regCounts ?? []) {
      countMap[row.session_id] = (countMap[row.session_id] ?? 0) + 1;
    }

    const enriched = sessions.map((s) => ({
      ...s,
      registered_count: countMap[s.id] ?? 0,
    }));

    return NextResponse.json({ data: enriched });
  } catch (err) {
    console.error("[GET /api/strategy-rooms]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
