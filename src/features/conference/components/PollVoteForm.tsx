"use client";

import { useState } from "react";
import type { PollWithVotes } from "../types";

interface PollVoteFormProps {
  poll: PollWithVotes;
  onVote: (pollId: string, optionIndex: number) => Promise<boolean>;
}

export default function PollVoteForm({ poll, onVote }: PollVoteFormProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleVote = async () => {
    if (selected === null) return;
    setSubmitting(true);
    await onVote(poll.id, selected);
    setSubmitting(false);
  };

  return (
    <div className="space-y-3">
      {(poll.options as string[]).map((option, idx) => (
        <button
          key={idx}
          onClick={() => setSelected(idx)}
          className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${
            selected === idx
              ? "border-[#2764FF]/50 bg-[#2764FF]/10 text-klo-text"
              : "border-white/10 bg-klo-navy/30 text-klo-muted hover:border-white/20 hover:text-klo-text"
          }`}
        >
          <span className="inline-flex items-center gap-3">
            <span
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                selected === idx ? "border-[#2764FF]" : "border-white/20"
              }`}
            >
              {selected === idx && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#2764FF]" />
              )}
            </span>
            {option}
          </span>
        </button>
      ))}

      <button
        onClick={handleVote}
        disabled={selected === null || submitting}
        className="w-full px-4 py-3 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-semibold text-sm rounded-lg hover:brightness-110 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? "Submitting..." : "Submit Vote"}
      </button>
    </div>
  );
}
