"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  Radio,
  BarChart3,
  MessageSquare,
  Cloud,
  Megaphone,
  Shield,
  ChevronRight,
  ArrowLeft,
  MapPin,
} from "lucide-react";
import PollManager from "./PollManager";
import QuestionModerator from "./QuestionModerator";
import WordCloudManager from "./WordCloudManager";
import SessionManager from "./SessionManager";
import RoleManager from "./RoleManager";
import ProfanityManager from "./ProfanityManager";
import AnnouncementManager from "./AnnouncementManager";

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

type SubTab = "sessions" | "polls" | "qa" | "wordcloud" | "announcements" | "settings";

const EVENT_SUB_TABS: { id: SubTab; label: string; icon: React.ElementType }[] = [
  { id: "sessions", label: "Sessions", icon: Radio },
  { id: "polls", label: "Polls", icon: BarChart3 },
  { id: "qa", label: "Q&A", icon: MessageSquare },
  { id: "wordcloud", label: "Word Cloud", icon: Cloud },
  { id: "announcements", label: "Announce", icon: Megaphone },
  { id: "settings", label: "Settings", icon: Shield },
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

export default function ConferenceAdminTab() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<SubTab>("sessions");
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});

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
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-base font-semibold text-klo-text">Polls</h3>
                <span className="text-xs text-klo-muted">— create polls, deploy them live, see results</span>
              </div>
              <PollManager eventId={selectedEventId} />
            </div>
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
          <p className="text-xs text-klo-muted">Go to the <span className="text-[#2764FF] font-medium">Events tab</span> to create one first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const count = sessionCounts[ev.id] || 0;
            return (
              <div
                key={ev.id}
                className={`glass rounded-2xl border transition-all ${
                  ev.seminar_mode ? "border-emerald-500/30" : "border-white/5"
                }`}
              >
                <div className="flex items-center gap-3 p-4">
                  {/* Event ON/OFF toggle */}
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

                  {/* Event info — clickable to drill in */}
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

                  {/* Session count + arrow */}
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
          })}
        </div>
      )}

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
