"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CONFERENCE_COLORS } from "../constants";
import type { PollWithVotes } from "../types";

const BAR_COLORS = [
  CONFERENCE_COLORS.blue,
  CONFERENCE_COLORS.cyan,
  CONFERENCE_COLORS.gold,
  CONFERENCE_COLORS.purple,
  CONFERENCE_COLORS.lime,
  CONFERENCE_COLORS.magenta,
];

interface PollResultsProps {
  poll: PollWithVotes;
}

export default function PollResults({ poll }: PollResultsProps) {
  const data = (poll.options as string[]).map((option, idx) => ({
    name: option,
    votes: poll.votes[idx] || 0,
  }));

  const totalVotes = data.reduce((sum, d) => sum + d.votes, 0);

  return (
    <div className="space-y-4">
      {/* Simple bar display for each option */}
      <div className="space-y-3">
        {data.map((item, idx) => {
          const pct = totalVotes > 0 ? Math.round((item.votes / totalVotes) * 100) : 0;
          return (
            <div key={idx}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-klo-text">{item.name}</span>
                <span className="text-klo-muted">
                  {item.votes} ({pct}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/5">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: BAR_COLORS[idx % BAR_COLORS.length],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart view */}
      {totalVotes > 0 && (
        <div className="pt-2">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} layout="vertical">
              <XAxis type="number" stroke="#8B949E" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#8B949E"
                tick={{ fontSize: 12 }}
                width={120}
              />
              <Bar dataKey="votes" radius={[0, 6, 6, 0]}>
                {data.map((_, idx) => (
                  <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="text-xs text-klo-muted text-center">
        {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
