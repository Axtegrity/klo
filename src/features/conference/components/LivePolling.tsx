"use client";

import { BarChart3 } from "lucide-react";
import Card from "@/components/shared/Card";
import PollVoteForm from "./PollVoteForm";
import PollResults from "./PollResults";
import type { PollWithVotes } from "../types";

interface LivePollingProps {
  polls: PollWithVotes[];
  loading: boolean;
  onVote: (pollId: string, optionIndex: number) => Promise<boolean>;
}

export default function LivePolling({ polls, loading, onVote }: LivePollingProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="w-12 h-12 rounded-xl bg-[#2764FF]/10 flex items-center justify-center mx-auto mb-3">
          <BarChart3 size={24} className="text-[#2764FF]" />
        </div>
        <p className="text-klo-muted text-sm">
          No active polls right now. The presenter will push polls during the session.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {polls.map((poll) => (
        <Card key={poll.id}>
          <h3 className="text-lg font-semibold text-klo-text mb-4">{poll.question}</h3>
          {poll.hasVoted || poll.show_results ? (
            <PollResults poll={poll} />
          ) : (
            <PollVoteForm poll={poll} onVote={onVote} />
          )}
        </Card>
      ))}
    </div>
  );
}
