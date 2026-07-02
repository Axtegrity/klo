"use client";

import { useState, useCallback, useEffect } from "react";
import { BarChart3, ChevronDown, ChevronUp, FileText } from "lucide-react";
import SessionManager from "./SessionManager";
import PollManager from "./PollManager";
import SessionFiles from "./SessionFiles";
import PresenterRemote from "./PresenterRemote";

interface Props {
  eventId: string;
  eventSlug: string;
  onSessionsChange?: () => void;
}

interface SessionPollsProps {
  sessionId: string;
  eventId: string;
  pollCount: number;
}

function SessionPolls({ sessionId, eventId, pollCount }: SessionPollsProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t pt-2" style={{ borderColor: "#21262D" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left px-1 py-1.5"
      >
        <div className="flex items-center gap-2">
          <BarChart3 size={13} className="text-[#8B949E]" />
          <span className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider">
            Polls {pollCount > 0 ? `(${pollCount})` : ""}
          </span>
        </div>
        {open ? <ChevronUp size={13} className="text-[#8B949E]" /> : <ChevronDown size={13} className="text-[#8B949E]" />}
      </button>
      {open && (
        <div className="mt-2">
          <PollManager eventId={eventId} sessionId={sessionId} />
        </div>
      )}
    </div>
  );
}

function SessionFilesSection({ sessionId, eventId }: { sessionId: string; eventId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t pt-2" style={{ borderColor: "#21262D" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left px-1 py-1.5"
      >
        <div className="flex items-center gap-2">
          <FileText size={13} className="text-[#8B949E]" />
          <span className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider">Files</span>
        </div>
        {open ? <ChevronUp size={13} className="text-[#8B949E]" /> : <ChevronDown size={13} className="text-[#8B949E]" />}
      </button>
      {open && (
        <div className="mt-2">
          <SessionFiles eventId={eventId} sessionId={sessionId} />
        </div>
      )}
    </div>
  );
}

