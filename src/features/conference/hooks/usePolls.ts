"use client";

import { useState, useEffect, useCallback } from "react";
import { useConferenceRealtime } from "./useConferenceRealtime";
import type { Poll, PollWithVotes } from "../types";

export function usePolls() {
  const [polls, setPolls] = useState<PollWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());

  const fetchPolls = useCallback(async () => {
    try {
      const res = await fetch("/api/conference/polls");
      if (!res.ok) return;
      const data: Poll[] = await res.json();

      // For each poll, we need vote counts
      const pollsWithVotes: PollWithVotes[] = data.map((poll) => ({
        ...poll,
        votes: new Array((poll.options as string[]).length).fill(0),
        totalVotes: 0,
        hasVoted: votedPolls.has(poll.id),
      }));

      setPolls(pollsWithVotes);
    } catch {
      // Keep current state
    } finally {
      setLoading(false);
    }
  }, [votedPolls]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  useConferenceRealtime({
    onPollsChange: fetchPolls,
    onVotesChange: fetchPolls,
  });

  const vote = useCallback(
    async (pollId: string, optionIndex: number) => {
      try {
        const res = await fetch(`/api/conference/polls/${pollId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ option_index: optionIndex }),
        });

        if (res.ok || res.status === 409) {
          setVotedPolls((prev) => new Set([...prev, pollId]));
          // Re-fetch to get updated counts
          fetchPolls();
        }

        return res.ok;
      } catch {
        return false;
      }
    },
    [fetchPolls]
  );

  const activePolls = polls.filter((p) => p.is_active);

  return { polls, activePolls, loading, vote, refetch: fetchPolls };
}
