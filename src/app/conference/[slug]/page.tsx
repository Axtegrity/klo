"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarDays,
  MapPin,
  Radio,
  Sparkles,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import Badge from "@/components/shared/Badge";
import SeminarModeGate from "@/features/conference/components/SeminarModeGate";
import ConferenceToolsTabs from "@/features/conference/components/ConferenceToolsTabs";
import GuestSignInCard from "@/features/conference/components/GuestSignInCard";
import SessionSelectCard from "@/features/conference/components/SessionSelectCard";
import { useGuestSession } from "@/features/conference/hooks/useGuestSession";
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

  const { guest, eventId, isGuest, loading: guestLoading, signIn, signOut } = useGuestSession();
  const [selectedSession, setSelectedSession] = useState<ConferenceSession | null>(null);
  const { sessions, loading: sessionsLoading } = useSessions(event ? { eventId: event.id } : undefined);

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

  if (eventLoading || guestLoading) {
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

  // If event requires access code and guest hasn't signed in for THIS event
  const needsSignIn = event.access_code && (!isGuest || guest?.event_id !== event.id);

  if (needsSignIn) {
    return (
      <div className="min-h-screen">
        <section className="relative overflow-hidden py-20 md:py-28 px-6">
          <div className="absolute inset-0 bg-gradient-to-b from-klo-gold/5 via-transparent to-transparent pointer-events-none" />
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="relative z-10 max-w-4xl mx-auto text-center"
          >
            <motion.div variants={fadeUp} custom={0} className="mb-6">
              <Badge variant="gold">Conference Companion</Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-display text-3xl md:text-5xl font-bold text-klo-text leading-tight mb-4"
            >
              {event.conference_name}
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-klo-muted mb-10">
              {event.title}
            </motion.p>
            <motion.div variants={fadeUp} custom={3}>
              <GuestSignInCard onSignIn={signIn} eventTitle={event.conference_name} />
            </motion.div>
          </motion.div>
        </section>
      </div>
    );
  }

  // If event has sessions and guest hasn't picked one yet, show session selector
  const hasSessions = sessions.length > 0;
  const needsSessionSelection = hasSessions && !selectedSession;

  if (needsSessionSelection) {
    return (
      <div className="min-h-screen">
        <section className="relative overflow-hidden py-20 md:py-28 px-6">
          <div className="absolute inset-0 bg-gradient-to-b from-klo-gold/5 via-transparent to-transparent pointer-events-none" />
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="relative z-10 max-w-4xl mx-auto text-center"
          >
            <motion.div variants={fadeUp} custom={0} className="mb-6">
              <Badge variant="gold">Conference Companion</Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-display text-3xl md:text-5xl font-bold text-klo-text leading-tight mb-4"
            >
              {event.conference_name}
            </motion.h1>
            {isGuest && guest && (
              <motion.p variants={fadeUp} custom={2} className="text-klo-muted mb-10">
                Welcome, <span className="text-klo-text font-medium">{guest.display_name}</span>
              </motion.p>
            )}
            <motion.div variants={fadeUp} custom={3}>
              <SessionSelectCard
                sessions={sessions}
                loading={sessionsLoading}
                onSelect={setSelectedSession}
                eventTitle={event.conference_name}
              />
            </motion.div>
          </motion.div>
        </section>
      </div>
    );
  }

  // Signed in or no access code required — show the event
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
              {formatDate(event.event_date)}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin size={16} className="text-[#2764FF]" />
              {event.conference_location}
            </span>
          </motion.div>

          {/* Session + guest info bar */}
          <motion.div variants={fadeUp} custom={4} className="mt-6 flex flex-col items-center gap-3">
            {selectedSession && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2764FF]/10 border border-[#2764FF]/20 text-sm">
                <Radio size={14} className="text-[#2764FF]" />
                <span className="text-klo-text font-medium">{selectedSession.title}</span>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="p-0.5 rounded text-klo-muted hover:text-klo-text transition-colors"
                  title="Change session"
                >
                  <ArrowLeft size={12} />
                </button>
              </div>
            )}
            {isGuest && guest && (
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm">
                <span className="text-klo-muted">
                  Welcome, <span className="text-klo-text font-medium">{guest.display_name}</span>
                </span>
                <button
                  onClick={signOut}
                  className="p-1 rounded-lg text-klo-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Sign out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </motion.div>
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
