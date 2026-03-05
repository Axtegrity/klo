"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Radio,
  Clock,
  MapPin,
  CalendarDays,
  MessageSquare,
  Send,
  StickyNote,
  Lightbulb,
  Bot,
  FileDown,
  ChevronRight,
  User,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import Card from "@/components/shared/Card";
import Badge from "@/components/shared/Badge";
import SeminarModeGate from "@/features/conference/components/SeminarModeGate";
import ConferenceToolsTabs from "@/features/conference/components/ConferenceToolsTabs";
import { useSessions } from "@/features/conference/hooks/useSessions";

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

interface QueuedQuestion {
  id: string;
  text: string;
  timestamp: Date;
  upvotes: number;
}

interface Takeaway {
  icon: typeof Lightbulb;
  title: string;
  detail: string;
}

interface Resource {
  title: string;
  description: string;
  type: string;
  size: string;
  href: string;
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

const resources: Resource[] = [
  {
    title: "Keynote Slides: AI & Leadership",
    description: "Full slide deck from the opening keynote session",
    type: "PDF",
    size: "4.2 MB",
    href: "#",
  },
  {
    title: "AI Strategy Workshop Handout",
    description: "Step-by-step worksheet for building your AI roadmap",
    type: "PDF",
    size: "1.8 MB",
    href: "#",
  },
  {
    title: "Digital Governance Checklist",
    description: "Comprehensive governance framework assessment tool",
    type: "PDF",
    size: "920 KB",
    href: "#",
  },
  {
    title: "TechChurch Blueprint Guide",
    description: "Complete guide to integrating technology in faith organizations",
    type: "PDF",
    size: "3.1 MB",
    href: "#",
  },
];

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

export default function ConferencePage() {
  /* ---------- Sessions from DB ---------- */
  const { sessions, loading: sessionsLoading } = useSessions();

  /* ---------- Q&A state ---------- */
  const [questions, setQuestions] = useState<QueuedQuestion[]>([
    {
      id: "seed-1",
      text: "How do you recommend small organizations begin their AI journey with limited budgets?",
      timestamp: new Date(),
      upvotes: 12,
    },
    {
      id: "seed-2",
      text: "What are the biggest governance pitfalls you've seen in enterprise AI adoption?",
      timestamp: new Date(),
      upvotes: 8,
    },
  ]);
  const [questionInput, setQuestionInput] = useState("");

  const submitQuestion = useCallback(() => {
    const trimmed = questionInput.trim();
    if (!trimmed) return;
    setQuestions((prev) => [
      {
        id: Date.now().toString(),
        text: trimmed,
        timestamp: new Date(),
        upvotes: 0,
      },
      ...prev,
    ]);
    setQuestionInput("");
  }, [questionInput]);

  const upvoteQuestion = useCallback((id: string) => {
    setQuestions((prev) =>
      prev
        .map((q) => (q.id === id ? { ...q, upvotes: q.upvotes + 1 } : q))
        .sort((a, b) => b.upvotes - a.upvotes)
    );
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
            KLO Leadership &amp; Innovation Summit
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-6 text-lg md:text-xl text-klo-muted max-w-2xl mx-auto leading-relaxed"
          >
            Your interactive companion for today&apos;s event. Access schedules,
            submit questions, take notes, and download resources — all in one
            place.
          </motion.p>

          {/* Event details */}
          <motion.div
            variants={fadeUp}
            custom={3}
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-klo-muted"
          >
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={16} className="text-[#2764FF]" />
              March 15, 2026
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock size={16} className="text-[#2764FF]" />
              9:00 AM - 4:00 PM
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin size={16} className="text-[#2764FF]" />
              Atlanta Convention Center
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

      {/* ====== Live Q&A ====== */}
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
                <MessageSquare size={20} className="text-[#2764FF]" />
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-klo-text">
                Live Q&amp;A
              </h2>
            </div>
            <p className="text-klo-muted">
              Submit your questions for the current session. Popular questions
              rise to the top.
            </p>
          </motion.div>

          {/* Question input */}
          <motion.div variants={fadeUp} custom={1}>
            <Card className="mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitQuestion()}
                  placeholder="Type your question for the speaker..."
                  className="flex-1 bg-klo-navy/50 border border-klo-slate rounded-lg px-4 py-3 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:border-[#2764FF]/50 focus:ring-1 focus:ring-[#2764FF]/20 transition-colors"
                />
                <button
                  onClick={submitQuestion}
                  disabled={!questionInput.trim()}
                  className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-semibold text-sm rounded-lg hover:brightness-110 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  Submit
                </button>
              </div>
            </Card>
          </motion.div>

          {/* Queued questions */}
          <motion.div variants={fadeUp} custom={2} className="space-y-3" aria-live="polite">
            <AnimatePresence mode="popLayout">
              {questions.map((q) => (
                <motion.div
                  key={q.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeOut" as const }}
                >
                  <Card className="flex items-start gap-4">
                    <button
                      onClick={() => upvoteQuestion(q.id)}
                      className="shrink-0 flex flex-col items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#2764FF]/10 transition-colors group"
                    >
                      <ChevronRight
                        size={16}
                        className="text-klo-muted -rotate-90 group-hover:text-[#2764FF] transition-colors"
                      />
                      <span className="text-xs font-semibold text-klo-gold">
                        {q.upvotes}
                      </span>
                    </button>
                    <p className="text-sm text-klo-text leading-relaxed pt-1">
                      {q.text}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
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

      {/* ====== Resource Downloads ====== */}
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
                Resource Downloads
              </h2>
            </div>
            <p className="text-klo-muted">
              Session materials, slides, and handouts available for download.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map((resource, i) => (
              <motion.div key={resource.title} variants={fadeUp} custom={i + 1}>
                <a href={resource.href} download>
                  <Card hoverable className="group">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-12 h-12 rounded-lg bg-[#2764FF]/10 flex items-center justify-center group-hover:bg-[#2764FF]/20 transition-colors">
                        <FileDown
                          size={20}
                          className="text-[#2764FF]"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-klo-text group-hover:text-[#2764FF] transition-colors">
                          {resource.title}
                        </h3>
                        <p className="text-xs text-klo-muted mt-1 leading-relaxed">
                          {resource.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="muted">{resource.type}</Badge>
                          <span className="text-xs text-klo-muted">
                            {resource.size}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </a>
              </motion.div>
            ))}
          </div>
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
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/assessments"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-semibold text-sm rounded-lg hover:brightness-110 transition-colors"
            >
              Take an Assessment
            </Link>
            <Link
              href="/vault"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-klo-slate text-klo-text font-semibold text-sm rounded-lg hover:border-[#2764FF]/30 hover:text-[#2764FF] transition-colors"
            >
              Explore the Vault
            </Link>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-klo-slate text-klo-text font-semibold text-sm rounded-lg hover:border-[#2764FF]/30 hover:text-[#2764FF] transition-colors"
            >
              Book Keith
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
