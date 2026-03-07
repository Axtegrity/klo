"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
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

interface CollectiveResultsChartProps {
  polls: PollWithVotes[];
}

interface ChartRow {
  label: string;
  votes: number;
  pollQuestion: string;
  optionLabel: string;
  colorIndex: number;
}

/**
 * Aggregated view of all deployed poll results in a single chart.
 * Each bar represents one option from one poll, grouped by poll question.
 */
export default function CollectiveResultsChart({ polls }: CollectiveResultsChartProps) {
  if (polls.length === 0) {
    return (
      <p className="text-sm text-klo-muted text-center py-4">
        No deployed polls with results to display.
      </p>
    );
  }

  // Build flat data: one row per option across all polls
  const data: ChartRow[] = [];
  let totalVotesAll = 0;

  polls.forEach((poll, pollIdx) => {
    const options = poll.options as string[];
    options.forEach((option, optIdx) => {
      const votes = poll.votes[optIdx] || 0;
      totalVotesAll += votes;
      // Truncate long labels for chart readability
      const shortQ = poll.question.length > 30
        ? poll.question.slice(0, 28) + "..."
        : poll.question;
      data.push({
        label: `${shortQ} — ${option}`,
        votes,
        pollQuestion: poll.question,
        optionLabel: option,
        colorIndex: (pollIdx * options.length + optIdx) % BAR_COLORS.length,
      });
    });
  });

  if (totalVotesAll === 0) {
    return (
      <p className="text-sm text-klo-muted text-center py-4">
        No votes recorded yet across deployed polls.
      </p>
    );
  }

  // Dynamic height: 32px per bar, min 200, max 600
  const chartHeight = Math.min(600, Math.max(200, data.length * 32));

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-klo-muted">
        <span>{polls.length} poll{polls.length !== 1 ? "s" : ""}</span>
        <span>{data.length} options total</span>
        <span>{totalVotesAll} vote{totalVotesAll !== 1 ? "s" : ""}</span>
      </div>

      {/* Grouped horizontal bar chart */}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
          <XAxis
            type="number"
            stroke="#8B949E"
            tick={{ fontSize: 11 }}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            stroke="#8B949E"
            tick={{ fontSize: 10 }}
            width={180}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#161B22",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#E6EDF3", fontWeight: 600 }}
            itemStyle={{ color: "#8B949E" }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, _name: any, props: any) => {
              const row = props?.payload as ChartRow | undefined;
              return [`${value} vote${value !== 1 ? "s" : ""}`, row?.optionLabel ?? ""];
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            labelFormatter={(_label: any, payload: any) => {
              const items = payload as { payload: ChartRow }[] | undefined;
              if (items?.[0]) return items[0].payload.pollQuestion;
              return "";
            }}
          />
          <Bar dataKey="votes" radius={[0, 6, 6, 0]}>
            {data.map((item, idx) => (
              <Cell
                key={idx}
                fill={BAR_COLORS[item.colorIndex]}
                opacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Per-poll breakdown table */}
      <div className="space-y-3 pt-2 border-t border-white/5">
        {polls.map((poll, pollIdx) => {
          const options = poll.options as string[];
          const maxVotes = Math.max(...poll.votes);
          return (
            <div key={poll.id} className="space-y-1.5">
              <p className="text-xs font-medium text-klo-text truncate">
                {poll.question}
              </p>
              {options.map((opt, optIdx) => {
                const votes = poll.votes[optIdx] || 0;
                const pct = poll.totalVotes > 0
                  ? Math.round((votes / poll.totalVotes) * 100)
                  : 0;
                const isLeading = votes === maxVotes && maxVotes > 0;
                return (
                  <div key={optIdx} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: BAR_COLORS[
                          (pollIdx * options.length + optIdx) % BAR_COLORS.length
                        ],
                      }}
                    />
                    <span className={isLeading ? "text-klo-text font-medium" : "text-klo-muted"}>
                      {opt}
                    </span>
                    <span className="text-klo-muted ml-auto">
                      {votes} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
