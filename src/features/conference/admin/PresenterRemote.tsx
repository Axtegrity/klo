"use client";

import { useState, useCallback, useEffect } from "react";
import { Play, BarChart2, StopCircle, ChevronDown, ChevronUp, Undo2 } from "lucide-react";
import { useConferenceRealtime } from "../hooks/useConferenceRealtime";
import type { PollWithVotes } from "../types";

interface PresenterRemoteProps {
  eventId: string;
}

export default function PresenterRemote({ eventId }: PresenterRemoteProps) {
  const [polls, setPolls] = useState<PollWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const fetchPolls = useCallback(async () => {
    try {
      const res = await fetch(`/api/conference/polls?event_id=${eventId}`);
      if (!res.ok) return;
      const data: PollWithVotes[] = await res.json();
      setPolls(data);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchPolls(); }, [fetchPolls]);
  useConferenceRealtime({ onPollsChange: fetchPolls, onVotesChange: fetchPolls });

  const live = polls.find((p) => p.is_active);
  const queued = polls.filter((p) => !p.is_deployed && !p.is_active);
  const done = polls.filter((p) => p.is_deployed && !p.is_active);
  const totalVotes = live ? live.votes.reduce((s, v) => s + v, 0) : 0;

  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); await fetchPolls(); } finally { setBusy(false); }
  };

  const startPoll = (id: string) =>
    act(() => fetch(`/api/conference/polls/${id}/deploy`, { method: "POST" }).then(() => {}));

  const toggleResults = (poll: PollWithVotes) =>
    act(() =>
      fetch(`/api/conference/polls/${poll.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show_results: !poll.show_results }),
      }).then(() => {})
    );


  const closePoll = () => {
    if (!live) return;
    act(() =>
      fetch(`/api/conference/polls/${live.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false, show_results: false }),
      }).then(() => {})
    );
  };

  const undeployPoll = (id: string) =>
    act(() =>
      fetch(`/api/conference/polls/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_deployed: false }),
      }).then(() => {})
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-[#2764FF]/10 flex items-center justify-center">
          <BarChart2 size={32} className="text-[#2764FF]" />
        </div>
        <p className="text-klo-text font-semibold text-lg">No polls yet</p>
        <p className="text-klo-muted text-sm">Create polls in the admin panel first, then come back here to run them.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 max-w-lg mx-auto">

      {/* ── LIVE POLL ── */}
      {live ? (
        <div className="glass rounded-3xl p-6 border border-emerald-500/30 space-y-5">
          {/* Status badge */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
            <span className="text-xs text-klo-muted">
              {done.length + 1} of {polls.length}
            </span>
          </div>

          {/* Question */}
          <p className="text-2xl font-bold text-klo-text leading-snug">{live.question}</p>

          {/* Vote count */}
          <p className="text-4xl font-black text-[#2764FF]">
            {totalVotes}
            <span className="text-base font-medium text-klo-muted ml-2">
              vote{totalVotes !== 1 ? "s" : ""}
            </span>
          </p>

          {/* Results preview (always visible to presenter) */}
          <div className="space-y-2">
            {live.options.map((opt, idx) => {
              const count = live.votes[idx] || 0;
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-klo-text truncate pr-2">{opt}</span>
                    <span className="text-klo-muted shrink-0">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-[#2764FF] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => toggleResults(live)}
              disabled={busy}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-50 ${
                live.show_results
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                  : "bg-[#2764FF]/20 text-[#2764FF] border border-[#2764FF]/30 hover:bg-[#2764FF]/30"
              }`}
            >
              <BarChart2 size={20} />
              {live.show_results ? "Hide Results" : "Show Results"}
            </button>

            <button
              onClick={closePoll}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl font-bold text-base hover:bg-red-500/20 transition-all disabled:opacity-50"
            >
              <StopCircle size={20} />
              Close Poll
            </button>
          </div>
        </div>
      ) : queued.length > 0 ? (
        /* ── NO ACTIVE POLL — READY FOR NEXT ── */
        <div className="glass rounded-3xl p-6 border border-[#2764FF]/20 space-y-5 text-center">
          <p className="text-xs font-semibold text-klo-muted uppercase tracking-wider">
            {done.length === 0 ? "Up First" : "Next Question"}
          </p>
          <p className="text-2xl font-bold text-klo-text leading-snug">{queued[0].question}</p>
          <p className="text-xs text-klo-muted">
            {(queued[0].options as string[]).join(" · ")}
          </p>
          <button
            onClick={() => startPoll(queued[0].id)}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white rounded-2xl font-bold text-xl hover:brightness-110 transition-all disabled:opacity-50"
          >
            <Play size={24} fill="white" />
            {done.length === 0 ? "Start Poll" : "Start Next Poll"}
          </button>
        </div>
      ) : (
        /* ── ALL DONE ── */
        <div className="glass rounded-3xl p-6 border border-emerald-500/20 text-center space-y-2">
          <p className="text-2xl">🎉</p>
          <p className="text-lg font-bold text-klo-text">All polls complete!</p>
          <p className="text-sm text-klo-muted">Great session.</p>
        </div>
      )}

      {/* ── QUEUE ── */}
      {queued.length > (live ? 0 : 1) && (
        <div className="glass rounded-2xl border border-white/5 divide-y divide-white/5 overflow-hidden">
          <p className="px-4 py-3 text-xs font-semibold text-klo-muted uppercase tracking-wider">
            Up Next
          </p>
          {(live ? queued : queued.slice(1)).map((poll, idx) => (
            <div key={poll.id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-6 h-6 rounded-full bg-white/5 text-xs font-bold text-klo-muted flex items-center justify-center shrink-0">
                {done.length + (live ? 2 : 2) + idx}
              </span>
              <p className="text-sm text-klo-muted truncate">{poll.question}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── DONE ── */}
      {done.length > 0 && (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <button
            onClick={() => setShowDone(!showDone)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-klo-muted uppercase tracking-wider hover:text-klo-text transition-colors"
          >
            <span>Done ({done.length})</span>
            {showDone ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showDone && (
            <div className="divide-y divide-white/5">
              {done.map((poll) => (
                <div key={poll.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-emerald-400 text-xs shrink-0">✓</span>
                  <p className="text-sm text-klo-muted truncate flex-1">{poll.question}</p>
                  <button
                    onClick={() => undeployPoll(poll.id)}
                    disabled={busy}
                    className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-klo-muted hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors disabled:opacity-40"
                    title="Put back in queue"
                  >
                    <Undo2 size={12} />
                    Put back
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
