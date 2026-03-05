import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) return null;
  return session;
}

export async function GET() {
  const supabase = getServiceSupabase();

  const [pollsRes, votesRes] = await Promise.all([
    supabase.from("conference_polls").select("*").order("created_at", { ascending: false }),
    supabase.from("conference_poll_votes").select("poll_id, option_index"),
  ]);

  if (pollsRes.error) {
    return NextResponse.json({ error: pollsRes.error.message }, { status: 500 });
  }

  // Aggregate votes per poll per option
  const voteCounts: Record<string, Record<number, number>> = {};
  for (const v of votesRes.data || []) {
    if (!voteCounts[v.poll_id]) voteCounts[v.poll_id] = {};
    voteCounts[v.poll_id][v.option_index] = (voteCounts[v.poll_id][v.option_index] || 0) + 1;
  }

  const enriched = pollsRes.data.map((poll) => {
    const options = poll.options as string[];
    const counts = voteCounts[poll.id] || {};
    const votes = options.map((_, idx) => counts[idx] || 0);
    const totalVotes = votes.reduce((sum, v) => sum + v, 0);
    return { ...poll, votes, totalVotes };
  });

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { question, options } = body;

  if (!question || !Array.isArray(options) || options.length < 2) {
    return NextResponse.json(
      { error: "Question and at least 2 options required" },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("conference_polls")
    .insert({ question, options })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
