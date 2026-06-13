"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Radio,
  BarChart3,
  MessageSquare,
  Archive,
  Users,
} from "lucide-react";
import PresenterRemote from "@/features/conference/admin/PresenterRemote";
import QuestionModerator from "@/features/conference/admin/QuestionModerator";
import SessionHistory from "@/features/conference/admin/SessionHistory";
import { useConferenceRealtime } from "@/features/conference/hooks/useConferenceRealtime";
import { CONFERENCE_COLORS } from "@/features/conference/constants";
import type { ConferenceSession } from "@/features/conference/types";

const GOLD = CONFERENCE_COLORS.gold;

type HostTab = "polls" | "qa" | "history";

export default function HostContent() {
  const { data: authSession } = useSession();
  const userName = authSession?.user?.name ?? "Host";

  const [activeSession, setActiveSession] = useState<ConferenceSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<HostTab>("polls");
  const [sessionMode, setSessionMode] = useState<"sequential" | "simultaneous">("sequential");
  const [anyPollDeployed, setAnyPollDeployed] = useState(false);
  const [settingMode, setSettingMode] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);

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

  const fetchPollsDeployed = useCallback(async (eventId: string) => {
    try {
      const res = await fetch(`/api/conference/polls?event_id=${eventId}`);
      if (!res.ok) return;
      const polls: { is_deployed: boolean }[] = await res.json();
      setAnyPollDeployed(polls.some((p) => p.is_deployed));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchActiveSession();
  }, [fetchActiveSession]);

  useEffect(() => {
    if (activeSession?.event_id) {
      fetchPollsDeployed(activeSession.event_id);
    }
  }, [activeSession, fetchPollsDeployed]);

  useConferenceRealtime({
    onSessionsChange: fetchActiveSession,
    onPollsChange: () => {
      if (activeSession?.event_id) fetchPollsDeployed(activeSession.event_id);
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
        setActiveSession((prev) =>
          prev ? { ...prev, session_mode: mode } : prev
        );
      }
    } finally {
      setSettingMode(false);
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
      const res = await fetch(
        `/api/conference/sessions/${activeSession.id}/end`,
        { method: "POST" }
      );
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

  // ── LOADING ──
  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "#0D1117" }}
      >
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{
            borderColor: "#21262D",
            borderTopColor: GOLD,
          }}
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

  // ── IDLE STATE — no active session ──
  if (!activeSession) {
    return (
      <div
        className="flex flex-col items-center justify-center px-6 text-center gap-8"
        style={{
          background: "#0D1117",
          minHeight: "100dvh",
          paddingTop: "calc(72px + env(safe-area-inset-top, 0px) + 32px)",
          paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px) + 32px)",
        }}
      >
        <div className="space-y-2">
          <h1
            className="text-4xl md:text-5xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Host Dashboard
          </h1>
          <p className="text-[#8B949E] text-base">Welcome back, {userName}</p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Link
            href="/admin"
            className="flex items-center justify-center gap-3 w-full py-5 rounded-2xl font-bold text-base transition-all hover:brightness-110"
            style={{ background: GOLD, color: "#0D1117" }}
          >
            <Radio size={20} />
            Go Live
          </Link>
          <Link
            href="/admin"
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-semibold text-sm transition-all"
            style={{
              border: "1px solid #21262D",
              color: "#8B949E",
            }}
          >
            <Archive size={18} />
            Session History
          </Link>
        </div>

        <p className="text-xs text-[#8B949E] max-w-xs leading-relaxed">
          No session is currently live. Use the Admin panel to create and start a session.
        </p>
      </div>
    );
  }

  // ── LIVE STATE ──
  const eventId = activeSession.event_id ?? "";

  return (
    <div
      className="flex flex-col"
      style={{
        background: "#0D1117",
        minHeight: "100dvh",
        paddingTop: "calc(72px + env(safe-area-inset-top, 0px))",
      }}
    >
      {/* ── STICKY LIVE TOP BAR ── */}
      <div
        className="sticky flex items-center justify-between px-4 py-3 border-b"
        style={{
          top: "calc(72px + env(safe-area-inset-top, 0px))",
          background: "#0D1117",
          borderColor: "#21262D",
          zIndex: 30,
        }}
      >
        {/* LIVE badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ background: "#EF4444" }}
          />
          <span
            className="text-sm font-bold tracking-widest"
            style={{ color: GOLD }}
          >
            LIVE
          </span>
        </div>

        {/* Session title */}
        <p className="text-sm font-semibold text-white truncate mx-3 flex-1 text-center">
          {activeSession.title}
        </p>

        {/* Attendee count — no live API available */}
        <div className="flex items-center gap-1.5 text-xs text-[#8B949E] shrink-0">
          <Users size={13} aria-hidden="true" />
          <span>--</span>
        </div>
      </div>

      {/* ── MODE BADGE ── */}
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: "#21262D" }}
      >
        {anyPollDeployed ? (
          /* Locked — polls already deployed */
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={
                sessionMode === "simultaneous"
                  ? {
                      background: "rgba(168,85,247,0.1)",
                      color: "#c084fc",
                      border: "1px solid rgba(168,85,247,0.2)",
                    }
                  : {
                      background: "rgba(39,100,255,0.1)",
                      color: "#60a5fa",
                      border: "1px solid rgba(39,100,255,0.2)",
                    }
              }
            >
              {sessionMode === "simultaneous" ? "Deploy All" : "One at a Time"}
            </span>
            <span
              className="text-[10px] font-bold tracking-widest"
              style={{ color: "#8B949E" }}
            >
              LOCKED
            </span>
          </div>
        ) : (
          /* Unlocked — allow mode selection */
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#8B949E] mr-1">Select Mode:</span>
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

      {/* ── TABS ── */}
      <div className="flex border-b px-2" style={{ borderColor: "#21262D" }}>
        {(
          [
            { id: "polls" as HostTab, label: "Polls", Icon: BarChart3 },
            { id: "qa" as HostTab, label: "Q&A", Icon: MessageSquare },
            { id: "history" as HostTab, label: "History", Icon: Archive },
          ] as const
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px min-h-[48px]"
            style={
              tab === id
                ? { borderColor: GOLD, color: GOLD }
                : { borderColor: "transparent", color: "#8B949E" }
            }
          >
            <Icon size={15} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom:
            "calc(88px + 64px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {tab === "polls" && (
          <div className="pt-2">
            {eventId ? (
              <PresenterRemote
                eventId={eventId}
                sessionId={activeSession.id}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
                <p className="text-sm text-[#8B949E]">
                  This session has no linked event. Manage polls from the{" "}
                  <Link href="/admin" className="underline" style={{ color: GOLD }}>
                    Admin panel
                  </Link>
                  .
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

        {tab === "history" && (
          <div className="px-4 pt-4">
            {eventId ? (
              <SessionHistory eventId={eventId} />
            ) : (
              <p className="text-sm text-[#8B949E] text-center py-8">
                No event linked to this session.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── END SESSION — sticky bottom, always visible ── */}
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
    </div>
  );
}
