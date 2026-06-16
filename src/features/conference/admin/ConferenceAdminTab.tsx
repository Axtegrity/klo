"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  Radio,
  BarChart3,
  MessageSquare,
  Cloud,
  Megaphone,
  Shield,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  MapPin,
  Archive,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import PollManager from "./PollManager";
import PresenterRemote from "./PresenterRemote";
import QuestionModerator from "./QuestionModerator";
import WordCloudManager from "./WordCloudManager";
import SessionManager from "./SessionManager";
import RoleManager from "./RoleManager";
import ProfanityManager from "./ProfanityManager";
import AnnouncementManager from "./AnnouncementManager";
import SessionHistory from "./SessionHistory";

interface EventOption {
  id: string;
  title: string;
  conference_name: string;
  conference_location: string;
  event_date: string;
  start_date: string | null;
  end_date: string | null;
  seminar_mode: boolean;
  access_code: string | null;
}

type SubTab = "sessions" | "polls" | "qa" | "wordcloud" | "announcements" | "settings" | "history";

const EVENT_SUB_TABS: { id: SubTab; label: string; icon: React.ElementType }[] = [
  { id: "sessions", label: "Sessions", icon: Radio },
  { id: "polls", label: "Polls", icon: BarChart3 },
  { id: "qa", label: "Q&A", icon: MessageSquare },
  { id: "wordcloud", label: "Word Cloud", icon: Cloud },
  { id: "announcements", label: "Announce", icon: Megaphone },
  { id: "settings", label: "Settings", icon: Shield },
  { id: "history", label: "History", icon: Archive },
];

