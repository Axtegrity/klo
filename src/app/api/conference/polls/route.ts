import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { pollCreateSchema } from "@/lib/validation";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) return null;
  return session;
}

export async function GET(request: Request) {
  const supabase = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  const eventId = searchParams.get("event_id");

  // Admins see all polls; guests only see deployed + active polls.
  const adminSession = await verifyAdmin();
  const isAdmin = !!adminSession;

  // If attendee is requesting by session, verify session is active
  if (!isAdmin && sessionId) {
    const { data: sess } = await supabase
      .from("conference_sessions")
      .select("is_active")
      .eq("id", sessionId)
      .single();
    if (!sess?.is_active) {
      return NextResponse.json([]);
    }
  }

  // Fetch polls and pre-aggregated vote counts in two queries
  // (avoids fetching every individual vote row)
  let pollsQuery = supabase.from("conference_polls").select("*").order("created_at", { ascending: false });
  if (eventId) {
    pollsQuery = pollsQuery.eq("event_id", eventId);
  } else if (sessionId) {
    pollsQuery = pollsQuery.or(`session_id.eq.${sessionId},session_id.is.null`);
  }

  // Server-side gate: non-admins only receive polls that are deployed and active.
  // Client-side filtering is not a security boundary.
  if (!isAdmin) {
    pollsQuery = pollsQuery.eq("is_deployed", true).eq("is_active", true);
  }

  const [pollsRes, voteCountsRes] = await Promise.all([
    pollsQuery,
    supabase.rpc("get_poll_vote_counts"),
  ]);

  if (pollsRes.error) {
    return NextResponse.json({ error: pollsRes.error.message }, { status: 500 });
  }

  // Build lookup from RPC results: { poll_id: { option_index: count } }
  const voteCounts: Record<string, Record<number, number>> = {};

  if (!voteCountsRes.error && voteCountsRes.data) {
    for (const row of voteCountsRes.data as { poll_id: string; option_index: number; cnt: number }[]) {
      if (!voteCounts[row.poll_id]) voteCounts[row.poll_id] = {};
      voteCounts[row.poll_id][row.option_index] = row.cnt;
    }
  } else {
    // Fallback if RPC doesn't exist yet — fetch all votes
    const { data: votes } = await supabase
      .from("conference_poll_votes")
      .select("poll_id, option_index");
    for (const v of votes || []) {
      if (!voteCounts[v.poll_id]) voteCounts[v.poll_id] = {};
      voteCounts[v.poll_id][v.option_index] = (voteCounts[v.poll_id][v.option_index] || 0) + 1;
    }
  }

  const enriched = pollsRes.data.map((poll) => {
    const options = poll.options as string[];
    const counts = voteCounts[poll.id] || {};
    const votes = options.map((_, idx) => counts[idx] || 0);
    const totalVotes = votes.reduce((sum, v) => sum + v, 0);
    return { ...poll, votes, totalVotes };
  });

  return NextResponse.json(enriched, {
    headers: {
      "Cache-Control": isAdmin
        ? "no-store"
        : "public, s-maxage=2, stale-while-revalidate=5",
    },
  });
}

export async function POST(request: Request) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = pollCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const supabase = getServiceSupabase();

  // Batch creation: accept { questions: [{ question, options }] }
  if (Array.isArray(parsed.data.questions)) {
    const { questions } = parsed.data;
    if (questions.length < 1 || questions.length > 20) {
      return NextResponse.json(
        { error: "Batch must contain 1-20 questions" },
        { status: 400 }
      );
    }
    const rows = [];
    for (const q of questions) {
      rows.push({
        question: q.question.trim(),
        options: q.options.map((o: string) => o.trim()).filter(Boolean),
        is_active: false,
        is_deployed: false,
        ...(parsed.data.session_id ? { session_id: parsed.data.session_id } : {}),
        ...(parsed.data.event_id ? { event_id: parsed.data.event_id } : {}),
      });
    }
    const { data, error } = await supabase
      .from("conference_polls")
      .insert(rows)
      .select();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  }

  // Single poll creation (original behavior)
  const { question, options } = parsed.data;
  if (!question || !Array.isArray(options) || options.length < 2) {
    return NextResponse.json(
      { error: "Question and at least 2 options required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("conference_polls")
    .insert({
      question,
      options,
      is_active: false,
      is_deployed: false,
      ...(parsed.data.session_id ? { session_id: parsed.data.session_id } : {}),
      ...(parsed.data.event_id ? { event_id: parsed.data.event_id } : {}),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
