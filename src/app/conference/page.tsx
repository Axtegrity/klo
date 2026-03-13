"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  MapPin,
  CalendarDays,
  StickyNote,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import Card from "@/components/shared/Card";
import Badge from "@/components/shared/Badge";
import ConferenceToolsTabs from "@/features/conference/components/ConferenceToolsTabs";
import { useSessions } from "@/features/conference/hooks/useSessions";
import { useSeminarMode } from "@/features/conference/hooks/useSeminarMode";
import type { ConferenceSession } from "@/features/conference/types";

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                   */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface LiveEvent {
  id: string;
  title: string;
  slug: string;
  conference_name: string;
  conference_location: string;
  event_date: string;
  event_time: string | null;
  event_timezone: string | null;
  description: string | null;
  display_name_mode: string | null;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Page component                                                      */
/* ------------------------------------------------------------------ */

export default function ConferencePage() {
  const { data: authSession } = useSession();
  const isAuthenticated = !!(authSession?.user as { id?: string } | undefined)?.id;

  /* ---------- Seminar mode gate ---------- */
  const { seminarMode, loading: seminarLoading } = useSeminarMode();

  /* ---------- Live events for today ---------- */
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/live-events")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLiveEvents(data);
      })
      .catch(() => {})
      .finally(() => setEventsLoading(false));
  }, []);

  /* ---------- Selected event & session ---------- */
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Auto-select if only one event
  useEffect(() => {
    if (liveEvents.length === 1 && !selectedEventId) {
      setSelectedEventId(liveEvents[0].id);
    }
  }, [liveEvents, selectedEventId]);

  const selectedEvent = liveEvents.find((e) => e.id === selectedEventId) ?? null;

  /* ---------- Sessions for selected event ---------- */
  const { sessions, loading: sessionsLoading } = useSessions(
    selectedEventId ? { eventId: selectedEventId } : undefined
  );

  // Auto-select if only one session
  useEffect(() => {
    if (sessions.length === 1 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? null;

  /* ---------- Notes ---------- */
  const [notes, setNotes] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("klo-conference-notes") ?? "";
  });
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    if (notes === "") return;
    const timer = setTimeout(() => {
      localStorage.setItem("klo-conference-notes", notes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    }, 1000);
    return () => clearTimeout(timer);
  }, [notes]);

  /* ---------- Render: Loading ---------- */
  if (seminarLoading || eventsLoading) return null;

  /* ---------- Render: No active events ---------- */
  if (!seminarMode.active || liveEvents.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-klo-muted text-xl md:text-2xl text-center">
          Come Back Soon For Upcoming Events
        </p>
      </div>
    );
  }

  /* ---------- Render: Event Selection (multiple events) ---------- */
  if (!selectedEventId) {
    return (
      <div className="min-h-screen px-6 py-20">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-2xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="text-center mb-10">
            <Badge variant="gold" className="mb-4">Live Today</Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-klo-text tracking-tight">
              Select an Event
            </h1>
            <p className="mt-4 text-lg text-klo-muted">
              Multiple events are happening today. Choose one to join.
            </p>
          </motion.div>

          <div className="space-y-4">
            {liveEvents.map((ev, i) => (
              <motion.div key={ev.id} variants={fadeUp} custom={i + 1}>
                <button
                  onClick={() => { setSelectedEventId(ev.id); setSelectedSessionId(null); }}
                  className="w-full text-left"
                >
                  <Card hoverable className="relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-[#2764FF] rounded-l-xl" />
                    <div className="pl-4 space-y-2">
                      <h3 className="text-xl font-bold text-klo-text">
                        {ev.conference_name}
                      </h3>
                      {ev.conference_name !== ev.title && (
                        <p className="text-base text-klo-muted">{ev.title}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-klo-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={12} className="text-[#2764FF]" />
                          {formatDate(ev.event_date)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={12} className="text-[#2764FF]" />
                          {ev.conference_location}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[#2764FF] text-base font-medium pt-1">
                        Join <ChevronRight size={14} />
                      </div>
                    </div>
                  </Card>
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  /* ---------- Render: Session Selection ---------- */
  if (!selectedSessionId && selectedEvent) {
    return (
      <div className="min-h-screen px-6 py-20">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-2xl mx-auto"
        >
          {/* Back button (only if multiple events) */}
          {liveEvents.length > 1 && (
            <motion.div variants={fadeUp} custom={0} className="mb-6">
              <button
                onClick={() => { setSelectedEventId(null); setSelectedSessionId(null); }}
                className="inline-flex items-center gap-2 text-sm text-klo-muted hover:text-klo-text transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Events
              </button>
            </motion.div>
          )}

          <motion.div variants={fadeUp} custom={0} className="text-center mb-10">
            <Badge variant="gold" className="mb-4">Live Now</Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-klo-text tracking-tight">
              {selectedEvent.display_name_mode === "session"
                ? selectedEvent.title
                : selectedEvent.conference_name}
            </h1>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-5 text-base text-klo-muted">
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={16} className="text-[#2764FF]" />
                {formatDate(selectedEvent.event_date)}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin size={16} className="text-[#2764FF]" />
                {selectedEvent.conference_location}
              </span>
            </div>
            <p className="mt-6 text-lg text-klo-muted">Select a session to join.</p>
          </motion.div>

          <div className="space-y-3">
            {sessionsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <Card>
                <p className="text-klo-muted text-base text-center py-8">
                  No sessions available yet. Check back soon!
                </p>
              </Card>
            ) : (
              sessions.map((s, i) => (
                <motion.div key={s.id} variants={fadeUp} custom={i + 1}>
                  <SessionCard session={s} onSelect={() => setSelectedSessionId(s.id)} />
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  /* ---------- Render: Active Session (interactive tools) ---------- */
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="px-6 pt-16 pb-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedSessionId(null)}
            className="inline-flex items-center gap-2 text-sm text-klo-muted hover:text-klo-text transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            {sessions.length > 1 ? "Back to Sessions" : "Back"}
          </button>

          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeUp} custom={0} className="text-center">
              <Badge variant="gold" className="mb-4">Live Session</Badge>
              <h1 className="font-display text-4xl md:text-6xl font-bold text-klo-text tracking-tight">
                {selectedEvent?.display_name_mode === "session" && selectedSession
                  ? selectedSession.title
                  : selectedEvent?.conference_name}
              </h1>
              {selectedSession && (
                <p className="mt-4 text-xl md:text-2xl text-klo-muted">
                  {selectedEvent?.display_name_mode === "session"
                    ? selectedEvent?.conference_name
                    : selectedSession.title}
                </p>
              )}
              {selectedEvent && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-5 text-base text-klo-muted">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={16} className="text-[#2764FF]" />
                    {formatDate(selectedEvent.event_date)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin size={16} className="text-[#2764FF]" />
                    {selectedEvent.conference_location}
                  </span>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Tools */}
      <section className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <ConferenceToolsTabs
            eventId={selectedEventId ?? undefined}
            sessionId={selectedSessionId ?? undefined}
          />
        </div>
      </section>

      {/* Session Notes */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-[#2764FF]/10 flex items-center justify-center">
              <StickyNote size={24} className="text-[#2764FF]" />
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-klo-text">
              Session Notes
            </h2>
          </div>
          <Card>
            <div className="space-y-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Start typing your notes here... Your notes are automatically saved to your browser."
                rows={8}
                className="w-full bg-klo-navy/50 border border-klo-slate rounded-lg px-5 py-4 text-base text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:border-[#2764FF]/50 focus:ring-1 focus:ring-[#2764FF]/20 transition-colors resize-y leading-relaxed"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-klo-muted">
                  {notes.length > 0
                    ? `${notes.split(/\s+/).filter(Boolean).length} words`
                    : "No notes yet"}
                </span>
                <AnimatePresence>
                  {notesSaved && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-400"
                    >
                      <CheckCircle2 size={12} />
                      Saved
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Session card                                                        */
/* ------------------------------------------------------------------ */

function SessionCard({
  session,
  onSelect,
}: {
  session: ConferenceSession;
  onSelect: () => void;
}) {
  return (
    <button onClick={onSelect} className="w-full text-left">
      <Card
        hoverable
        className={`relative overflow-hidden ${
          session.is_active ? "border-emerald-500/30 shadow-lg shadow-emerald-500/5" : ""
        }`}
      >
        {session.is_active && (
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-400 rounded-l-xl" />
        )}
        <div className="flex items-center gap-4 pl-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-klo-text truncate">
                {session.title}
              </h3>
              {session.is_active && (
                <Badge variant="green" className="shrink-0">Live</Badge>
              )}
            </div>
            {session.description && (
              <p className="text-base text-klo-muted mt-1.5 line-clamp-2">
                {session.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-klo-muted mt-2.5">
              {session.time_label && (
                <span className="inline-flex items-center gap-1.5">
                  <Radio size={12} className={session.is_active ? "text-emerald-400" : "text-klo-muted"} />
                  {session.time_label}
                </span>
              )}
              {session.speaker && (
                <span>{session.speaker}</span>
              )}
              {session.room && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={12} />
                  {session.room}
                </span>
              )}
            </div>
          </div>
          <ChevronRight size={18} className="text-klo-muted shrink-0" />
        </div>
      </Card>
    </button>
  );
}
