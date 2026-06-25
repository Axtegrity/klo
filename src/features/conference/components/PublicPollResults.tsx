"use client";

import { BarChart2 } from "lucide-react";
import Card from "@/components/shared/Card";

interface PollSnapshot {
  question: string;
  options: string[];
  votes: number[];
  total_votes: number;
  percentages: number[];
}

interface PublicPollResultsProps {
  polls: PollSnapshot[];
  sessionTitle: string;
  endedAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function PublicPollResults({ polls, sessionTitle, endedAt }: PublicPollResultsProps) {
  if (polls.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#2764FF]/10 flex items-center justify-center">
          <BarChart2 size={20} className="text-[#2764FF]" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-klo-text">Session Results</h2>
          <p className="text-xs text-klo-muted">{sessionTitle} · {formatDate(endedAt)}</p>
        </div>
      </div>

      <div className="space-y-4">
        {polls.map((poll, pollIdx) => {
          const maxVotes = Math.max(...poll.votes);
          return (
            <Card key={pollIdx}>
              <p className="text-sm font-semibold text-klo-text mb-1">
                <span className="text-klo-muted font-normal mr-1">{pollIdx + 1}.</span>
                {poll.question}
              </p>
              <p className="text-xs text-klo-muted mb-3">{poll.total_votes} response{poll.total_votes !== 1 ? "s" : ""}</p>
              <div className="space-y-2">
                {poll.options.map((opt, idx) => {
                  const pct = poll.percentages[idx] ?? 0;
                  const votes = poll.votes[idx] ?? 0;
                  const isLeading = votes === maxVotes && maxVotes > 0;
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className={isLeading ? "text-klo-text font-semibold" : "text-klo-muted"}>{opt}</span>
                        <span className={isLeading ? "text-klo-text font-semibold" : "text-klo-muted"}>{votes} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: isLeading ? "#C8A84E" : "#2764FF",
                            opacity: isLeading ? 1 : 0.6,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
