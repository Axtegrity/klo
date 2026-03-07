"use client";

import { useState, useEffect, useCallback } from "react";
import { useConferenceRealtime } from "./useConferenceRealtime";
import type { PollWithVotes } from "../types";

function getVoterId(): string {
  const KEY = "klo-voter-id";
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID() + crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

export function usePolls({ sessionId, eventId }: { sessionId?: string; eventId?: string } = {}) {
  const [polls, setPolls] = useState<PollWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = sessionStorage.getItem("klo-voted-polls");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const fetchPolls = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (sessionId) params.set("session_id", sessionId);
      if (eventId) params.set("event_id", eventId);
      const url = params.toString()
        ? `/api/conference/polls?${params}`
        : "/api/conference/polls";
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();

      const pollsWithVoted: PollWithVotes[] = data.map(
        (poll: PollWithVotes) => ({
          ...poll,
          hasVoted: votedPolls.has(poll.id),
        })
      );

      setPolls(pollsWithVoted);
    } catch {
      // Keep current state
    } finally {
      setLoading(false);
    }
  }, [votedPolls, sessionId, eventId]);

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
          body: JSON.stringify({ option_index: optionIndex, voter_id: getVoterId() }),
        });

        if (res.ok || res.status === 409) {
          setVotedPolls((prev) => {
            const next = new Set([...prev, pollId]);
            sessionStorage.setItem("klo-voted-polls", JSON.stringify([...next]));
            return next;
          });
          fetchPolls();
        }

        return res.ok;
      } catch {
        return false;
      }
    },
    [fetchPolls]
  );

  const activePolls = polls.filter((p) => p.is_deployed && p.is_active);

  return { polls, activePolls, loading, vote, refetch: fetchPolls };
}
