import { NextRequest, NextResponse } from "next/server";
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getServiceSupabase();

  // Fetch the event
  const { data: event, error: eventError } = await supabase
    .from("event_presentations")
    .select("title, conference_name, conference_location, event_date")
    .eq("id", id)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Get active session IDs for this event
  const { data: activeSessions } = await supabase
    .from("conference_sessions")
    .select("id")
    .eq("event_id", id);

  const activeSessionIds = (activeSessions || []).map((s) => s.id);

  // Fetch polls and vote counts in parallel
  // Only include polls/questions that have no session_id (event-level) or belong to an existing session
  const [pollsRes, voteCountsRes, questionsRes] = await Promise.all([
    supabase
      .from("conference_polls")
      .select("id, question, options, session_id")
      .eq("event_id", id)
      .order("created_at", { ascending: true }),
    supabase.rpc("get_poll_vote_counts"),
    supabase
      .from("conference_questions")
      .select("text, upvotes, is_answered, session_id")
      .eq("event_id", id)
      .order("upvotes", { ascending: false })
      .limit(100),
  ]);

  if (pollsRes.error) {
    return NextResponse.json({ error: pollsRes.error.message }, { status: 500 });
  }

  // Filter out polls/questions from deleted sessions (orphans)
  // Keep items with no session_id (event-level) or with a session_id that still exists
  const validPolls = (pollsRes.data || []).filter(
    (p) => !p.session_id || activeSessionIds.includes(p.session_id)
  );
  const validQuestions = (questionsRes.data || []).filter(
    (q) => !q.session_id || activeSessionIds.includes(q.session_id)
  );

  // Build vote count lookup: { poll_id: { option_index: count } }
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

  // Build enriched polls with percentages
  let totalVotesAll = 0;
  const polls = validPolls.map((poll) => {
    const options = poll.options as string[];
    const counts = voteCounts[poll.id] || {};
    const optionVotes = options.map((_, idx) => counts[idx] || 0);
    const totalVotes = optionVotes.reduce((sum, v) => sum + v, 0);
    totalVotesAll += totalVotes;

    return {
      question: poll.question,
      total_votes: totalVotes,
      options: options.map((label, idx) => ({
        label,
        votes: optionVotes[idx],
        percentage: totalVotes > 0 ? Math.round((optionVotes[idx] / totalVotes) * 1000) / 10 : 0,
      })),
    };
  });

  // Aggregate question stats
  const questions = validQuestions;
  const totalQuestions = questions.length;
  const questionsAnswered = questions.filter((q) => q.is_answered).length;
  const totalUpvotes = questions.reduce((sum, q) => sum + (q.upvotes || 0), 0);

  // Top 10 questions by upvotes (already sorted desc from query)
  const topQuestions = questions.slice(0, 10).map((q) => ({
    text: q.text,
    upvotes: q.upvotes || 0,
    is_answered: q.is_answered ?? false,
  }));

  return NextResponse.json({
    event: {
      id,
      title: event.title,
      conference_name: event.conference_name,
      conference_location: event.conference_location,
      event_date: event.event_date,
    },
    engagement: {
      total_polls: polls.length,
      total_votes: totalVotesAll,
      total_questions: totalQuestions,
      questions_answered: questionsAnswered,
      total_upvotes: totalUpvotes,
    },
    polls,
    top_questions: topQuestions,
    generated_at: new Date().toISOString(),
  });
}
