"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Radio,
  BarChart3,
  MessageSquare,
  Archive,
  Users,
  Megaphone,
  TrendingUp,
  CheckCircle2,
  Clock,
} from "lucide-react";
import PresenterRemote from "@/features/conference/admin/PresenterRemote";
import QuestionModerator from "@/features/conference/admin/QuestionModerator";
import SessionHistory from "@/features/conference/admin/SessionHistory";
import AnnouncementManager from "@/features/conference/admin/AnnouncementManager";
import { useConferenceRealtime } from "@/features/conference/hooks/useConferenceRealtime";
import { CONFERENCE_COLORS } from "@/features/conference/constants";
import type { ConferenceSession, PollWithVotes } from "@/features/conference/types";

const GOLD = CONFERENCE_COLORS.gold;

type HostTab = "live" | "polls" | "qa" | "announce" | "results" | "history";

const TABS: { id: HostTab; label: string; Icon: React.ElementType }[] = [
  { id: "live", label: "Live", Icon: Radio },
  { id: "polls", label: "Polls", Icon: BarChart3 },
  { id: "qa", label: "Q&A", Icon: MessageSquare },
  { id: "announce", label: "Announce", Icon: Megaphone },
  { id: "results", label: "Results", Icon: TrendingUp },
  { id: "history", label: "History", Icon: Archive },
];

