"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Radio,
  Clock,
  MapPin,
  CalendarDays,
  StickyNote,
  Lightbulb,
  Bot,
  FileDown,
  ChevronRight,
  User,
  CheckCircle2,
  Sparkles,
  Lock,
  Download,
} from "lucide-react";
import Card from "@/components/shared/Card";
import Badge from "@/components/shared/Badge";
import SeminarModeGate from "@/features/conference/components/SeminarModeGate";
import ConferenceToolsTabs from "@/features/conference/components/ConferenceToolsTabs";
import { useSessions } from "@/features/conference/hooks/useSessions";
import { useSeminarMode } from "@/features/conference/hooks/useSeminarMode";

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
/*  Data types                                                          */
/* ------------------------------------------------------------------ */

interface Takeaway {
  icon: typeof Lightbulb;
  title: string;
  detail: string;
}

interface PresentationFile {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: string;
}

interface ConferencePresentation {
  id: string;
  title: string;
  description: string | null;
  category: string;
  conference_presentation_files: PresentationFile[];
}

/* ------------------------------------------------------------------ */
/*  Sample data                                                         */
/* ------------------------------------------------------------------ */

const keyTakeaways: Takeaway[] = [
  {
    icon: Lightbulb,
    title: "AI Augments, Not Replaces",
    detail:
      "The most effective leaders use AI to enhance human judgment, not substitute it. Focus on augmentation over automation.",
  },
  {
    icon: CheckCircle2,
    title: "Governance First",
    detail:
      "Implement AI governance frameworks before scaling adoption. Ethical guardrails build trust and sustainable growth.",
  },
  {
    icon: Sparkles,
    title: "Start with Quick Wins",
    detail:
      "Identify 2-3 high-impact, low-risk AI use cases to build organizational confidence and demonstrate ROI.",
  },
  {
    icon: User,
    title: "People-Centered Transformation",
    detail:
      "Technology adoption succeeds when you invest in people first. Training, culture, and buy-in are non-negotiable.",
  },
];

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: "bg-red-500/20 text-red-400",
  doc: "bg-blue-500/20 text-blue-400",
  docx: "bg-blue-500/20 text-blue-400",
  ppt: "bg-orange-500/20 text-orange-400",
  pptx: "bg-orange-500/20 text-orange-400",
  xls: "bg-green-500/20 text-green-400",
  xlsx: "bg-green-500/20 text-green-400",
  txt: "bg-zinc-500/20 text-zinc-400",
};

/* ------------------------------------------------------------------ */
/*  Live badge component                                                */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Page component                                                      */
/* ------------------------------------------------------------------ */

interface FeaturedEvent {
  id: string;
  title: string;
  conference_name: string;
  conference_location: string;
  event_date: string;
  event_time: string | null;
  description: string | null;
}

