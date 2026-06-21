"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Play,
  BarChart2,
  StopCircle,
  ChevronDown,
  ChevronUp,
  Undo2,
  ArrowRight,
  PowerOff,
} from "lucide-react";
import { useConferenceRealtime } from "../hooks/useConferenceRealtime";
import type { PollWithVotes } from "../types";

interface PresenterRemoteProps {
  eventId: string;
  sessionId?: string;
  autoShowResults?: boolean;
  onToggleAutoShow?: (value: boolean) => void;
  sessionMode?: "sequential" | "simultaneous";
}

export default function PresenterRemote({ eventId, sessionId, autoShowResults = true, onToggleAutoShow, sessionMode: sessionModeProp }: PresenterRemoteProps) {
  const [polls, setPolls] = useState<PollWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [sessionModeInternal, setSessionModeInternal] = useState<"sequential" | "simultaneous">("sequential");
  const sessionMode = sessionModeProp ?? sessionModeInternal;
  const [error, setError] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  const fetchPolls = useCallback(async () => {
    try {
      const res = await fetch(`/api/conference/polls?event_id=${eventId}`);
      if (!res.ok) {
        setError("Failed to load polls");
        return;
      }
      const data: PollWithVotes[] = await res.json();
      setPolls(data);
    } catch {
      setError("Failed to load polls");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Fetch the active session's session_mode at mount
  useEffect(() => {
    if (sessionModeProp) return; // prop takes priority, skip fetch
    async function fetchSessionMode() {
      try {
        const res = await fetch(
          `/api/conference/sessions?event_id=${eventId}&active_only=true`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0]?.session_mode) {
          setSessionModeInternal(data[0].session_mode as "sequential" | "simultaneous");
        }
      } catch {
        // Non-fatal — default stays "sequential"
      }
    }
    fetchSessionMode();
  }, [eventId, sessionModeProp]);

  useEffect(() => { fetchPolls(); }, [fetchPolls]);
  useConferenceRealtime({ onPollsChange: fetchPolls, onVotesChange: fetchPolls });

  const live = polls.find((p) => p.is_active);
  const queued = polls.filter((p) => !p.is_deployed && !p.is_active);
  const done = polls.filter((p) => p.is_deployed && !p.is_active);
  const deployed = polls.filter((p) => p.is_deployed);
  const totalVotes = live ? live.votes.reduce((s, v) => s + v, 0) : 0;
  const nextInQueue = queued[0] ?? null;
  const totalResponsesAcrossAll = deployed.reduce((sum, p) => sum + p.votes.reduce((s, v) => s + v, 0), 0);
  const isSimultaneous = sessionMode === "simultaneous";

  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await fetchPolls();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setBusy(false);
    }
  };

  const startPoll = (id: string) =>
    act(async () => {
      const res = await fetch(`/api/conference/polls/${id}/deploy`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to start poll");
      }
    });

  const closePoll = () => {
    if (!live) return;
    act(async () => {
      const res = await fetch(`/api/conference/polls/${live.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false, show_results: true }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to close poll");
      }
    });
  };

  const closeAndNext = () => {
    if (!live || !nextInQueue) return;
    act(async () => {
      const closeRes = await fetch(`/api/conference/polls/${live.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false, show_results: true }),
      });
      if (!closeRes.ok) {
        const body = await closeRes.json().catch(() => ({}));
        throw new Error(body.error || "Failed to close current poll");
      }
      const deployRes = await fetch(
        `/api/conference/polls/${nextInQueue.id}/deploy`,
        { method: "POST" }
      );
      if (!deployRes.ok) {
        const body = await deployRes.json().catch(() => ({}));
        throw new Error(body.error || "Failed to start next poll");
      }
    });
  };

  const recallPoll = (id: string) =>
    act(async () => {
      const res = await fetch(`/api/conference/polls/${id}/recall`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to reopen poll");
      }
    });

  const recallAll = () =>
    act(async () => {
      if (!eventId) return;
      const res = await fetch(`/api/conference/polls/reset?event_id=${eventId}`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to reopen all polls");
      }
    });

  const pushResults = (pollIds?: string[]) =>
    act(async () => {
      const targets = pollIds ?? deployed.map((p) => p.id);
      await Promise.all(
        targets.map((id) =>
          fetch(`/api/conference/polls/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ show_results: true }),
          })
        )
      );
    });

  const deployAll = () =>
    act(async () => {
      const undeployed = polls.filter((p) => !p.is_deployed);
      if (undeployed.length === 0) return;
      const res = await fetch("/api/conference/polls/deploy-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poll_ids: undeployed.map((p) => p.id),
          event_id: eventId,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to deploy all polls");
      }
    });

  const undeployPoll = (id: string) =>
    act(async () => {
      const res = await fetch(`/api/conference/polls/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_deployed: false }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to put poll back");
      }
    });

  const endSession = async () => {
    if (!sessionId) return;
    const confirmed = window.confirm(
      "End this session? This will close all polls, archive the results, and mark the session complete."
    );
    if (!confirmed) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/conference/sessions/${sessionId}/end`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to end session");
      }
      setSessionEnded(true);
      await fetchPolls();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end session");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
      </div>
    );
  }

  if (sessionEnded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          <PowerOff size={32} className="text-emerald-400" />
        </div>
        <p className="text-klo-text font-semibold text-lg">Session ended</p>
        <p className="text-klo-muted text-sm">Results have been archived. View them in the History tab.</p>
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
        <p className="text-klo-muted text-sm">
          Create polls in the admin panel first, then come back here to run them.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 max-w-lg mx-auto">

      {/* ── ERROR DISPLAY ── */}
      {error && (
        <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* ── SIMULTANEOUS MODE VIEW ── */}
      {isSimultaneous && (
        <div className="glass rounded-3xl p-6 border border-purple-500/30 space-y-5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              ALL QUESTIONS LIVE
            </span>
            <span className="text-xs text-klo-muted">{deployed.length} questions</span>
          </div>
          <div className="text-center">
            <p className="text-5xl font-black text-purple-400">{totalResponsesAcrossAll}</p>
            <p className="text-sm text-klo-muted mt-1">total responses received</p>
          </div>
          <div className="space-y-2">
            {deployed.map((poll, idx) => {
              const pollVotes = poll.votes.reduce((s, v) => s + v, 0);
              return (
                <div key={poll.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5">
                  <span className="text-xs text-klo-muted truncate flex-1 pr-3">Q{idx + 1}: {poll.question}</span>
                  <span className="text-xs font-bold text-purple-400 shrink-0">{pollVotes} votes</span>
                </div>
              );
            })}
          </div>
          {polls.filter((p) => !p.is_deployed).length > 0 && (
            <button
              onClick={deployAll}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-4 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-2xl font-bold text-base hover:bg-purple-500/20 transition-all disabled:opacity-50"
            >
              <Play size={20} />
              Deploy All Polls
            </button>
          )}
          <button
            onClick={() => act(async () => {
              await Promise.all(deployed.map(p =>
                fetch(`/api/conference/polls/${p.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ is_active: false, show_results: true }),
                })
              ));
            })}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-4 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-2xl font-bold text-base hover:bg-purple-500/20 transition-all disabled:opacity-50"
          >
            <StopCircle size={20} />
            Close All &amp; Show Results
          </button>

            {/* Auto-show toggle */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-klo-muted font-medium">Auto-show results when attendees finish</span>
              <button
                onClick={() => onToggleAutoShow?.(!autoShowResults)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoShowResults ? "bg-purple-500" : "bg-white/10"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoShowResults ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {/* Manual push results — only when auto-show is off */}
            {!autoShowResults && deployed.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => pushResults()}
                  disabled={busy}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-2xl font-bold text-sm hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                >
                  Push All Results
                </button>
                <div className="space-y-1">
                  {deployed.map((poll, idx) => (
                    <button
                      key={poll.id}
                      onClick={() => pushResults([poll.id])}
                      disabled={busy || poll.show_results}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-40"
                      style={{ background: poll.show_results ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)", color: poll.show_results ? "#34d399" : "#8B949E", border: `1px solid ${poll.show_results ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)"}` }}
                    >
                      <span className="truncate text-left">Q{idx + 1}: {poll.question}</span>
                      <span className="shrink-0">{poll.show_results ? "✓ Pushed" : "Push"}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* ── SEQUENTIAL: LIVE POLL ── */}
      {!isSimultaneous && live ? (
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
                    <span className="text-klo-muted shrink-0">
                      {count} ({pct}%)
                    </span>
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
            {/* Close & Next — only when a next poll is queued */}
            {nextInQueue ? (
              <button
                onClick={closeAndNext}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#2764FF]/10 text-[#2764FF] border border-[#2764FF]/30 rounded-2xl font-bold text-base hover:bg-[#2764FF]/20 transition-all disabled:opacity-50"
              >
                <ArrowRight size={20} />
                Close &amp; Next
              </button>
            ) : (
              <button
                onClick={closePoll}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl font-bold text-base hover:bg-red-500/20 transition-all disabled:opacity-50"
              >
                <StopCircle size={20} />
                Close Poll
              </button>
            )}
          </div>
        </div>
      ) : !isSimultaneous && queued.length > 0 ? (
        /* ── NO ACTIVE POLL — READY FOR NEXT ── */
        <div className="glass rounded-3xl p-6 border border-[#2764FF]/20 space-y-5 text-center">
          <p className="text-xs font-semibold text-klo-muted uppercase tracking-wider">
            {done.length === 0 ? "Up First" : "Next Question"}
          </p>
          <p className="text-2xl font-bold text-klo-text leading-snug">
            {queued[0].question}
          </p>
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
      ) : !isSimultaneous ? (
        /* ── ALL DONE (sequential) ── */
        <div className="glass rounded-3xl p-6 border border-emerald-500/20 text-center space-y-4">
          <p className="text-2xl">All polls complete!</p>
          <p className="text-lg font-bold text-klo-text">Well done.</p>
          <p className="text-sm text-klo-muted">End the session to archive results.</p>
          <button
            onClick={recallAll}
            disabled={busy}
            className="w-full py-3 rounded-2xl text-sm font-bold text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/10 transition-colors disabled:opacity-40"
          >
            Reopen All Polls
          </button>
        </div>
      ) : null}

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
              {done.map((poll) => {
                const pollTotal = poll.votes.reduce((s, v) => s + v, 0);
                return (
                  <div key={poll.id} className="px-4 py-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 text-xs shrink-0">✓</span>
                      <p className="text-sm text-klo-muted flex-1">{poll.question}</p>
                        <div className="shrink-0" />
                    </div>
                    {/* Frozen vote results */}
                    <div className="space-y-1 pl-4">
                      {poll.options.map((opt, idx) => {
                        const count = poll.votes[idx] || 0;
                        const pct =
                          pollTotal > 0 ? Math.round((count / pollTotal) * 100) : 0;
                        return (
                          <div key={idx}>
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="text-klo-muted/70 truncate pr-2">{opt}</span>
                              <span className="text-klo-muted/50 shrink-0">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/5">
                              <div
                                className="h-full rounded-full bg-emerald-500/50 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── END SESSION ── */}
      <div className="pt-2">
        <button
          onClick={endSession}
          disabled={busy || !sessionId}
          title={!sessionId ? "No session ID provided" : undefined}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all bg-red-900/40 border border-red-500/30 text-red-300 hover:bg-red-900/60 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          End Session
        </button>
        {!sessionId && (
          <p className="text-xs text-center text-klo-muted mt-1">
            Pass sessionId to enable this feature.
          </p>
        )}
      </div>
    </div>
  );
}
