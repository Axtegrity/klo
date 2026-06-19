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
  sessionMode?: "sequential" | "simultaneous";
}

export default function LivePolling({ polls, loading, onVote, sessionMode = "sequential" }: LivePollingProps) {
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

  const active = polls.filter((p) => p.is_active);
  const visibleClosed = polls.filter((p) => !p.is_active && p.show_results);
  const deployedPolls = polls.filter((p) => p.is_deployed);
  const allAnswered = deployedPolls.length > 0 && deployedPolls.every((p) => p.hasVoted);
  const isSimultaneous = sessionMode === "simultaneous";

  return (
    <div className="space-y-4">
      {active.map((poll) => (
        <Card key={poll.id}>
          {poll.hasVoted ? (
            isSimultaneous ? (
              <div className="py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-emerald-400 text-lg">✓</span>
                </div>
                <p className="text-klo-text font-semibold text-sm">Response submitted</p>
                <p className="text-klo-muted text-xs mt-1">
                  {allAnswered ? "Stand by for all results..." : "Continue answering the questions below..."}
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-klo-text mb-4">{poll.question}</h3>
                <PollResults poll={poll} live />
              </>
            )
          ) : (
            <>
              <h3 className="text-lg font-semibold text-klo-text mb-4">{poll.question}</h3>
              <PollVoteForm poll={poll} onVote={onVote} />
            </>
          )}
        </Card>
      ))}

      {isSimultaneous && allAnswered && deployedPolls.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-[#8B949E] uppercase tracking-wider text-center pt-2">All Results</p>
          {deployedPolls.map((poll) => (
            <Card key={poll.id}>
              <h3 className="text-lg font-semibold text-klo-text mb-4">{poll.question}</h3>
              <PollResults poll={poll} />
            </Card>
          ))}
        </div>
      )}

      {!isSimultaneous && visibleClosed.length > 0 && (
        <div className="space-y-4">
          {active.length > 0 && (
            <p className="text-xs text-klo-muted font-medium pt-2">Previous Results</p>
          )}
          {visibleClosed.map((poll) => (
            <Card key={poll.id}>
              <h3 className="text-lg font-semibold text-klo-text mb-4">{poll.question}</h3>
              <PollResults poll={poll} />
            </Card>
          ))}
        </div>
      )}

      {active.length === 0 && visibleClosed.length === 0 && !allAnswered && polls.length > 0 && (
        <Card className="text-center py-12">
          <p className="text-klo-muted text-sm">Stand by...</p>
        </Card>
      )}
    </div>
  );
}
