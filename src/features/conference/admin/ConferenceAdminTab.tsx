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
  Users,
  ChevronRight,
} from "lucide-react";
import SeminarModeToggle from "./SeminarModeToggle";
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
  event_date: string;
  access_code: string | null;
}

type SubTab = "setup" | "polls" | "qa" | "wordcloud" | "announcements" | "settings";

const SUB_TABS: { id: SubTab; label: string; icon: React.ElementType; hint: string }[] = [
  { id: "setup", label: "Setup", icon: Radio, hint: "Sessions & go-live" },
  { id: "polls", label: "Polls", icon: BarChart3, hint: "Create & deploy polls" },
  { id: "qa", label: "Q&A", icon: MessageSquare, hint: "Moderate questions" },
  { id: "wordcloud", label: "Word Cloud", icon: Cloud, hint: "Audience word cloud" },
  { id: "announcements", label: "Announce", icon: Megaphone, hint: "Push messages" },
  { id: "settings", label: "Settings", icon: Shield, hint: "Filters & roles" },
];

export default function ConferenceAdminTab() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [eventsLoading, setEventsLoading] = useState(true);
  const [subTab, setSubTab] = useState<SubTab>("setup");

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        // Auto-select the first event if only one exists
        if (data.length === 1 && !selectedEventId) {
          setSelectedEventId(data[0].id);
        }
      }
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const eventId = selectedEventId || undefined;
  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="space-y-6">
      {/* Step 1: Pick your event — always visible */}
      <div className="glass rounded-2xl p-5 border border-[#2764FF]/20 bg-gradient-to-r from-[#2764FF]/5 to-transparent">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#2764FF]/10 flex items-center justify-center">
            <CalendarDays size={16} className="text-[#2764FF]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-klo-text">Which event are you managing?</h3>
            <p className="text-xs text-klo-muted">Everything below will be scoped to this event.</p>
          </div>
        </div>
        <div className="mt-3">
          {eventsLoading ? (
            <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
          ) : events.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-klo-muted py-2">
              <span>No events yet.</span>
              <span className="text-[#2764FF]">Go to the Events tab to create one first.</span>
            </div>
          ) : (
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-klo-dark border border-white/10 rounded-lg px-4 py-2.5 text-sm text-klo-text focus:outline-none focus:border-[#2764FF]/50"
            >
              <option value="">All Events (Global)</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.conference_name || ev.title}
                  {ev.event_date && ev.event_date !== "SAVE THE DATE"
                    ? ` — ${new Date(ev.event_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                    : ""}
                </option>
              ))}
            </select>
          )}
        </div>
        {selectedEvent && (
          <p className="mt-2 text-xs text-klo-muted">
            Polls, Q&A, sessions, and announcements below are for{" "}
            <span className="text-klo-text font-medium">{selectedEvent.conference_name || selectedEvent.title}</span>.
          </p>
        )}
      </div>

      {/* Sub-tab navigation — horizontal on desktop, scrollable on mobile */}
      <div className="flex gap-1 p-1 rounded-xl bg-klo-dark/50 border border-white/5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {SUB_TABS.map((tab) => {
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
        {subTab === "setup" && (
          <div className="space-y-6">
            {/* Seminar mode — the "go live" button */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-base font-semibold text-klo-text">Go Live</h2>
                <span className="text-xs text-klo-muted">— flip this on when the event starts</span>
              </div>
              <SeminarModeToggle eventId={eventId} />
            </div>

            {/* Sessions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-base font-semibold text-klo-text">Sessions</h2>
                <span className="text-xs text-klo-muted">— break your event into time blocks</span>
              </div>
              <SessionManager eventId={eventId} />
            </div>
          </div>
        )}

        {subTab === "polls" && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-semibold text-klo-text">Polls</h2>
              <span className="text-xs text-klo-muted">— create polls, deploy them live, see results</span>
            </div>
            <PollManager eventId={eventId} />
          </div>
        )}

        {subTab === "qa" && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-semibold text-klo-text">Q&A</h2>
              <span className="text-xs text-klo-muted">— see audience questions, approve or hide them</span>
            </div>
            <QuestionModerator eventId={eventId} />
          </div>
        )}

        {subTab === "wordcloud" && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-semibold text-klo-text">Word Cloud</h2>
              <span className="text-xs text-klo-muted">— audience submits words, see them visualized</span>
            </div>
            <WordCloudManager />
          </div>
        )}

        {subTab === "announcements" && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-semibold text-klo-text">Announcements</h2>
              <span className="text-xs text-klo-muted">— push a message to all attendees in real time</span>
            </div>
            <AnnouncementManager />
          </div>
        )}

        {subTab === "settings" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-base font-semibold text-klo-text">Profanity Filter</h2>
                <span className="text-xs text-klo-muted">— block inappropriate words from polls and Q&A</span>
              </div>
              <ProfanityManager />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-base font-semibold text-klo-text">Roles</h2>
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
