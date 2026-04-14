import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const sessionSchema = z.object({
  session_name: z.string().min(1).max(500),
  start_time: z.string().max(50).nullable().optional(),
  end_time: z.string().max(50).nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  room: z.string().max(500).nullable().optional(),
});

const bulkSchema = z.object({
  sessions: z.array(sessionSchema).max(10),
});

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await verifyAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("event_sessions")
    .select("*")
    .eq("event_id", id)
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// Bulk replace: deletes existing rows for the event and inserts the new ordered
// list. Simpler UX than per-row CRUD and side-steps sort_order conflicts.
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await verifyAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  const { error: delErr } = await supabase.from("event_sessions").delete().eq("event_id", id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  if (parsed.data.sessions.length === 0) return NextResponse.json([]);

  const rows = parsed.data.sessions.map((s, i) => ({
    event_id: id,
    sort_order: i + 1,
    session_name: s.session_name,
    start_time: s.start_time || null,
    end_time: s.end_time || null,
    location: s.location || null,
    room: s.room || null,
  }));

  const { data, error: insErr } = await supabase.from("event_sessions").insert(rows).select();
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