const fallbackEvent: FeaturedEvent = {
  id: "fallback",
  title: "New Life Leadership Conference — AI and the Future of Ministry",
  conference_name: "New Life Leadership Conference",
  conference_location: "Montgomery, AL",
  event_date: "2026-03-07",
  event_time: null,
  description: null,
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function ConferencePage() {
  /* ---------- Auth ---------- */
  const { data: session } = useSession();
  const isAuthenticated = !!(session?.user as { id?: string } | undefined)?.id;

  /* ---------- Seminar mode gate (entire page) ---------- */
  const { seminarMode, loading: seminarLoading } = useSeminarMode();

  /* ---------- Sessions from DB ---------- */
  const { sessions, loading: sessionsLoading } = useSessions();

  /* ---------- Presentations ---------- */
  const [presentations, setPresentations] = useState<ConferencePresentation[]>([]);

  useEffect(() => {
    fetch("/api/conference/presentations")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setPresentations(data); })
      .catch(() => {});
  }, []);

  /* ---------- Live event ---------- */
  const [event, setEvent] = useState<FeaturedEvent>(fallbackEvent);

  useEffect(() => {
    fetch("/api/live-events")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setEvent(data[0]);
      })
      .catch(() => {});
  }, []);

  /* ---------- Notes state with localStorage ---------- */
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

  /* ---------- Render ---------- */

  // Engagement page: completely blank when seminar mode is OFF — no containers, no placeholder
  if (seminarLoading) return null;
  if (!seminarMode.active) return <div className="min-h-screen" />;

  return (
    <div className="min-h-screen">
      {/* ====== Conference Hero ====== */}
      <section className="relative overflow-hidden py-20 md:py-28 px-6">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-klo-gold/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#2764FF]/3 blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 max-w-4xl mx-auto text-center"
        >
          <motion.div variants={fadeUp} custom={0} className="mb-6">
            <LiveBadge />
          </motion.div>

          <motion.div variants={fadeUp} custom={0.5}>
            <Badge variant="gold" className="mb-4">
              Conference Companion
            </Badge>
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

          {/* Event details */}
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
        </motion.div>
      </section>

      {/* ====== Interactive Conference Tools ====== */}
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
              Participate in live polls, ask questions, and contribute to the word
              cloud.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={1}>
            <SeminarModeGate>
              <ConferenceToolsTabs />
            </SeminarModeGate>
          </motion.div>
        </motion.div>
      </section>

      {/* ====== Session Schedule ====== */}
      <section className="px-6 py-16 md:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="max-w-4xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#2764FF]/10 flex items-center justify-center">
                <Clock size={20} className="text-[#2764FF]" />
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-klo-text">
                Session Schedule
              </h2>
            </div>
            <p className="text-klo-muted">
              Today&apos;s lineup of sessions, workshops, and keynotes.
            </p>
          </motion.div>

          <div className="space-y-4">
            {sessionsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <Card>
                <p className="text-klo-muted text-sm text-center py-4">
                  No sessions scheduled yet. Check back soon!
                </p>
              </Card>
            ) : (
              sessions.map((session, i) => (
                <motion.div key={session.id} variants={fadeUp} custom={i + 1}>
                  <Card
                    className={`relative overflow-hidden ${
                      session.is_active
                        ? "border-[#2764FF]/40 shadow-lg shadow-[#2764FF]/5"
                        : ""
                    }`}
                  >
                    {session.is_active && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-klo-gold rounded-l-xl" />
                    )}
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {session.time_label && (
                        <div className="shrink-0 md:w-44">
                          <div className="flex items-center gap-2">
                            {session.is_active && (
                              <Radio size={14} className="text-[#2764FF]" />
                            )}
                            <span
                              className={`text-sm font-semibold ${
                                session.is_active
                                  ? "text-klo-gold"
                                  : "text-klo-muted"
                              }`}
                            >
                              {session.time_label}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-lg font-semibold text-klo-text">
                            {session.title}
                          </h3>
                          {session.is_active && (
                            <Badge variant="green" className="shrink-0">
                              Now
                            </Badge>
                          )}
                        </div>
                        {session.description && (
                          <p className="text-klo-muted text-sm leading-relaxed">
                            {session.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-klo-muted pt-1">
                          {session.speaker && (
                            <span className="inline-flex items-center gap-1.5">
                              <User size={12} className="text-[#2764FF]/70" />
                              {session.speaker}
                            </span>
                          )}
                          {session.room && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin size={12} className="text-[#2764FF]/70" />
                              {session.room}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </section>

      {/* ====== Session Notes ====== */}
      <section className="px-6 py-16 md:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="max-w-4xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#2764FF]/10 flex items-center justify-center">
                <StickyNote size={20} className="text-[#2764FF]" />
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-klo-text">
                Session Notes
              </h2>
            </div>
            <p className="text-klo-muted">
              Capture your thoughts and insights during the session. Notes
              auto-save to your browser.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={1}>
            <Card>
              <div className="space-y-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Start typing your notes here... Your notes are automatically saved to your browser."
                  rows={10}
                  className="w-full bg-klo-navy/50 border border-klo-slate rounded-lg px-4 py-3 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:border-[#2764FF]/50 focus:ring-1 focus:ring-[#2764FF]/20 transition-colors resize-y leading-relaxed"
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
          </motion.div>
        </motion.div>
      </section>

      {/* ====== Key Takeaways ====== */}
      <section className="px-6 py-16 md:py-24 bg-klo-dark/40">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="max-w-4xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#2764FF]/10 flex items-center justify-center">
                <Lightbulb size={20} className="text-[#2764FF]" />
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-klo-text">
                Key Takeaways
              </h2>
            </div>
            <p className="text-klo-muted">
              Core insights from the opening keynote session.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keyTakeaways.map((takeaway, i) => {
              const Icon = takeaway.icon;
              return (
                <motion.div
                  key={takeaway.title}
                  variants={fadeUp}
                  custom={i + 1}
                >
                  <Card hoverable className="h-full">
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-lg bg-[#2764FF]/10 flex items-center justify-center">
                        <Icon size={18} className="text-[#2764FF]" />
                      </div>
                      <h3 className="text-base font-semibold text-klo-text">
                        {takeaway.title}
                      </h3>
                      <p className="text-sm text-klo-muted leading-relaxed">
                        {takeaway.detail}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ====== Ask Keith AI ====== */}
      <section className="px-6 py-16 md:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="max-w-4xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0}>
            <Card className="relative overflow-hidden">
              {/* Accent glow */}
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#2764FF]/5 blur-[80px] rounded-full pointer-events-none" />

              <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
                <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2764FF]/20 to-[#2764FF]/5 border border-[#2764FF]/20 flex items-center justify-center">
                  <Bot size={28} className="text-[#2764FF]" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-display text-2xl font-bold text-klo-text mb-2">
                    Ask Keith AI
                  </h3>
                  <p className="text-klo-muted text-sm leading-relaxed mb-4">
                    Have deeper questions about today&apos;s topics? The AI
                    Advisor is pre-loaded with conference context on AI
                    leadership, digital governance, and faith-driven innovation.
                    Get personalized answers instantly.
                  </p>
                  <Link
                    href="/advisor"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-semibold text-sm rounded-lg hover:brightness-110 transition-colors"
                  >
                    <Bot size={16} />
                    Launch KLO Intelligence
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* ====== Conference Presentations ====== */}
      <section className="px-6 py-16 md:py-24 bg-klo-dark/40">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="max-w-4xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#2764FF]/10 flex items-center justify-center">
                <FileDown size={20} className="text-[#2764FF]" />
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-klo-text">
                Conference Presentations
              </h2>
            </div>
            <p className="text-klo-muted">
              Session materials, slides, and handouts from the seminar.
              {!isAuthenticated && " Sign in to download files."}
            </p>
          </motion.div>

          {presentations.length === 0 ? (
            <motion.div variants={fadeUp} custom={1}>
              <Card>
                <p className="text-klo-muted text-sm text-center py-4">
                  Presentation materials will be available here during the conference.
                </p>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {presentations.map((pres, i) => (
                <motion.div key={pres.id} variants={fadeUp} custom={i + 1}>
                  <Card>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-semibold text-klo-text">
                            {pres.title}
                          </h3>
                          {pres.description && (
                            <p className="text-sm text-klo-muted mt-1 leading-relaxed">
                              {pres.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="muted">{pres.category}</Badge>
                      </div>

                      {pres.conference_presentation_files.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-klo-slate/50">
                          {pres.conference_presentation_files.map((f) => (
                            <div key={f.id} className="flex items-center gap-3">
                              <span className={`text-xs font-mono px-2 py-0.5 rounded ${FILE_TYPE_COLORS[f.file_type] || "bg-zinc-500/20 text-zinc-400"}`}>
                                {f.file_type.toUpperCase()}
                              </span>
                              <span className="flex-1 text-sm text-klo-text truncate">
                                {f.file_name}
                              </span>
                              <span className="text-xs text-klo-muted shrink-0">{f.file_size}</span>
                              {isAuthenticated ? (
                                <div className="flex items-center gap-2">
                                  <a
                                    href={f.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2764FF]/10 text-[#2764FF] text-xs font-medium rounded-lg hover:bg-[#2764FF]/20 transition"
                                  >
                                    <FileDown size={12} />
                                    Open
                                  </a>
                                  <a
                                    href={f.file_url}
                                    download
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-klo-muted text-xs font-medium rounded-lg hover:bg-white/10 hover:text-klo-text transition"
                                  >
                                    <Download size={12} />
                                    Download
                                  </a>
                                </div>
                              ) : (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-klo-slate/30 text-klo-muted text-xs rounded-lg">
                                  <Lock size={12} />
                                  Sign in
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {!isAuthenticated && pres.conference_presentation_files.length > 0 && (
                        <div className="pt-2">
                          <Link
                            href="/auth/signin"
                            className="inline-flex items-center gap-2 text-xs text-[#2764FF] hover:underline"
                          >
                            <Lock size={12} />
                            Create an account or sign in to download materials
                          </Link>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* ====== Bottom CTA ====== */}
      <section className="px-6 py-16 md:py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={fadeUp}
          custom={0}
          className="max-w-2xl mx-auto text-center"
        >
          <p className="text-klo-muted text-sm mb-2">
            Thank you for attending
          </p>
          <h3 className="font-display text-2xl md:text-3xl font-bold text-klo-text mb-4">
            KLO Leadership &amp; Innovation Summit
          </h3>
          <p className="text-klo-muted text-sm leading-relaxed mb-6">
            Continue your journey with Keith&apos;s resources, assessments, and
            AI-powered tools on the KLO platform.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
            <Link
              href="/assessments"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-semibold text-sm rounded-lg hover:brightness-110 transition-colors"
            >
              Take an Assessment
            </Link>
            <Link
              href="/vault"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-klo-slate text-klo-text font-semibold text-sm rounded-lg hover:border-[#2764FF]/30 hover:text-[#2764FF] transition-colors"
            >
              Explore the Vault
            </Link>
            <Link
              href="/consult"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-klo-slate text-klo-text font-semibold text-sm rounded-lg hover:border-[#2764FF]/30 hover:text-[#2764FF] transition-colors"
            >
              Book A Consultation
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