function formatEventDate(ev: EventOption): string {
  if (ev.event_date === "SAVE THE DATE") return "Save the Date";
  const start = ev.start_date || ev.event_date;
  const end = ev.end_date || ev.event_date;
  const fmt = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (start === end) return fmt(start);
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { day: "numeric", year: "numeric" })}`;
  }
  return `${fmt(start)} – ${fmt(end)}`;
}

type PollMode = "manage" | "present";
type SessionMode = "sequential" | "simultaneous";

interface ActiveSessionInfo {
  id: string;
  session_mode: SessionMode;
}

interface PollSummary {
  id: string;
  is_deployed: boolean;
  is_active: boolean;
  votes?: number[];
}

function PollsTab({ eventId, sessionCount = 0, onGoToSessions }: { eventId: string; sessionCount?: number; onGoToSessions: () => void }) {
  const [mode, setMode] = useState<PollMode>("manage");
  const [activeSession, setActiveSession] = useState<ActiveSessionInfo | null>(null);
  const [selectedMode, setSelectedMode] = useState<SessionMode>("sequential");
  const [polls, setPolls] = useState<PollSummary[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [modeUpdating, setModeUpdating] = useState(false);
  const [modeError, setModeError] = useState<string | null>(null);
  const [deployAllBusy, setDeployAllBusy] = useState(false);
  const [closeAllBusy, setCloseAllBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);

  const fetchActiveSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/conference/sessions?event_id=${eventId}&active_only=true`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const s = data[0];
        setActiveSession({ id: s.id, session_mode: s.session_mode ?? "sequential" });
        setSelectedMode(s.session_mode ?? "sequential");
      } else {
        setActiveSession(null);
      }
    } catch {
      // Non-fatal
    }
  }, [eventId]);

  const fetchPolls = useCallback(async () => {
    try {
      const res = await fetch(`/api/conference/polls?event_id=${eventId}`);
      if (!res.ok) return;
      const data: PollSummary[] = await res.json();
      setPolls(data);
    } catch {
      // Non-fatal
    }
  }, [eventId]);

  const fetchQuestionCount = useCallback(async () => {
    if (!activeSession) return;
    try {
      const res = await fetch(
        `/api/conference/questions?session_id=${activeSession.id}&admin=true`
      );
      if (!res.ok) return;
      const data = await res.json();
      setQuestionCount(Array.isArray(data) ? data.length : 0);
    } catch {
      // Non-fatal
    }
  }, [activeSession]);

  useEffect(() => {
    fetchActiveSession();
    fetchPolls();
  }, [fetchActiveSession, fetchPolls]);

  useEffect(() => {
    fetchQuestionCount();
  }, [fetchQuestionCount]);

  const anyDeployed = polls.some((p) => p.is_deployed);
  const totalVotes = polls.reduce((sum, p) => {
    if (!p.votes) return sum;
    return sum + p.votes.reduce((s, v) => s + v, 0);
  }, 0);
  const donePolls = polls.filter((p) => p.is_deployed && !p.is_active).length;
  const totalPolls = polls.length;

  const handleModeSelect = async (newMode: SessionMode) => {
    if (!activeSession) return;
    if (anyDeployed) return; // locked — server enforces too
    setSelectedMode(newMode);
    setModeUpdating(true);
    setModeError(null);
    try {
      const res = await fetch(`/api/conference/sessions/${activeSession.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_mode: newMode }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setModeError(body.error || "Failed to update mode");
        setSelectedMode(activeSession.session_mode); // revert
      } else {
        setActiveSession((prev) => prev ? { ...prev, session_mode: newMode } : prev);
      }
    } catch {
      setModeError("Failed to update mode");
      setSelectedMode(activeSession.session_mode);
    } finally {
      setModeUpdating(false);
    }
  };

  const handleDeployAll = async () => {
    if (!activeSession) return;
    const confirmed = window.confirm(
      `This will release all ${totalPolls} polls to attendees. Continue?`
    );
    if (!confirmed) return;
    setDeployAllBusy(true);
    setBulkError(null);
    setBulkSuccess(null);
    try {
      const res = await fetch(
        `/api/conference/sessions/${activeSession.id}/polls/deploy-all`,
        { method: "POST" }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBulkError(body.error || "Failed to deploy all polls");
      } else {
        setBulkSuccess(`Deployed ${body.deployed} polls`);
        await fetchPolls();
      }
    } catch {
      setBulkError("Failed to deploy all polls");
    } finally {
      setDeployAllBusy(false);
    }
  };

  const handleCloseAll = async () => {
    if (!activeSession) return;
    const confirmed = window.confirm("Close all active polls now?");
    if (!confirmed) return;
    setCloseAllBusy(true);
    setBulkError(null);
    setBulkSuccess(null);
    try {
      const res = await fetch(
        `/api/conference/sessions/${activeSession.id}/polls/close-all`,
        { method: "POST" }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBulkError(body.error || "Failed to close all polls");
      } else {
        setBulkSuccess(`Closed ${body.closed} polls`);
        await fetchPolls();
      }
    } catch {
      setBulkError("Failed to close all polls");
    } finally {
      setCloseAllBusy(false);
    }
  };

  const effectiveMode = activeSession?.session_mode ?? selectedMode;

  return (
    <div className="space-y-4">
      {/* Session status banner — shown when no active session */}
      {activeSession === null && (
        sessionCount > 0 ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-amber-500/5 border-amber-500/20">
            <AlertCircle size={16} className="text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-300">No active session</p>
              <p className="text-xs text-amber-400/70">Activate a session in the Sessions tab before deploying polls.</p>
            </div>
            <button
              onClick={onGoToSessions}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
            >
              Go to Sessions
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-[#2764FF]/5 border-[#2764FF]/20">
            <Radio size={16} className="text-[#2764FF] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-klo-text">No sessions yet</p>
              <p className="text-xs text-klo-muted">Create a session in the Sessions tab first, then come back to set up polls.</p>
            </div>
            <button
              onClick={onGoToSessions}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2764FF]/10 text-[#2764FF] border border-[#2764FF]/20 hover:bg-[#2764FF]/20 transition-colors"
            >
              Go to Sessions
            </button>
          </div>
        )
      )}
      {/* Manage / Present Live toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 rounded-xl bg-klo-dark/50 border border-white/5">
          <button
            onClick={() => setMode("manage")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "manage"
                ? "bg-klo-slate text-klo-text shadow"
                : "text-klo-muted hover:text-klo-text"
            }`}
          >
            Manage
          </button>
          <button
            onClick={() => setMode("present")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "present"
                ? "bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white shadow"
                : "text-klo-muted hover:text-klo-text"
            }`}
          >
            <span className="relative flex h-2 w-2">
              {mode === "present" && (
                <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  mode === "present" ? "bg-white" : "bg-klo-muted/40"
                }`}
              />
            </span>
            Present Live
          </button>
        </div>
        {mode === "manage" && (
          <span className="text-xs text-klo-muted">Build your poll deck, then go live</span>
        )}
        {mode === "present" && (
          <span className="text-xs text-emerald-400 font-medium">
            Running live — attendees see your polls
          </span>
        )}
      </div>

      {/* ── MANAGE MODE: session mode selector ── */}
      {mode === "manage" && activeSession && (
        <div className="space-y-3">
          {anyDeployed ? (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                  effectiveMode === "simultaneous"
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    : "bg-[#2764FF]/10 text-[#2764FF] border border-[#2764FF]/20"
                }`}
              >
                Mode locked:{" "}
                {effectiveMode === "simultaneous" ? "Deploy All" : "One at a Time"}
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-klo-muted font-medium uppercase tracking-wider">
                Poll delivery mode
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleModeSelect("sequential")}
                  disabled={modeUpdating}
                  className={`p-4 rounded-2xl border text-left transition-all disabled:opacity-60 ${
                    selectedMode === "sequential"
                      ? "border-[#2764FF] bg-[#2764FF]/10"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <p className="text-sm font-semibold text-klo-text mb-1">One at a Time</p>
                  <p className="text-xs text-klo-muted leading-snug">
                    Deploy polls one by one. Full control over pacing.
                  </p>
                </button>
                <button
                  onClick={() => handleModeSelect("simultaneous")}
                  disabled={modeUpdating}
                  className={`p-4 rounded-2xl border text-left transition-all disabled:opacity-60 ${
                    selectedMode === "simultaneous"
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <p className="text-sm font-semibold text-klo-text mb-1">Deploy All</p>
                  <p className="text-xs text-klo-muted leading-snug">
                    Release all polls at once. Attendees answer at their own pace.
                  </p>
                </button>
              </div>
              {modeError && (
                <p className="text-xs text-red-400">{modeError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── PRESENT MODE: host dashboard stats bar ── */}
      {mode === "present" && activeSession && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <div className="glass rounded-xl p-3 border border-white/5 text-center">
              <p className="text-lg font-black text-[#2764FF]">{totalVotes}</p>
              <p className="text-[10px] text-klo-muted">Total Votes</p>
            </div>
            <div className="glass rounded-xl p-3 border border-white/5 text-center">
              <p className="text-lg font-black text-klo-text">
                {donePolls}/{totalPolls}
              </p>
              <p className="text-[10px] text-klo-muted">Polls Done</p>
            </div>
            <div className="glass rounded-xl p-3 border border-white/5 text-center">
              <p className="text-lg font-black text-klo-text">{questionCount}</p>
              <p className="text-[10px] text-klo-muted">Questions</p>
            </div>
            <div className="glass rounded-xl p-3 border border-white/5 text-center">
              <p
                className={`text-[10px] font-bold mt-1 ${
                  effectiveMode === "simultaneous" ? "text-purple-400" : "text-[#2764FF]"
                }`}
              >
                {effectiveMode === "simultaneous" ? "SIMUL" : "SEQ"}
              </p>
              <p className="text-[10px] text-klo-muted">Mode</p>
            </div>
          </div>

          {/* Simultaneous mode bulk controls */}
          {effectiveMode === "simultaneous" && (
            <div className="space-y-2">
              {bulkError && (
                <p className="text-xs text-red-400 px-1">{bulkError}</p>
              )}
              {bulkSuccess && (
                <p className="text-xs text-emerald-400 px-1">{bulkSuccess}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleDeployAll}
                  disabled={deployAllBusy || closeAllBusy}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-all disabled:opacity-50"
                >
                  {deployAllBusy ? "Deploying..." : "Deploy All"}
                </button>
                <button
                  onClick={handleCloseAll}
                  disabled={deployAllBusy || closeAllBusy}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                >
                  {closeAllBusy ? "Closing..." : "Close All"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "manage" ? (
        <PollManager eventId={eventId} />
      ) : (
        <PresenterRemote eventId={eventId} sessionId={activeSession?.id} />
      )}
    </div>
  );
}

export default function ConferenceAdminTab({
  initialEventId,
  onEventIdConsumed,
}: {
  initialEventId?: string | null;
  onEventIdConsumed?: () => void;
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(searchParams.get("event") ?? null);
  const [subTab, setSubTab] = useState<SubTab>("sessions");
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [hasPollsCreated, setHasPollsCreated] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } finally {
      setEventsLoading(false);
    }
  }, []);

  // Fetch session counts for all events
  const fetchSessionCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/conference/sessions");
      if (res.ok) {
        const sessions = await res.json();
        const counts: Record<string, number> = {};
        for (const s of sessions) {
          const eid = s.event_id || "__standalone__";
          counts[eid] = (counts[eid] || 0) + 1;
        }
        setSessionCounts(counts);
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchSessionCounts();
  }, [fetchEvents, fetchSessionCounts]);

  // Fix 4: fetch active session + polls status for checklist when event changes
  useEffect(() => {
    if (!selectedEventId) {
      setHasActiveSession(false);
      setHasPollsCreated(false);
      return;
    }
    const stored = typeof window !== "undefined" && localStorage.getItem(`klo-checklist-${selectedEventId}`);
    setChecklistOpen(stored !== "collapsed");
    fetch(`/api/conference/sessions?event_id=${selectedEventId}&active_only=true`)
      .then((r) => r.json())
      .then((data) => setHasActiveSession(Array.isArray(data) && data.length > 0))
      .catch(() => {});
    fetch(`/api/conference/polls?event_id=${selectedEventId}`)
      .then((r) => r.json())
      .then((data) => setHasPollsCreated(Array.isArray(data) && data.length > 0))
      .catch(() => {});
  }, [selectedEventId]);

  useEffect(() => {
    if (initialEventId) {
      setSelectedEventId(initialEventId);
      onEventIdConsumed?.();
    }
  }, [initialEventId, onEventIdConsumed]);

  // Keep URL in sync when selectedEventId changes
  useEffect(() => {
    if (selectedEventId) {
      router.replace(`/admin?tab=conference&event=${selectedEventId}`, { scroll: false });
    } else {
      router.replace(`/admin?tab=conference`, { scroll: false });
    }
  }, [selectedEventId, router]);

  const toggleEventLive = async (ev: EventOption) => {
    const newMode = !ev.seminar_mode;
    // Optimistic update
    setEvents((prev) => prev.map((e) => (e.id === ev.id ? { ...e, seminar_mode: newMode } : e)));
    await fetch(`/api/admin/events/${ev.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seminar_mode: newMode }),
    });
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  // ── Event Detail View ──────────────────────────────────────────
  if (selectedEventId && selectedEvent) {
    return (
      <div className="space-y-5">
        {/* Header with back button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedEventId(null); setSubTab("sessions"); fetchSessionCounts(); }}
            className="p-2 rounded-lg text-klo-muted hover:text-klo-text hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-klo-text truncate">
              {selectedEvent.conference_name || selectedEvent.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-klo-muted">
              <span className="flex items-center gap-1">
                <CalendarDays size={12} />
                {formatEventDate(selectedEvent)}
              </span>
              {selectedEvent.conference_location && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {selectedEvent.conference_location}
                </span>
              )}
            </div>
          </div>
          {/* Event ON/OFF toggle */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${selectedEvent.seminar_mode ? "text-emerald-400" : "text-klo-muted"}`}>
              {selectedEvent.seminar_mode ? "LIVE" : "OFF"}
            </span>
            <button
              onClick={() => toggleEventLive(selectedEvent)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                selectedEvent.seminar_mode ? "bg-emerald-500" : "bg-klo-slate"
              }`}
              role="switch"
              aria-checked={selectedEvent.seminar_mode}
              aria-label="Event Live"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  selectedEvent.seminar_mode ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Fix 4: Setup checklist */}
        {(() => {
          const sessionCount = sessionCounts[selectedEventId] ?? 0;
          const steps = [
            { label: "Event created", done: true, tab: null as SubTab | null },
            { label: "Session created", done: sessionCount > 0, tab: "sessions" as SubTab },
            { label: "Session activated", done: hasActiveSession, tab: "sessions" as SubTab },
            { label: "Polls created", done: hasPollsCreated, tab: "polls" as SubTab },
            { label: "Ready to go live", done: hasActiveSession && hasPollsCreated, tab: null as SubTab | null },
          ];
          const completedCount = steps.filter((s) => s.done).length;
          const allDone = completedCount === steps.length;
          const isOpen = checklistOpen || !allDone;
          const toggle = () => {
            const next = !isOpen;
            setChecklistOpen(next);
            if (typeof window !== "undefined") {
              localStorage.setItem(`klo-checklist-${selectedEventId}`, next ? "open" : "collapsed");
            }
          };
          return (
            <div className="glass rounded-xl border border-white/5 overflow-hidden">
              <button
                onClick={toggle}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex-1 flex items-center gap-3 min-w-0">
                  <span className="text-xs font-semibold text-klo-text">Event Setup</span>
                  <div className="flex-1 max-w-[120px] h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#C8A84E] transition-all duration-300"
                      style={{ width: `${(completedCount / steps.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-klo-muted shrink-0">{completedCount}/{steps.length}</span>
                  {allDone && <span className="text-xs font-medium text-emerald-400 shrink-0">Ready to go live</span>}
                </div>
                <ChevronDown
                  size={14}
                  className={`text-klo-muted shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="border-t border-white/5 px-4 py-3 flex flex-wrap gap-x-6 gap-y-2">
                  {steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {step.done ? (
                        <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                      ) : (
                        <div className="w-[13px] h-[13px] rounded-full border border-white/20 shrink-0" />
                      )}
                      {!step.done && step.tab ? (
                        <button
                          onClick={() => setSubTab(step.tab!)}
                          className="text-xs text-[#2764FF] hover:underline underline-offset-2"
                        >
                          {step.label}
                        </button>
                      ) : (
                        <span className={`text-xs ${step.done ? "text-klo-muted" : "text-klo-text"}`}>{step.label}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Sub-tab navigation */}
        <div className="flex gap-1 p-1 rounded-xl bg-klo-dark/50 border border-white/5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {EVENT_SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                  active
                    ? "bg-klo-slate text-klo-text shadow-md"
                    : "text-klo-muted hover:text-klo-text"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sub-tab content */}
        <div>
          {subTab === "sessions" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-klo-text">Sessions</h3>
                  <p className="text-xs text-klo-muted">Add sessions to this event — each one gets its own polls, Q&A, and toggle.</p>
                </div>
              </div>
              <SessionManager eventId={selectedEventId} />
            </div>
          )}

          {subTab === "polls" && (
            <PollsTab
              eventId={selectedEventId}
              sessionCount={sessionCounts[selectedEventId] ?? 0}
              onGoToSessions={() => setSubTab("sessions")}
            />
          )}

          {subTab === "qa" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-base font-semibold text-klo-text">Q&A</h3>
                <span className="text-xs text-klo-muted">— see audience questions, approve or hide them</span>
              </div>
              <QuestionModerator eventId={selectedEventId} />
            </div>
          )}

          {subTab === "wordcloud" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-base font-semibold text-klo-text">Word Cloud</h3>
                <span className="text-xs text-klo-muted">— audience submits words, see them visualized</span>
              </div>
              <WordCloudManager eventId={selectedEventId} />
            </div>
          )}

          {subTab === "announcements" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-base font-semibold text-klo-text">Announcements</h3>
                <span className="text-xs text-klo-muted">— push a message to all attendees in real time</span>
              </div>
              <AnnouncementManager eventId={selectedEventId} />
            </div>
          )}

          {subTab === "settings" && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-base font-semibold text-klo-text">Profanity Filter</h3>
                  <span className="text-xs text-klo-muted">— block inappropriate words</span>
                </div>
                <ProfanityManager />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-base font-semibold text-klo-text">Roles</h3>
                  <span className="text-xs text-klo-muted">— assign moderators and presenters</span>
                </div>
                <RoleManager />
              </div>
            </div>
          )}

          {subTab === "history" && (
            <SessionHistory eventId={selectedEventId} />
          )}
        </div>
      </div>
    );
  }

  // Count how many events are currently live
  const liveEvents = events.filter((e) => e.seminar_mode);

  // ── Event List View (default) ──────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Persistent Engagement Status Indicator */}
      <div className={`rounded-xl px-4 py-3 border flex items-center justify-between ${
        liveEvents.length > 0
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-white/[0.02] border-white/5"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${liveEvents.length > 0 ? "bg-emerald-400 animate-pulse" : "bg-klo-muted/30"}`} />
          <span className={`text-sm font-medium ${liveEvents.length > 0 ? "text-emerald-400" : "text-klo-muted"}`}>
            {liveEvents.length > 0
              ? `Engagement ON — ${liveEvents.length} session${liveEvents.length > 1 ? "s" : ""} live`
              : "Engagement OFF — no sessions active"}
          </span>
        </div>
        {liveEvents.length > 0 && (
          <span className="text-xs text-emerald-400/70">
            {liveEvents.map((e) => e.conference_name || e.title).join(", ")}
          </span>
        )}
      </div>

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-klo-text">Your Events</h2>
        <p className="text-xs text-klo-muted">Tap an event to manage its sessions, polls, Q&A, and more.</p>
      </div>

      {/* Event cards */}
      {eventsLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="glass rounded-2xl p-8 border border-white/5 text-center">
          <CalendarDays size={32} className="text-klo-muted mx-auto mb-3" />
          <p className="text-sm text-klo-muted mb-1">No events yet.</p>
          <p className="text-xs text-klo-muted">Go to the <Link href="/admin?tab=events" className="text-[#2764FF] font-medium underline-offset-2 hover:underline">Events tab</Link> to create one first.</p>
        </div>
      ) : (() => {
        // Fix 3: group events by upcoming/active vs past
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const isEvPast = (ev: EventOption) => {
          if (ev.seminar_mode) return false;
          if (!ev.event_date || ev.event_date === "SAVE THE DATE") return false;
          const endStr = ev.end_date || ev.event_date;
          return new Date(endStr + "T23:59:59") < now;
        };
        const upcomingEvs = events.filter((ev) => !isEvPast(ev));
        const pastEvs = events.filter((ev) => isEvPast(ev));

        const renderCard = (ev: EventOption) => {
          const count = sessionCounts[ev.id] || 0;
          return (
            <div
              key={ev.id}
              className={`glass rounded-2xl border transition-all ${
                ev.seminar_mode ? "border-emerald-500/30" : "border-white/5"
              }`}
            >
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleEventLive(ev); }}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${
                    ev.seminar_mode ? "bg-emerald-500" : "bg-klo-slate"
                  }`}
                  title={ev.seminar_mode ? "Turn OFF — hide from attendees" : "Turn ON — make visible to attendees"}
                  role="switch"
                  aria-checked={ev.seminar_mode}
                  aria-label={`${ev.conference_name || ev.title} live toggle`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                      ev.seminar_mode ? "translate-x-5" : ""
                    }`}
                  />
                </button>
                <button
                  onClick={() => setSelectedEventId(ev.id)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-klo-text truncate">
                      {ev.conference_name || ev.title}
                    </p>
                    {ev.seminar_mode && (
                      <span className="shrink-0 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-klo-muted">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={11} />
                      {formatEventDate(ev)}
                    </span>
                    {ev.conference_location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin size={11} />
                        {ev.conference_location}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setSelectedEventId(ev.id)}
                  className="flex items-center gap-2 shrink-0 text-klo-muted hover:text-klo-text transition-colors"
                >
                  {count > 0 && (
                    <span className="text-xs font-medium bg-[#2764FF]/10 text-[#2764FF] px-2 py-0.5 rounded-full">
                      {count} session{count !== 1 ? "s" : ""}
                    </span>
                  )}
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          );
        };

        return (
          <div className="space-y-6">
            {upcomingEvs.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-klo-muted mb-3">Upcoming &amp; Active</p>
                <div className="space-y-3">{upcomingEvs.map(renderCard)}</div>
              </div>
            )}
            {pastEvs.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-klo-muted mb-3">Past</p>
                <div className="space-y-3">{pastEvs.map(renderCard)}</div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Standalone Sessions section */}
      <div className="pt-4 border-t border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-[#2764FF]/10 flex items-center justify-center">
            <Radio size={14} className="text-[#2764FF]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-klo-text">Standalone Sessions</h3>
            <p className="text-xs text-klo-muted">Not tied to any event — for one-off presentations or testing.</p>
          </div>
        </div>
        <SessionManager />
      </div>
    </div>
  );
}
