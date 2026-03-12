"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarDays,
  MapPin,
  Radio,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import Badge from "@/components/shared/Badge";
import SeminarModeGate from "@/features/conference/components/SeminarModeGate";
import ConferenceToolsTabs from "@/features/conference/components/ConferenceToolsTabs";
import { useSessions } from "@/features/conference/hooks/useSessions";
import type { ConferenceSession } from "@/features/conference/types";

interface EventData {
  id: string;
  title: string;
  slug: string;
  conference_name: string;
  conference_location: string;
  event_date: string;
  event_time: string | null;
  description: string | null;
  access_code: string | null;
  seminar_mode: boolean;
  start_date: string | null;
  end_date: string | null;
}

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

function formatDate(dateStr: string): string {
  if (dateStr === "SAVE THE DATE") return dateStr;
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateRange(startDate: string | null, endDate: string | null, eventDate: string): string {
  if (eventDate === "SAVE THE DATE") return "SAVE THE DATE";
  const start = startDate || eventDate;
  const end = endDate || eventDate;
  if (start === end) return formatDate(start);
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} – ${e.toLocaleDateString("en-US", { weekday: "long", day: "numeric", year: "numeric" })}`;
  }
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function LiveBadge() {
  return (
    <motion.span
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30"
      animate={{ opacity: [1, 0.7, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" as const }}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
      </span>
      <span className="text-emerald-400 text-xs font-semibold tracking-wide uppercase">
        In Session
      </span>
    </motion.span>
  );
}

export default function EventConferencePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedSession, setSelectedSession] = useState<ConferenceSession | null>(null);
  const { sessions, loading: sessionsLoading } = useSessions(
    event ? { eventId: event.id, activeOnly: true } : undefined
  );

  // Restore session from server if user was already in one
  useEffect(() => {
    if (!event?.id || selectedSession || sessionsLoading) return;
    fetch(`/api/conference/session-attendance?event_id=${encodeURIComponent(event.id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.session) {
          setSelectedSession(data.session as ConferenceSession);
        }
      })
      .catch(() => {});
  }, [event?.id, sessions, sessionsLoading, selectedSession]);

  // Handle session dropdown change
  const handleSessionChange = useCallback(async (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    // Leave current session if switching
    if (selectedSession) {
      fetch("/api/conference/session-attendance", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: selectedSession.id }),
      }).catch(() => {});
    }

    setSelectedSession(session);

    // Join new session (best-effort)
    try {
      const res = await fetch("/api/conference/session-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: session.id }),
      });
      if (res.status === 409) {
        // Auto-resolve conflict
        const data = await res.json();
        if (data.conflicting_session_id) {
          await fetch("/api/conference/session-attendance", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: data.conflicting_session_id }),
          });
          await fetch("/api/conference/session-attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: session.id }),
          });
        }
      }
    } catch {
      // Local selection still works
    }
  }, [sessions, selectedSession]);

  // Fetch event by slug
  useEffect(() => {
    fetch(`/api/conference/event-by-slug?slug=${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setEvent(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setEventLoading(false));
  }, [slug]);

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <h2 className="text-2xl font-bold text-klo-text mb-2">Event Not Found</h2>
        <p className="text-klo-muted text-sm">
          This event doesn&apos;t exist or has been removed.
        </p>
      </div>
    );
  }

  const hasSessions = sessions.length > 0;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-klo-gold/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#2764FF]/3 blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 max-w-4xl mx-auto text-center"
        >
          {event.seminar_mode && (
            <motion.div variants={fadeUp} custom={0} className="mb-6">
              <LiveBadge />
            </motion.div>
          )}

          <motion.div variants={fadeUp} custom={0.5}>
            <Badge variant="gold">Conference Companion</Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="font-display text-4xl md:text-6xl font-bold text-klo-text leading-tight"
          >
            {event.conference_name}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-6 text-lg md:text-xl text-klo-muted max-w-2xl mx-auto leading-relaxed"
          >
            {event.title}
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-klo-muted"
          >
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={16} className="text-[#2764FF]" />
              {formatDateRange(event.start_date, event.end_date, event.event_date)}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin size={16} className="text-[#2764FF]" />
              {event.conference_location}
            </span>
          </motion.div>

          {/* Session selector — always requires selection */}
          {hasSessions && !sessionsLoading && (
            <motion.div variants={fadeUp} custom={4} className="mt-8">
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-klo-dark/60 border border-white/10 backdrop-blur-sm">
                <Radio size={16} className="text-[#2764FF] shrink-0" />
                <label className="text-sm text-klo-muted shrink-0">Session:</label>
                <div className="relative">
                  <select
                    value={selectedSession?.id || ""}
                    onChange={(e) => handleSessionChange(e.target.value)}
                    className="appearance-none bg-transparent border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-sm text-klo-text font-medium focus:outline-none focus:border-[#2764FF]/50 cursor-pointer min-w-[200px]"
                  >
                    <option value="" disabled>Select a session…</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                        {s.time_label ? ` — ${s.time_label}` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-klo-muted pointer-events-none" />
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Interactive Tools */}
      <section className="px-6 py-16 md:py-24 bg-klo-dark/40">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="max-w-4xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#2764FF]/10 flex items-center justify-center">
                <Sparkles size={20} className="text-[#2764FF]" />
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-klo-text">
                Interactive Tools
              </h2>
            </div>
            <p className="text-klo-muted">
              Participate in live polls, ask questions, and contribute to the word cloud.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={1}>
            <SeminarModeGate eventId={event.id}>
              <ConferenceToolsTabs eventId={event.id} sessionId={selectedSession?.id} />
            </SeminarModeGate>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
