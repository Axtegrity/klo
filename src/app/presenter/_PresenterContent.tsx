"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Play,
  StopCircle,
  BarChart2,
  EyeOff,
  Undo2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useConferenceRealtime } from "@/features/conference/hooks/useConferenceRealtime";
import type { PollWithVotes } from "@/features/conference/types";
import { CONFERENCE_COLORS } from "@/features/conference/constants";

const GOLD = CONFERENCE_COLORS.gold;

export default function PresenterContent() {
  const { status } = useSession();
  const router = useRouter();

  const [eventId, setEventId] = useState<string | null>(null);
  const [, setSessionId] = useState<string | null>(null);
  const [polls, setPolls] = useState<PollWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/signin");
  }, [status, router]);

  // Fetch active session and event
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/conference/sessions?active_only=true");
      if (!res.ok) return;
      const data = await res.json();
      if (data.length > 0) {
        setSessionId(data[0].id);
        setEventId(data[0].event_id);
      }
    } catch {
      // keep current
    }
  }, []);

  // Fetch polls for active event
  const fetchPolls = useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await fetch(`/api/conference/polls?event_id=${eventId}`);
      if (!res.ok) return;
      const data: PollWithVotes[] = await res.json();
      setPolls(data);
    } catch {
      // keep current
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchSession(); }, [fetchSession]);
  useEffect(() => { if (eventId) fetchPolls(); }, [eventId, fetchPolls]);

  useConferenceRealtime({
    onSessionsChange: fetchSession,
    onPollsChange: fetchPolls,
    onVotesChange: fetchPolls,
  });

  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await fetchPolls();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  // Deploy a single poll
  const deployPoll = (id: string) =>
    act(async () => {
      const res = await fetch(`/api/conference/polls/${id}/deploy`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to deploy");
      }
    });

  // Close active poll
  const closePoll = (id: string) =>
    act(async () => {
      const res = await fetch(`/api/conference/polls/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false, show_results: false }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to close");
      }
    });

  // Close current and deploy next
  const closeAndNext = (currentId: string, nextId: string) =>
    act(async () => {
      const closeRes = await fetch(`/api/conference/polls/${currentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false, show_results: false }),
      });
      if (!closeRes.ok) throw new Error("Failed to close current poll");
      const deployRes = await fetch(`/api/conference/polls/${nextId}/deploy`, { method: "POST" });
      if (!deployRes.ok) throw new Error("Failed to deploy next poll");
    });

  // Recall — undeploy and discard votes
  const recallPoll = (id: string) =>
    act(async () => {
      const res = await fetch(`/api/conference/polls/${id}/recall`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to recall");
      }
    });

  // Spotlight — push one question's results to attendee screens
  const spotlight = (id: string, current: boolean) =>
    act(async () => {
      const res = await fetch(`/api/conference/polls/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show_results: !current }),
      });
      if (!res.ok) throw new Error("Failed to toggle spotlight");
    });

  // Show all results at once
  const showAllResults = () =>
    act(async () => {
      const closed = polls.filter((p) => p.is_deployed && !p.is_active);
      await Promise.all(
        closed.map((p) =>
          fetch(`/api/conference/polls/${p.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ show_results: true }),
          })
        )
      );
    });

  // Stop sharing all results
  const stopSharing = () =>
    act(async () => {
      const showing = polls.filter((p) => p.show_results);
      await Promise.all(
        showing.map((p) =>
          fetch(`/api/conference/polls/${p.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ show_results: false }),
          })
        )
      );
    });

  const live = polls.find((p) => p.is_active);
  const queued = polls.filter((p) => !p.is_deployed && !p.is_active);
  const done = polls.filter((p) => p.is_deployed && !p.is_active);
  const nextInQueue = queued[0] ?? null;
  const totalVotes = live ? (live.votes ?? []).reduce((s, v) => s + v, 0) : 0;
  const anyShowing = polls.some((p) => p.show_results);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#0D1117" }}>
        <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: "#21262D", borderTopColor: GOLD }} />
      </div>
    );
  }

  if (!eventId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center" style={{ background: "#0D1117" }}>
        <p className="text-white text-xl font-bold">No Active Session</p>
        <p className="text-[#8B949E] text-sm">Activate a session from the Host Dashboard first.</p>
        <a href="/host" className="text-sm underline" style={{ color: GOLD }}>Go to Host Dashboard</a>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-8 gap-6 max-w-lg mx-auto" style={{ background: "#0D1117" }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold tracking-widest text-[#8B949E]">PRESENTER MODE</p>
        <a href="/host" className="text-xs text-[#8B949E] underline">War Room</a>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl px-4 py-3 border" style={{ background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.2)" }}>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* LIVE POLL */}
      {live && (
        <div className="rounded-3xl border p-6 space-y-5" style={{ background: "#161B22", borderColor: "rgba(52,211,153,0.3)" }}>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest px-3 py-1 rounded-full" style={{ background: "rgba(52,211,153,0.1)", color: "#34D399" }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#34D399" }} />
              LIVE
            </span>
            <span className="text-xs text-[#8B949E]">{done.length + 1} of {polls.length}</span>
          </div>

          <p className="text-2xl font-bold text-white leading-snug">{live.question}</p>

          <p className="text-5xl font-black" style={{ color: GOLD }}>
            {totalVotes}
            <span className="text-base font-medium text-[#8B949E] ml-2">vote{totalVotes !== 1 ? "s" : ""}</span>
          </p>

          {/* Vote bars */}
          <div className="space-y-3">
            {(live.options ?? []).map((opt, idx) => {
              const count = live.votes?.[idx] ?? 0;
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#8B949E] truncate pr-2">{opt}</span>
                    <span className="text-white font-semibold shrink-0">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "#21262D" }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: GOLD }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            {nextInQueue ? (
              <button
                onClick={() => closeAndNext(live.id, nextInQueue.id)}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 py-5 rounded-2xl font-bold text-base transition-all disabled:opacity-50"
                style={{ background: "rgba(39,100,255,0.15)", color: "#60a5fa", border: "1px solid rgba(39,100,255,0.3)" }}
              >
                <ArrowRight size={22} />
                Close &amp; Next
              </button>
            ) : (
              <button
                onClick={() => closePoll(live.id)}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 py-5 rounded-2xl font-bold text-base transition-all disabled:opacity-50"
                style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <StopCircle size={22} />
                Close Poll
              </button>
            )}
          </div>

          {/* Recall */}
          <button
            onClick={() => recallPoll(live.id)}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: "rgba(234,179,8,0.08)", color: "#ca8a04", border: "1px solid rgba(234,179,8,0.15)" }}
          >
            <Undo2 size={16} />
            Recall (Undo Deploy)
          </button>
        </div>
      )}

      {/* NEXT UP — no live poll */}
      {!live && nextInQueue && (
        <div className="rounded-3xl border p-6 space-y-5 text-center" style={{ background: "#161B22", borderColor: "rgba(39,100,255,0.2)" }}>
          <p className="text-xs font-bold tracking-widest text-[#8B949E]">
            {done.length === 0 ? "UP FIRST" : "NEXT QUESTION"}
          </p>
          <p className="text-2xl font-bold text-white leading-snug">{nextInQueue.question}</p>
          <p className="text-xs text-[#8B949E]">{(nextInQueue.options as string[]).join(" · ")}</p>
          <button
            onClick={() => deployPoll(nextInQueue.id)}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 py-6 rounded-2xl font-bold text-xl transition-all disabled:opacity-50 hover:brightness-110"
            style={{ background: GOLD, color: "#0D1117" }}
          >
            <Play size={26} fill="#0D1117" />
            {done.length === 0 ? "Start Poll" : "Start Next Poll"}
          </button>
        </div>
      )}

      {/* ALL DONE */}
      {!live && !nextInQueue && done.length > 0 && (
        <div className="rounded-3xl border p-6 text-center space-y-2" style={{ background: "#161B22", borderColor: "rgba(52,211,153,0.2)" }}>
          <p className="text-2xl text-white font-bold">All polls complete</p>
          <p className="text-sm text-[#8B949E]">Use the controls below to share results.</p>
        </div>
      )}

      {/* QUEUE */}
      {queued.length > (live ? 0 : 1) && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: "#161B22", borderColor: "#21262D" }}>
          <p className="px-4 py-3 text-xs font-bold tracking-widest text-[#8B949E]">UP NEXT</p>
          {(live ? queued : queued.slice(1)).map((poll, idx) => (
            <div key={poll.id} className="flex items-center gap-3 px-4 py-3 border-t" style={{ borderColor: "#21262D" }}>
              <span className="w-6 h-6 rounded-full text-xs font-bold text-[#8B949E] flex items-center justify-center shrink-0" style={{ background: "#21262D" }}>
                {done.length + (live ? 2 : 2) + idx}
              </span>
              <p className="text-sm text-[#8B949E] truncate">{poll.question}</p>
            </div>
          ))}
        </div>
      )}

      {/* RESULT CONTROLS */}
      {done.length > 0 && (
        <div className="rounded-2xl border p-4 space-y-3" style={{ background: "#161B22", borderColor: "#21262D" }}>
          <p className="text-xs font-bold tracking-widest text-[#8B949E]">RESULT SHARING</p>
          <div className="flex gap-3">
            <button
              onClick={showAllResults}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
              style={{ background: "rgba(39,100,255,0.15)", color: "#60a5fa", border: "1px solid rgba(39,100,255,0.3)" }}
            >
              <BarChart2 size={18} />
              Show All Results
            </button>
            <button
              onClick={stopSharing}
              disabled={busy || !anyShowing}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
              style={{ background: "rgba(107,114,128,0.1)", color: "#9CA3AF", border: "1px solid rgba(107,114,128,0.2)" }}
            >
              <EyeOff size={18} />
              Stop Sharing
            </button>
          </div>
        </div>
      )}

      {/* DONE LIST */}
      {done.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: "#161B22", borderColor: "#21262D" }}>
          <button
            onClick={() => setShowDone(!showDone)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold tracking-widest text-[#8B949E] hover:text-white transition-colors"
          >
            <span>COMPLETED ({done.length})</span>
            {showDone ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showDone && done.map((poll) => (
            <div key={poll.id} className="px-4 py-3 border-t space-y-2" style={{ borderColor: "#21262D" }}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[#8B949E] flex-1 truncate">{poll.question}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => spotlight(poll.id, poll.show_results)}
                    disabled={busy}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                    style={poll.show_results
                      ? { background: "rgba(52,211,153,0.15)", color: "#34D399", border: "1px solid rgba(52,211,153,0.3)" }
                      : { background: "#21262D", color: "#8B949E", border: "1px solid #30363D" }
                    }
                  >
                    <BarChart2 size={12} />
                    {poll.show_results ? "Showing" : "Spotlight"}
                  </button>
                  <button
                    onClick={() => recallPoll(poll.id)}
                    disabled={busy}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                    style={{ background: "#21262D", color: "#8B949E", border: "1px solid #30363D" }}
                  >
                    <Undo2 size={12} />
                    Recall
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
