"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarDays } from "lucide-react";
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

export default function ConferenceAdminTab() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [eventsLoading, setEventsLoading] = useState(true);

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

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const eventId = selectedEventId || undefined;

  return (
    <div className="space-y-8">
      {/* Event Selector */}
      <section>
        <div className="glass rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <CalendarDays size={18} className="text-[#2764FF]" />
            <h3 className="text-sm font-semibold text-klo-text">Event Scope</h3>
          </div>
          <p className="text-xs text-klo-muted mb-3">
            Select an event to scope sessions, polls, and Q&A. Leave blank for global (all events).
          </p>
          {eventsLoading ? (
            <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
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
                  {ev.access_code ? ` [${ev.access_code}]` : ""}
                </option>
              ))}
            </select>
          )}
        </div>
      </section>

      {/* Seminar Mode Toggle */}
      <section>
        <SeminarModeToggle eventId={eventId} />
      </section>

      {/* Session Management */}
      <section>
        <h2 className="text-lg font-semibold text-klo-text mb-4">Session Management</h2>
        <SessionManager eventId={eventId} />
      </section>

      {/* Announcements */}
      <section>
        <h2 className="text-lg font-semibold text-klo-text mb-4">Push Instructions / Announcements</h2>
        <AnnouncementManager />
      </section>

      {/* Poll Management */}
      <section>
        <h2 className="text-lg font-semibold text-klo-text mb-4">Poll Management</h2>
        <PollManager eventId={eventId} />
      </section>

      {/* Question Moderation */}
      <section>
        <h2 className="text-lg font-semibold text-klo-text mb-4">Question Moderation</h2>
        <QuestionModerator eventId={eventId} />
      </section>

      {/* Word Cloud */}
      <section>
        <h2 className="text-lg font-semibold text-klo-text mb-4">Word Cloud</h2>
        <WordCloudManager />
      </section>

      {/* Profanity Filter */}
      <section>
        <h2 className="text-lg font-semibold text-klo-text mb-4">Profanity Filter</h2>
        <ProfanityManager />
      </section>

      {/* Role Management */}
      <section>
        <h2 className="text-lg font-semibold text-klo-text mb-4">Role Management</h2>
        <RoleManager />
      </section>
    </div>
  );
}
