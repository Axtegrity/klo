"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  Archive,
} from "lucide-react";
import PresenterRemote from "@/features/conference/admin/PresenterRemote";
import QuestionModerator from "@/features/conference/admin/QuestionModerator";
import AnnouncementManager from "@/features/conference/admin/AnnouncementManager";
import SessionHistory from "@/features/conference/admin/SessionHistory";
import { useConferenceRealtime } from "@/features/conference/hooks/useConferenceRealtime";
import { CONFERENCE_COLORS } from "@/features/conference/constants";
import type { ConferenceSession } from "@/features/conference/types";

const GOLD = CONFERENCE_COLORS.gold;

export default function HostContent() {
  const { data: authSession } = useSession();
  const userName = authSession?.user?.name ?? "Host";

  const [activeSession, setActiveSession] = useState<ConferenceSession | null>(null);
  const [allSessions, setAllSessions] = useState<ConferenceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionMode, setSessionMode] = useState<"sequential" | "simultaneous">("sequential");
  const [anyPollDeployed, setAnyPollDeployed] = useState(false);
  const [settingMode, setSettingMode] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  // Secondary sections (collapsed by default on mobile to keep polls front-and-center)
  const [qaOpen, setQaOpen] = useState(true);
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Session picker
  const [activating, setActivating] = useState<string | null>(null);
  const [liveEventError, setLiveEventError] = useState<string | null>(null);

  // Elapsed timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const fetchLiveEventSessions = useCallback(async () => {
    setLiveEventError(null);
    try {
      const eventRes = await fetch("/api/conference/host-event");
      if (!eventRes.ok) {
        setLiveEventError("Could not load event. Try again.");
        return;
      }
      const { event } = await eventRes.json();
      if (!event) {
        setAllSessions([]);
        setLiveEventError("No live event found. Ask your admin to go live first.");
        return;
      }
      const sessionsRes = await fetch(`/api/conference/sessions?event_id=${event.id}`);
      if (!sessionsRes.ok) {
        setLiveEventError("Could not load sessions. Try again.");
        return;
      }
      const data: ConferenceSession[] = await sessionsRes.json();
      setAllSessions(data);
    } catch {
      setLiveEventError("Could not load sessions. Try again.");
    }
  }, []);

  const fetchPollsDeployed = useCallback(async (eventId: string) => {
    try {
      const res = await fetch(`/api/conference/polls?event_id=${eventId}`);
      if (!res.ok) return;
      const data: { is_deployed: boolean }[] = await res.json();
      setAnyPollDeployed(data.some((p) => p.is_deployed));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchActiveSession();
    fetchLiveEventSessions();
  }, [fetchActiveSession, fetchLiveEventSessions]);

  useEffect(() => {
    if (activeSession?.event_id) {
      fetchPollsDeployed(activeSession.event_id);
    }
  }, [activeSession, fetchPollsDeployed]);

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

  useConferenceRealtime({
    onSessionsChange: fetchActiveSession,
    onPollsChange: () => {
      if (activeSession?.event_id) {
        fetchPollsDeployed(activeSession.event_id);
      }
    },
  });

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

  const activateSession = async (sessionId: string) => {
    setActivating(sessionId);
    try {
      const res = await fetch(`/api/conference/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      });
      if (res.ok) {
        await fetchActiveSession();
      }
    } finally {
      setActivating(null);
    }
  };

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

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

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

  if (sessionEnded) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-6 px-6 text-center"
        style={{ background: "#0D1117" }}
      >
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
          Session Ended
        </h1>
        <p className="text-[#8B949E] text-sm max-w-xs">Results have been archived. Start the next session when ready.</p>
        <button
          onClick={() => {
            setSessionEnded(false);
            setLoading(true);
            fetchActiveSession();
            fetchLiveEventSessions();
          }}
          className="px-6 py-3 rounded-2xl text-sm font-semibold border border-[#21262D] text-[#8B949E] hover:text-white hover:border-[#30363D] transition-all"
        >
          Run Next Session
        </button>
      </div>
    );
  }

  const eventId = activeSession?.event_id ?? "";

  // ── IDLE: session picker ──
  if (!activeSession) {
    return (
      <div
        className="flex flex-col"
        style={{
          background: "#0D1117",
          minHeight: "100dvh",
          paddingTop: "calc(72px + env(safe-area-inset-top, 0px))",
        }}
      >
        <div className="px-5 py-6 border-b" style={{ borderColor: "#21262D" }}>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            Host Dashboard
          </h1>
          <p className="text-sm text-[#8B949E] mt-1">Welcome, {userName}</p>
        </div>

        <div className="flex-1 px-5 py-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Select a session to start</h2>
            <p className="text-sm text-[#8B949E]">Tap a session — attendees will see it go live instantly.</p>
          </div>

          {liveEventError ? (
            <div
              className="rounded-2xl border px-4 py-5 text-center space-y-3"
              style={{ background: "#161B22", borderColor: "#21262D" }}
            >
              <p className="text-sm text-[#8B949E]">{liveEventError}</p>
              <Link href="/admin?tab=conference" className="text-xs font-bold underline" style={{ color: GOLD }}>
                Go to Admin → Conference
              </Link>
            </div>
          ) : allSessions.length === 0 ? (
            <div
              className="rounded-2xl border px-4 py-5 text-center space-y-3"
              style={{ background: "#161B22", borderColor: "#21262D" }}
            >
              <p className="text-sm text-[#8B949E]">No sessions found for this event.</p>
              <Link href="/admin?tab=conference" className="text-xs font-bold underline" style={{ color: GOLD }}>
                Add sessions in Admin
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {allSessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => activateSession(s.id)}
                  disabled={activating === s.id}
                  className="w-full text-left px-4 py-4 rounded-2xl border transition-all disabled:opacity-50 hover:border-[#C8A84E]/40"
                  style={{ background: "#161B22", borderColor: "#21262D" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{s.title}</p>
                      {s.time_label && <p className="text-xs text-[#8B949E] mt-0.5">{s.time_label}</p>}
                      {s.speaker && <p className="text-xs text-[#8B949E]">{s.speaker}</p>}
                    </div>
                    {activating === s.id ? (
                      <div
                        className="w-4 h-4 border-2 rounded-full animate-spin shrink-0"
                        style={{ borderColor: "#21262D", borderTopColor: GOLD }}
                      />
                    ) : (
                      <span className="text-xs font-bold shrink-0" style={{ color: GOLD }}>
                        GO LIVE →
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── ACTIVE: single-screen run-of-show ──
  return (
    <div
      className="flex flex-col"
      style={{
        background: "#0D1117",
        minHeight: "100dvh",
        paddingTop: "calc(72px + env(safe-area-inset-top, 0px))",
      }}
    >
      {/* Sticky top bar */}
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
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-[#8B949E]">
            <Clock size={12} />
            <span className="font-mono">{formatElapsed(elapsedSeconds)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#8B949E]">
            <Users size={12} />
            <span>--</span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Poll mode selector */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold tracking-widest text-[#8B949E]">POLL MODE</p>
            {anyPollDeployed && (
              <span className="text-[10px] font-bold tracking-widest text-[#8B949E]">LOCKED</span>
            )}
          </div>
          {anyPollDeployed ? (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={
                sessionMode === "simultaneous"
                  ? { background: "rgba(168,85,247,0.1)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.2)" }
                  : { background: "rgba(39,100,255,0.1)", color: "#60a5fa", border: "1px solid rgba(39,100,255,0.2)" }
              }
            >
              {sessionMode === "simultaneous" ? "Deploy All at Once" : "One at a Time"}
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode("sequential")}
                disabled={settingMode}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-50"
                style={sessionMode === "sequential" ? { background: "#2764FF", color: "#fff" } : { background: "#21262D", color: "#8B949E" }}
              >
                One at a Time
              </button>
              <button
                onClick={() => setMode("simultaneous")}
                disabled={settingMode}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-50"
                style={sessionMode === "simultaneous" ? { background: "#a855f7", color: "#fff" } : { background: "#21262D", color: "#8B949E" }}
              >
                Deploy All
              </button>
            </div>
          )}
        </div>

        {/* Polls — always visible, primary control */}
        <div className="pt-2">
          {eventId ? (
            <PresenterRemote eventId={eventId} sessionId={activeSession.id} />
          ) : (
            <p className="text-sm text-[#8B949E] text-center py-8">No event linked to this session.</p>
          )}
        </div>

        {/* Q&A — collapsible */}
        <div className="border-t" style={{ borderColor: "#21262D" }}>
          <button
            onClick={() => setQaOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-xs font-bold tracking-widest text-[#8B949E]">Q&amp;A</span>
            {qaOpen ? <ChevronUp size={14} className="text-[#8B949E]" /> : <ChevronDown size={14} className="text-[#8B949E]" />}
          </button>
          {qaOpen && (
            <div className="px-4 pb-4">
              <QuestionModerator eventId={eventId || undefined} />
            </div>
          )}
        </div>

        {/* Announcements — collapsible */}
        <div className="border-t" style={{ borderColor: "#21262D" }}>
          <button
            onClick={() => setAnnounceOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-xs font-bold tracking-widest text-[#8B949E]">ANNOUNCE</span>
            {announceOpen ? <ChevronUp size={14} className="text-[#8B949E]" /> : <ChevronDown size={14} className="text-[#8B949E]" />}
          </button>
          {announceOpen && eventId && (
            <div className="px-4 pb-4">
              <AnnouncementManager eventId={eventId} />
            </div>
          )}
        </div>

        {/* History — collapsible */}
        <div className="border-t" style={{ borderColor: "#21262D" }}>
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <Archive size={12} className="text-[#8B949E]" />
              <span className="text-xs font-bold tracking-widest text-[#8B949E]">HISTORY</span>
            </div>
            {historyOpen ? <ChevronUp size={14} className="text-[#8B949E]" /> : <ChevronDown size={14} className="text-[#8B949E]" />}
          </button>
          {historyOpen && eventId && (
            <div className="px-4 pb-4">
              <SessionHistory eventId={eventId} />
            </div>
          )}
        </div>
      </div>

      {/* End Session — sticky bottom */}
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
        {endError && <p className="text-xs text-red-400 text-center mb-2">{endError}</p>}
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
    </div>
  );
}