export default function HostContent() {
  const { data: authSession } = useSession();
  const userName = authSession?.user?.name ?? "Host";

  const [activeSession, setActiveSession] = useState<ConferenceSession | null>(null);
  const [allSessions, setAllSessions] = useState<ConferenceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<HostTab>("live");
  const [sessionMode, setSessionMode] = useState<"sequential" | "simultaneous">("sequential");
  const [anyPollDeployed, setAnyPollDeployed] = useState(false);
  const [settingMode, setSettingMode] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  // Live tab — activation flow
  const [showSessionList, setShowSessionList] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);

  // Live tab — elapsed timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Results tab
  const [polls, setPolls] = useState<PollWithVotes[]>([]);
  const resultsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── FETCH ACTIVE SESSION ──
  const fetchActiveSession = useCallback(async () => {
    try {
      const res = await fetch("/api/conference/sessions?active_only=true");
      if (!res.ok) return;
      const data: ConferenceSession[] = await res.json();
      if (data.length > 0) {
        setActiveSession(data[0]);
        setSessionMode(data[0].session_mode);
      } else {
        setActiveSession(null);
      }
    } catch {
      // keep current state
    } finally {
      setLoading(false);
    }
  }, []);

  // ── FETCH ALL SESSIONS (for Live tab session list) ──
  const fetchAllSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/conference/sessions");
      if (!res.ok) return;
      const data: ConferenceSession[] = await res.json();
      setAllSessions(data);
    } catch {
      // ignore
    }
  }, []);

  // ── FETCH POLL DEPLOYED STATE ──
  const fetchPollsDeployed = useCallback(async (eventId: string) => {
    try {
      const res = await fetch(`/api/conference/polls?event_id=${eventId}`);
      if (!res.ok) return;
      const data: PollWithVotes[] = await res.json();
      setAnyPollDeployed(data.some((p) => p.is_deployed));
    } catch {
      // ignore
    }
  }, []);

  // ── FETCH POLL RESULTS ──
  const fetchPollResults = useCallback(async (eventId: string) => {
    try {
      const res = await fetch(`/api/conference/polls?event_id=${eventId}`);
      if (!res.ok) return;
      const data: PollWithVotes[] = await res.json();
      setPolls(data);
    } catch {
      // ignore
    }
  }, []);

  // Boot load
  useEffect(() => {
    fetchActiveSession();
  }, [fetchActiveSession]);

  // Poll deployed state when activeSession changes
  useEffect(() => {
    if (activeSession?.event_id) {
      fetchPollsDeployed(activeSession.event_id);
    }
  }, [activeSession, fetchPollsDeployed]);

  // Elapsed timer — start/stop with active session
  useEffect(() => {
    if (elapsedRef.current) clearInterval(elapsedRef.current);
    if (activeSession?.id) {
      setElapsedSeconds(0);
      elapsedRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [activeSession?.id]);

  // Results polling — 10s interval when on results tab with an active event
  useEffect(() => {
    if (resultsTimerRef.current) clearInterval(resultsTimerRef.current);
    const eventId = activeSession?.event_id;
    if (tab === "results" && eventId) {
      fetchPollResults(eventId);
      resultsTimerRef.current = setInterval(() => fetchPollResults(eventId), 10_000);
    }
    return () => {
      if (resultsTimerRef.current) clearInterval(resultsTimerRef.current);
    };
  }, [tab, activeSession?.event_id, fetchPollResults]);

  // Session list when showing picker
  useEffect(() => {
    if (showSessionList) fetchAllSessions();
  }, [showSessionList, fetchAllSessions]);

  useConferenceRealtime({
    onSessionsChange: fetchActiveSession,
    onPollsChange: () => {
      if (activeSession?.event_id) {
        fetchPollsDeployed(activeSession.event_id);
        if (tab === "results") fetchPollResults(activeSession.event_id);
      }
    },
  });

  // ── SET MODE ──
  const setMode = async (mode: "sequential" | "simultaneous") => {
    if (!activeSession || anyPollDeployed) return;
    setSettingMode(true);
    try {
      const res = await fetch(`/api/conference/sessions/${activeSession.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_mode: mode }),
      });
      if (res.ok) {
        setSessionMode(mode);
        setActiveSession((prev) => (prev ? { ...prev, session_mode: mode } : prev));
      }
    } finally {
      setSettingMode(false);
    }
  };

  // ── ACTIVATE SESSION ──
  const activateSession = async (sessionId: string) => {
    setActivating(sessionId);
    try {
      const res = await fetch(`/api/conference/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      });
      if (res.ok) {
        setShowSessionList(false);
        await fetchActiveSession();
      }
    } finally {
      setActivating(null);
    }
  };

  // ── END SESSION ──
  const endSession = async () => {
    if (!activeSession) return;
    const confirmed = window.confirm(
      "End this session? Results will be archived and the session will close for all attendees."
    );
    if (!confirmed) return;

    setEndingSession(true);
    setEndError(null);
    try {
      const res = await fetch(`/api/conference/sessions/${activeSession.id}/end`, {
        method: "POST",
      });
      if (res.ok) {
        setSessionEnded(true);
        setActiveSession(null);
      } else {
        const body = await res.json().catch(() => ({}));
        setEndError((body as { error?: string }).error || "Failed to end session");
      }
    } catch {
      setEndError("Failed to end session");
    } finally {
      setEndingSession(false);
    }
  };

  // ── FORMAT ELAPSED ──
  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ── LOADING ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#0D1117" }}>
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: "#21262D", borderTopColor: GOLD }}
        />
      </div>
    );
  }

  // ── SESSION JUST ENDED ──
  if (sessionEnded) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-6 px-6 text-center"
        style={{ background: "#0D1117" }}
      >
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Session Ended
        </h1>
        <p className="text-[#8B949E] text-sm max-w-xs">
          Results have been archived. View them in Session History.
        </p>
        <Link
          href="/host"
          onClick={() => {
            setSessionEnded(false);
            setLoading(true);
            fetchActiveSession();
          }}
          className="px-6 py-3 rounded-2xl text-sm font-semibold border border-[#21262D] text-[#8B949E] hover:text-white hover:border-[#30363D] transition-all"
        >
          Back to Host Dashboard
        </Link>
      </div>
    );
  }

  // ── SHARED: event id ──
  const eventId = activeSession?.event_id ?? "";

  // ── LIVE TAB — IDLE: no active session ──
  const LiveTabIdle = () => (
    <div className="flex flex-col items-center gap-6 px-6 py-12 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
          No Session Live
        </h2>
        <p className="text-[#8B949E] text-sm">Select a session to activate it for attendees.</p>
      </div>

      {!showSessionList ? (
        <button
          onClick={() => setShowSessionList(true)}
          className="flex items-center justify-center gap-3 w-full max-w-sm py-5 rounded-2xl font-bold text-base transition-all hover:brightness-110"
          style={{ background: GOLD, color: "#0D1117" }}
        >
          <Radio size={20} />
          Activate Live Session
        </button>
      ) : (
        <div className="w-full max-w-sm space-y-3">
          <p className="text-xs text-[#8B949E] font-semibold tracking-widest text-left">
            SELECT A SESSION
          </p>
          {allSessions.length === 0 ? (
            <p className="text-sm text-[#8B949E] py-6">
              No sessions found. Create one in the{" "}
              <Link href="/admin" className="underline" style={{ color: GOLD }}>
                Admin panel
              </Link>
              .
            </p>
          ) : (
            allSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => activateSession(s.id)}
                disabled={activating === s.id}
                className="w-full text-left px-4 py-4 rounded-2xl border transition-all disabled:opacity-50"
                style={{ background: "#161B22", borderColor: "#21262D" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{s.title}</p>
                    {s.time_label && (
                      <p className="text-xs text-[#8B949E] mt-0.5">{s.time_label}</p>
                    )}
                    {s.speaker && (
                      <p className="text-xs text-[#8B949E]">{s.speaker}</p>
                    )}
                  </div>
                  {activating === s.id ? (
                    <div
                      className="w-4 h-4 border-2 rounded-full animate-spin shrink-0"
                      style={{ borderColor: "#21262D", borderTopColor: GOLD }}
                    />
                  ) : (
                    <span className="text-xs font-bold shrink-0" style={{ color: GOLD }}>
                      GO LIVE
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
          <button
            onClick={() => setShowSessionList(false)}
            className="text-xs text-[#8B949E] underline"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );

  // ── LIVE TAB — ACTIVE: session is live ──
  const LiveTabActive = () => (
    <div className="flex flex-col gap-6 px-4 py-6">
      {/* Session card */}
      <div
        className="rounded-2xl border p-5 space-y-4"
        style={{ background: "#161B22", borderColor: "#21262D" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-widest text-[#8B949E] mb-1">CURRENT SESSION</p>
            <h2 className="text-lg font-bold text-white leading-tight">{activeSession?.title}</h2>
            {activeSession?.speaker && (
              <p className="text-sm text-[#8B949E] mt-1">{activeSession.speaker}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#EF4444" }} />
            <span className="text-xs font-bold tracking-widest" style={{ color: "#EF4444" }}>LIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[#8B949E]" />
            <span className="text-sm font-mono text-white">{formatElapsed(elapsedSeconds)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} className="text-[#8B949E]" />
            <span className="text-sm text-[#8B949E]">--</span>
          </div>
        </div>
      </div>

      {/* Mode selector */}
      <div>
        <p className="text-xs font-bold tracking-widest text-[#8B949E] mb-3">POLL MODE</p>
        {anyPollDeployed ? (
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={
                sessionMode === "simultaneous"
                  ? { background: "rgba(168,85,247,0.1)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.2)" }
                  : { background: "rgba(39,100,255,0.1)", color: "#60a5fa", border: "1px solid rgba(39,100,255,0.2)" }
              }
            >
              {sessionMode === "simultaneous" ? "Deploy All" : "One at a Time"}
            </span>
            <span className="text-[10px] font-bold tracking-widest text-[#8B949E]">LOCKED</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode("sequential")}
              disabled={settingMode}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-50"
              style={
                sessionMode === "sequential"
                  ? { background: "#2764FF", color: "#fff" }
                  : { background: "#21262D", color: "#8B949E" }
              }
            >
              One at a Time
            </button>
            <button
              onClick={() => setMode("simultaneous")}
              disabled={settingMode}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-50"
              style={
                sessionMode === "simultaneous"
                  ? { background: "#a855f7", color: "#fff" }
                  : { background: "#21262D", color: "#8B949E" }
              }
            >
              Deploy All
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-[#8B949E]">
        Use the Polls tab to deploy and control questions. Use Announce to push messages to attendees.
      </p>
    </div>
  );

  // ── RESULTS TAB ──
  const ResultsTab = () => {
    if (!eventId) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
          <p className="text-sm text-[#8B949E]">No event linked to the active session.</p>
        </div>
      );
    }

    if (polls.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
          <TrendingUp size={32} className="text-[#30363D]" />
          <p className="text-sm text-[#8B949E]">No polls yet. Deploy a poll from the Polls tab.</p>
        </div>
      );
    }

    return (
      <div className="px-4 py-4 space-y-4">
        <p className="text-[10px] font-bold tracking-widest text-[#8B949E]">
          LIVE RESULTS — updates every 10s
        </p>
        {polls.map((poll) => {
          const total = poll.totalVotes ?? 0;
          const isLive = poll.is_deployed && !poll.closed_at;
          const isClosed = !!poll.closed_at;

          return (
            <div
              key={poll.id}
              className="rounded-2xl border p-4 space-y-3"
              style={{ background: "#161B22", borderColor: "#21262D" }}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-white leading-snug">{poll.question}</p>
                <span
                  className="text-[10px] font-bold tracking-widest shrink-0 px-2 py-1 rounded-full"
                  style={
                    isLive
                      ? { background: "rgba(239,68,68,0.1)", color: "#EF4444" }
                      : isClosed
                      ? { background: "rgba(107,114,128,0.1)", color: "#6B7280" }
                      : { background: "rgba(39,100,255,0.1)", color: "#60a5fa" }
                  }
                >
                  {isLive ? "LIVE" : isClosed ? "CLOSED" : "QUEUED"}
                </span>
              </div>

              <div className="space-y-2">
                {poll.options.map((option, idx) => {
                  const votes = poll.votes?.[idx] ?? 0;
                  const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#8B949E] truncate mr-2">{option}</span>
                        <span className="text-white font-semibold shrink-0">
                          {votes} <span className="text-[#8B949E] font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#21262D" }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: GOLD }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <CheckCircle2 size={12} className="text-[#8B949E]" />
                <span className="text-[11px] text-[#8B949E]">{total} vote{total !== 1 ? "s" : ""} cast</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── MAIN LAYOUT ──
  return (
    <div
      className="flex flex-col"
      style={{
        background: "#0D1117",
        minHeight: "100dvh",
        paddingTop: "calc(72px + env(safe-area-inset-top, 0px))",
      }}
    >
      {/* STICKY LIVE TOP BAR — only when session is active */}
      {activeSession && (
        <div
          className="sticky flex items-center justify-between px-4 py-3 border-b"
          style={{
            top: "calc(72px + env(safe-area-inset-top, 0px))",
            background: "#0D1117",
            borderColor: "#21262D",
            zIndex: 30,
          }}
        >
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "#EF4444" }} />
            <span className="text-sm font-bold tracking-widest" style={{ color: GOLD }}>LIVE</span>
          </div>
          <p className="text-sm font-semibold text-white truncate mx-3 flex-1 text-center">
            {activeSession.title}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-[#8B949E] shrink-0">
            <Users size={13} aria-hidden="true" />
            <span>--</span>
          </div>
        </div>
      )}

      {/* IDLE HEADER — no active session */}
      {!activeSession && (
        <div
          className="px-4 py-4 border-b"
          style={{ borderColor: "#21262D" }}
        >
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Host Dashboard
          </h1>
          <p className="text-sm text-[#8B949E] mt-1">Welcome back, {userName}</p>
        </div>
      )}

      {/* TABS */}
      <div
        className="flex border-b overflow-x-auto scrollbar-hide"
        style={{ borderColor: "#21262D" }}
      >
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-colors -mb-px min-h-[48px] whitespace-nowrap"
            style={
              tab === id
                ? { borderColor: GOLD, color: GOLD }
                : { borderColor: "transparent", color: "#8B949E" }
            }
          >
            <Icon size={14} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom: activeSession
            ? "calc(88px + 64px + env(safe-area-inset-bottom, 0px))"
            : "calc(32px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {tab === "live" && (
          activeSession ? <LiveTabActive /> : <LiveTabIdle />
        )}

        {tab === "polls" && (
          <div className="pt-2">
            {activeSession && eventId ? (
              <PresenterRemote eventId={eventId} sessionId={activeSession.id} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
                <BarChart3 size={32} className="text-[#30363D]" />
                <p className="text-sm text-[#8B949E]">
                  Activate a session from the Live tab to manage polls.
                </p>
              </div>
            )}
          </div>
        )}

        {tab === "qa" && (
          <div className="px-4 pt-4">
            <QuestionModerator eventId={eventId || undefined} />
          </div>
        )}

        {tab === "announce" && (
          <div className="px-4 pt-4">
            <AnnouncementManager eventId={eventId || undefined} />
          </div>
        )}

        {tab === "results" && <ResultsTab />}

        {tab === "history" && (
          <div className="px-4 pt-4">
            {eventId ? (
              <SessionHistory eventId={eventId} />
            ) : (
              <p className="text-sm text-[#8B949E] text-center py-8">
                No event linked to the active session.
              </p>
            )}
          </div>
        )}
      </div>

      {/* END SESSION — sticky bottom, only when live */}
      {activeSession && (
        <div
          className="fixed left-0 right-0 border-t"
          style={{
            bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
            background: "#0D1117",
            borderColor: "#21262D",
            zIndex: 30,
            padding: "12px 16px",
          }}
        >
          {endError && (
            <p className="text-xs text-red-400 text-center mb-2">{endError}</p>
          )}
          <button
            onClick={endSession}
            disabled={endingSession}
            className="w-full font-bold text-base rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "#7f1d1d",
              color: "#fff",
              border: "1px solid rgba(239,68,68,0.3)",
              minHeight: "56px",
            }}
          >
            {endingSession ? "Ending Session…" : "END SESSION"}
          </button>
        </div>
      )}
    </div>
  );
}
