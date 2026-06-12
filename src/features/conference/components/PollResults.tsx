"use client";

import { useState, useEffect, useCallback } from "react";
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

const LEADING_COLOR = CONFERENCE_COLORS.gold;

interface PollResultsProps {
  poll: PollWithVotes;
  /** If true, shows "last updated" indicator */
  live?: boolean;
}

export default function PollResults({ poll: initialPoll, live }: PollResultsProps) {
  const [poll, setPoll] = useState(initialPoll);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [fetchError, setFetchError] = useState(false);

  // Sync if parent passes a new poll prop
  useEffect(() => {
    setPoll(initialPoll);
    setLastUpdated(new Date());
    setFetchError(false);
  }, [initialPoll]);

  const refreshResults = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (poll.event_id) params.set("event_id", poll.event_id);
      else if (poll.session_id) params.set("session_id", poll.session_id);
      const url = params.toString()
        ? `/api/conference/polls?${params}`
        : "/api/conference/polls";
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch failed");
      const polls: PollWithVotes[] = await res.json();
      const updated = polls.find((p) => p.id === poll.id);
      if (updated) {
        setPoll(updated);
        setLastUpdated(new Date());
        setFetchError(false);
      }
    } catch {
      setFetchError(true);
    }
  }, [poll.id, poll.session_id, poll.event_id]);

  // Tick "X seconds ago" every 10s
  useEffect(() => {
    if (!live) return;
    const tick = () => setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    tick();
    const interval = setInterval(tick, 10000);
    return () => clearInterval(interval);
  }, [live, lastUpdated]);

  const data = (poll.options as string[]).map((option, idx) => ({
    name: option,
    votes: poll.votes[idx] || 0,
  }));

  const totalVotes = data.reduce((sum, d) => sum + d.votes, 0);
  const maxVotes = Math.max(...data.map((d) => d.votes));

  // Error state
  if (fetchError) {
    return (
      <button
        onClick={refreshResults}
        className="w-full text-center text-sm text-red-400 py-4 hover:text-red-300 transition-colors"
      >
        Couldn&apos;t load results — tap to retry
      </button>
    );
  }

  // Zero votes
  if (totalVotes === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-klo-muted text-center py-4">
          No votes yet — share your poll to get started.
        </p>
        {live && (
          <p className="text-xs text-klo-muted/60 text-center">
            Last updated {secondsAgo}s ago
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Closed label */}
      {!poll.is_active && poll.closed_at && (
        <div className="text-xs font-medium text-red-400 flex items-center gap-1">
          🔴 Closed
        </div>
      )}

      {/* Progress bars for each option */}
      <div className="space-y-3">
        {data.map((item, idx) => {
          const pct = totalVotes > 0 ? Math.round((item.votes / totalVotes) * 100) : 0;
          const isLeading = item.votes === maxVotes && maxVotes > 0;
          const barColor = isLeading
            ? LEADING_COLOR
            : BAR_COLORS[idx % BAR_COLORS.length];

          return (
            <div key={idx}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className={isLeading ? "text-klo-text font-semibold" : "text-klo-text"}>
                  {item.name}
                </span>
                <span className={isLeading ? "text-klo-text font-semibold" : "text-klo-muted"}>
                  {item.votes} ({pct}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/5">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: barColor,
                    opacity: isLeading ? 1 : 0.7,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart view */}
      <div className="pt-2">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical">
            <XAxis type="number" stroke="#8B949E" tick={{ fontSize: 12 }} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#8B949E"
              tick={{ fontSize: 12 }}
              width={80}
            />
            <Bar dataKey="votes" radius={[0, 6, 6, 0]}>
              {data.map((item, idx) => {
                const isLeading = item.votes === maxVotes && maxVotes > 0;
                return (
                  <Cell
                    key={idx}
                    fill={isLeading ? LEADING_COLOR : BAR_COLORS[idx % BAR_COLORS.length]}
                    opacity={isLeading ? 1 : 0.7}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer: total votes + last updated */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-klo-muted">
          {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
        </p>
        {live && (
          <p className="text-xs text-klo-muted/60">
            Last updated {secondsAgo}s ago
          </p>
        )}
      </div>
    </div>
  );
}