function SessionPresenter({ session, eventId, eventSlug, onEnd, autoShowResults, onToggleAutoShow }: {
  session: { id: string; title: string };
  eventId: string;
  eventSlug: string;
  onEnd: () => void;
  autoShowResults?: boolean;
  onToggleAutoShow?: (value: boolean) => void;
}) {
  const [mode, setMode] = useState<"rehearsal" | "live" | null>(null);
  const [sessionMode, setSessionMode] = useState<"sequential" | "simultaneous">("sequential");
  const [sessionStarted, setSessionStarted] = useState(false);
  const [justExited, setJustExited] = useState(false);

  const startSession = async (newMode: "rehearsal" | "live") => {
    setJustExited(false);
    // Activate this session
    await fetch(`/api/conference/sessions/${session.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: true }),
    });
    // If live, set event seminar_mode = true
    if (newMode === "live") {
      await fetch(`/api/admin/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seminar_mode: true, rehearsal_mode: false }),
      });
    } else {
      await fetch(`/api/admin/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rehearsal_mode: true, seminar_mode: true }),
      });
    }
    await fetch(`/api/conference/sessions/${session.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_mode: sessionMode }),
    });
    setMode(newMode);
    setSessionStarted(true);
  };

  const endSession = async () => {
    await fetch(`/api/conference/sessions/${session.id}/end`, { method: "POST" });
    await fetch(`/api/admin/events/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seminar_mode: false, rehearsal_mode: false }),
    });
    setJustExited(true);
    setMode(null);
    setSessionStarted(false);
    onEnd();
  };

  const exitRehearsal = async () => {
    await fetch(`/api/conference/sessions/${session.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: false }),
    });
    await fetch(`/api/admin/events/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seminar_mode: false, rehearsal_mode: false }),
    });
    await fetch(`/api/conference/polls/reset?event_id=${eventId}`, { method: "POST" });
    setJustExited(true);
    setMode(null);
    setSessionStarted(false);
    onEnd();
  };

  const resetTestData = async () => {
    if (!window.confirm("Reset all polls? This clears all test votes.")) return;
    await fetch(`/api/conference/polls/reset?event_id=${eventId}`, { method: "POST" });
  };

  if (!mode) {
    return (
      <div className="border-t pt-3 space-y-2" style={{ borderColor: "#21262D" }}>
          <div className="rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: "rgba(107,114,128,0.08)", border: "1px solid rgba(107,114,128,0.2)" }}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#6B7280" }} />
            <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>Offline — attendees see the event page but no polls</span>
          </div>
          {justExited && (
            <div className="rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <span className="text-xs font-semibold" style={{ color: "#f87171" }}>✓ Session ended — event is now offline</span>
            </div>
          )}
        <div className="flex gap-2">
          <button
            onClick={() => startSession("rehearsal")}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}
          >
            Rehearse
          </button>
          <button
            onClick={() => startSession("live")}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" }}
          >
            Start Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t pt-3 space-y-3" style={{ borderColor: "#21262D" }}>
      <div
        className="rounded-xl p-3 space-y-3"
        style={{
          background: mode === "rehearsal" ? "rgba(139,92,246,0.05)" : "rgba(16,185,129,0.05)",
          border: `1px solid ${mode === "rehearsal" ? "rgba(139,92,246,0.3)" : "rgba(16,185,129,0.3)"}`,
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: mode === "rehearsal" ? "#a78bfa" : "#34d399" }}>
            {mode === "rehearsal" ? "🎭 Rehearsal" : "🔴 Live"}
          </span>
          <button
            onClick={mode === "rehearsal" ? exitRehearsal : endSession}
            className="px-3 py-1 rounded-lg text-xs font-bold"
            style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            {mode === "rehearsal" ? "Exit Rehearsal" : "End Event"}
          </button>
        </div>

        {/* Mode selector */}
        <div className="flex gap-2">
          <button
            onClick={async () => {
              setSessionMode("sequential");
              try {
                await fetch(`/api/conference/sessions/${session.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ session_mode: "sequential" }),
                });
              } catch { /* ignore if mode lock prevents change */ }
            }}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: sessionMode === "sequential" ? "rgba(39,100,255,0.2)" : "rgba(255,255,255,0.05)",
              color: sessionMode === "sequential" ? "#60a5fa" : "#8B949E",
              border: `1px solid ${sessionMode === "sequential" ? "rgba(39,100,255,0.4)" : "rgba(255,255,255,0.1)"}`,
            }}
          >
            One at a Time
          </button>
          <button
            onClick={async () => {
              setSessionMode("simultaneous");
              try {
                await fetch(`/api/conference/sessions/${session.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ session_mode: "simultaneous" }),
                });
              } catch { /* ignore if mode lock prevents change */ }
            }}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: sessionMode === "simultaneous" ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.05)",
              color: sessionMode === "simultaneous" ? "#a78bfa" : "#8B949E",
              border: `1px solid ${sessionMode === "simultaneous" ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.1)"}`,
            }}
          >
            Deploy All
          </button>
        </div>

        {mode === "rehearsal" && (
          <div className="flex gap-2">
            <a
              href={`/conference/${eventSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 rounded-lg text-xs font-bold text-center transition-all"
              style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}
            >
              Open Attendee View →
            </a>
            <button
              onClick={resetTestData}
              className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
              style={{ background: "rgba(107,114,128,0.1)", color: "#9CA3AF", border: "1px solid rgba(107,114,128,0.2)" }}
            >
              Reset Test Data
            </button>
          </div>
        )}
      </div>

      {/* Live run panel — only render after session is activated */}
      {sessionStarted && <PresenterRemote eventId={eventId} sessionId={session.id} autoShowResults={autoShowResults} onToggleAutoShow={onToggleAutoShow} sessionMode={sessionMode} />}
    </div>
  );
}

export default function SessionManagerWithPolls({ eventId, eventSlug, onSessionsChange }: Props) {
  const [pollCounts, setPollCounts] = useState<Record<string, number>>({});
  const [autoShowResults, setAutoShowResults] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/events/${eventId}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && typeof data.auto_show_results === "boolean") {
          setAutoShowResults(data.auto_show_results);
        }
      })
      .catch(() => {});
  }, [eventId]);

  const handleToggleAutoShow = async (value: boolean) => {
    setAutoShowResults(value);
    await fetch(`/api/admin/events/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auto_show_results: value }),
    });
  };

  const fetchPollCounts = useCallback(async () => {
    const res = await fetch(`/api/conference/polls?event_id=${eventId}`);
    if (!res.ok) return;
    const polls = await res.json();
    const counts: Record<string, number> = {};
    for (const p of polls) {
      if (p.session_id) counts[p.session_id] = (counts[p.session_id] || 0) + 1;
    }
    setPollCounts(counts);
  }, [eventId]);

  useEffect(() => { queueMicrotask(() => fetchPollCounts()); }, [fetchPollCounts]);

  return (
    <div>
      <SessionManager
        eventId={eventId}
        onSessionsChange={onSessionsChange}
        renderSessionExtra={(session) => (
          <div className="mt-2 space-y-0">
            <SessionPolls sessionId={session.id} eventId={eventId} pollCount={pollCounts[session.id] || 0} />
            <SessionFilesSection sessionId={session.id} eventId={eventId} />
            <SessionPresenter
              session={session}
              eventId={eventId}
              eventSlug={eventSlug}
              onEnd={() => { onSessionsChange?.(); fetchPollCounts(); }}
              autoShowResults={autoShowResults}
              onToggleAutoShow={handleToggleAutoShow}
            />
          </div>
        )}
      />
    </div>
  );
}
