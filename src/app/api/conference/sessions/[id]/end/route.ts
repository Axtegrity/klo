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

  // 1. Fetch the session
  const { data: sessionData, error: sessionError } = await supabase
    .from("conference_sessions")
    .select("id, title, event_id, is_active")
    .eq("id", sessionId)
    .single();

  if (sessionError || !sessionData) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // 2. Fetch all polls for the session with their vote counts
  const [pollsRes, voteCountsRes] = await Promise.all([
    supabase
      .from("conference_polls")
      .select("id, question, options, is_active, closed_at")
      .eq("session_id", sessionId),
    supabase.rpc("get_poll_vote_counts"),
  ]);

  if (pollsRes.error) {
    return NextResponse.json({ error: pollsRes.error.message }, { status: 500 });
  }

  // Build vote lookup
  const voteCounts: Record<string, Record<number, number>> = {};
  if (!voteCountsRes.error && voteCountsRes.data) {
    for (const row of voteCountsRes.data as {
      poll_id: string;
      option_index: number;
      cnt: number;
    }[]) {
      if (!voteCounts[row.poll_id]) voteCounts[row.poll_id] = {};
      voteCounts[row.poll_id][row.option_index] = row.cnt;
    }
  } else {
    // Fallback: fetch votes directly
    const { data: votes } = await supabase
      .from("conference_poll_votes")
      .select("poll_id, option_index");
    for (const v of votes || []) {
      if (!voteCounts[v.poll_id]) voteCounts[v.poll_id] = {};
      voteCounts[v.poll_id][v.option_index] =
        (voteCounts[v.poll_id][v.option_index] || 0) + 1;
    }
  }

  const pollsSnapshot = (pollsRes.data || []).map((poll) => {
    const options = poll.options as string[];
    const counts = voteCounts[poll.id] || {};
    const votes = options.map((_, idx) => counts[idx] || 0);
    const totalVotes = votes.reduce((s, v) => s + v, 0);
    const percentages = votes.map((v) =>
      totalVotes > 0 ? Math.round((v / totalVotes) * 100) : 0
    );
    return {
      question: poll.question as string,
      options,
      votes,
      total_votes: totalVotes,
      percentages,
      closed_at: (poll.closed_at as string | null) ?? null,
    };
  });

  // 3. Fetch all questions for the session
  const { data: questionsData, error: questionsError } = await supabase
    .from("conference_questions")
    .select("text, upvotes, released, archived_at, created_at")
    .eq("session_id", sessionId);

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 500 });
  }

  const questionsSnapshot = (questionsData || []).map((q) => ({
    text: q.text as string,
    upvotes: (q.upvotes as number) ?? 0,
    released: (q.released as boolean) ?? false,
    archived_at: (q.archived_at as string | null) ?? null,
    created_at: q.created_at as string,
  }));

  // 4. Fetch attendee count — gracefully handle missing table
  let attendeeCount = 0;
  try {
    const { count } = await supabase
      .from("conference_session_attendees")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId);
    attendeeCount = count ?? 0;
  } catch {
    // Table may not exist — default 0
    attendeeCount = 0;
  }

  // 5. Build snapshot payload
  const endedAt = new Date().toISOString();
  const snapshotData = {
    session: {
      id: sessionData.id as string,
      title: sessionData.title as string,
      event_id: (sessionData.event_id as string | null) ?? null,
      ended_at: endedAt,
    },
    polls: pollsSnapshot,
    questions: questionsSnapshot,
    attendee_count: attendeeCount,
  };

  // 6. Close session + polls, then insert snapshot
  const { error: closeSessionError } = await supabase
    .from("conference_sessions")
    .update({ is_active: false, closed_at: endedAt })
    .eq("id", sessionId);

  if (closeSessionError) {
    return NextResponse.json({ error: closeSessionError.message }, { status: 500 });
  }

  await supabase
    .from("conference_polls")
    .update({ is_active: false })
    .eq("session_id", sessionId)
    .eq("is_active", true);

  const { data: snapshot, error: snapshotError } = await supabase
    .from("conference_session_snapshots")
    .insert({
      session_id: sessionId,
      event_id: (sessionData.event_id as string | null) ?? null,
      snapshot_data: snapshotData,
      created_by: auth.userId,
    })
    .select()
    .single();

  if (snapshotError) {
    return NextResponse.json({ error: snapshotError.message }, { status: 500 });
  }

  return NextResponse.json(snapshot, { status: 201 });
}
