import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { strategySessionCreateSchema } from "@/lib/validation";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) return null;
  return session;
}

// GET /api/admin/strategy-rooms
// Returns all sessions (published + unpublished) with registered_count.
export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getServiceSupabase();

    const { data: sessions, error } = await supabase
      .from("strategy_sessions")
      .select("*")
      .order("session_date", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("[GET /api/admin/strategy-rooms]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Compute registered_count for each session
    const sessionIds = sessions.map((s) => s.id);
    const { data: regRows } = await supabase
      .from("strategy_registrations")
      .select("session_id")
      .in("session_id", sessionIds)
      .eq("status", "registered");

    const countMap: Record<string, number> = {};
    for (const row of regRows ?? []) {
      countMap[row.session_id] = (countMap[row.session_id] ?? 0) + 1;
    }

    const enriched = sessions.map((s) => ({
      ...s,
      registered_count: countMap[s.id] ?? 0,
    }));

    return NextResponse.json({ data: enriched });
  } catch (err) {
    console.error("[GET /api/admin/strategy-rooms]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/strategy-rooms
// Create a new session.
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = strategySessionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("strategy_sessions")
      .insert(parsed.data)
      .select()
      .single();

    if (error) {
      console.error("[POST /api/admin/strategy-rooms]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/strategy-rooms]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
