"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Calendar,
  Clock,
  User,
  CheckCircle,
  Play,
  Download,
  Lock,
  Crown,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import Badge from "@/components/shared/Badge";
import Button from "@/components/shared/Button";
import Card from "@/components/shared/Card";
import {
  getUpcomingSessions,
  getPastSessions,
  type StrategySession,
} from "@/lib/strategy-rooms-data";

// ── Animation Variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
};

// ── Tier Badge ───────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: "pro" | "executive" }) {
  if (tier === "executive") {
    return (
      <Badge variant="gold">
        <Crown size={12} className="mr-1" />
        Executive
      </Badge>
    );
  }
  return (
    <Badge variant="blue">
      <Lock size={12} className="mr-1" />
      Pro
    </Badge>
  );
}

// ── Seats Progress Bar ───────────────────────────────────────────────────────

function SeatsProgress({
  registered,
  total,
}: {
  registered: number;
  total: number;
}) {
  const pct = Math.round((registered / total) * 100);
  const remaining = total - registered;
  const isAlmostFull = pct >= 75;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-klo-muted">
          {remaining} seat{remaining !== 1 ? "s" : ""} remaining
        </span>
        <span
          className={isAlmostFull ? "text-amber-400 font-medium" : "text-klo-muted"}
        >
          {pct}% full
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            isAlmostFull
              ? "bg-gradient-to-r from-[#2764FF] to-[#2764FF]/70"
              : "bg-[#2764FF]/60"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" as const }}
        />
      </div>
    </div>
  );
}

// ── Upcoming Session Card ────────────────────────────────────────────────────

function UpcomingSessionCard({ session }: { session: StrategySession }) {
  const [registered, setRegistered] = useState(false);

  return (
    <motion.div variants={cardVariant}>
      <Card hoverable className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <TierBadge tier={session.tier} />
          <div className="flex items-center gap-1.5 text-xs text-klo-muted shrink-0">
            <MessageSquare size={13} />
            <span>{session.discussionCount}</span>
          </div>
        </div>

        {/* Title */}
        <Link href={`/strategy-rooms/${session.id}`}>
          <h3 className="font-display text-lg font-bold text-klo-text mb-2 hover:text-[#2764FF] transition-colors leading-snug">
            {session.title}
          </h3>
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-klo-muted mb-3">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={13} className="text-[#2764FF]" />
            {session.date}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} className="text-[#2764FF]" />
            {session.time}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <User size={13} className="text-[#2764FF]" />
            {session.facilitator}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-klo-muted leading-relaxed mb-4 line-clamp-3">
          {session.description}
        </p>

        {/* Topics */}
        <div className="flex flex-wrap gap-2 mb-4">
          {session.topics.map((topic) => (
            <Badge key={topic} variant="muted">
              {topic}
            </Badge>
          ))}
        </div>

        {/* Spacer */}
        <div className="mt-auto" />

        {/* Seats */}
        <div className="mb-4">
          <SeatsProgress
            registered={session.registeredCount}
            total={session.totalSeats}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {registered ? (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => setRegistered(false)}
            >
              <CheckCircle size={16} />
              Registered
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={() => setRegistered(true)}
            >
              Register
            </Button>
          )}
          <Button variant="ghost" size="sm" href={`/strategy-rooms/${session.id}`}>
            Details
            <ArrowRight size={14} />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Past Session Card ────────────────────────────────────────────────────────

function PastSessionCard({ session }: { session: StrategySession }) {
  return (
    <motion.div variants={cardVariant}>
      <Card hoverable className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <TierBadge tier={session.tier} />
          <div className="flex items-center gap-1.5 text-xs text-klo-muted shrink-0">
            <Users size={13} />
            <span>{session.attendees} attended</span>
          </div>
        </div>

        {/* Title */}
        <Link href={`/strategy-rooms/${session.id}`}>
          <h3 className="font-display text-lg font-bold text-klo-text mb-2 hover:text-[#2764FF] transition-colors leading-snug">
            {session.title}
          </h3>
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-klo-muted mb-3">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={13} className="text-[#2764FF]" />
            {session.date}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare size={13} className="text-[#2764FF]" />
            {session.discussionCount} comments
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-klo-muted leading-relaxed mb-4 line-clamp-3">
          {session.description}
        </p>

        {/* Topics */}
        <div className="flex flex-wrap gap-2 mb-4">
          {session.topics.map((topic) => (
            <Badge key={topic} variant="muted">
              {topic}
            </Badge>
          ))}
        </div>

        {/* Spacer */}
        <div className="mt-auto" />

        {/* Actions */}
        <div className="flex items-center gap-3">
          {session.replayUrl && (
            <Button variant="primary" size="sm" className="flex-1">
              <Play size={14} />
              Watch Replay
            </Button>
          )}
          {session.notesUrl && (
            <Button variant="secondary" size="sm" className="flex-1">
              <Download size={14} />
              Notes
            </Button>
          )}
          <Button variant="ghost" size="sm" href={`/strategy-rooms/${session.id}`}>
            Details
            <ArrowRight size={14} />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StrategyRoomsPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const upcoming = getUpcomingSessions();
  const past = getPastSessions();

  return (
    <div className="min-h-screen px-6 py-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mb-12"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[#2764FF]/10 flex items-center justify-center">
              <Users size={24} className="text-[#2764FF]" />
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-klo-text">
                Strategy Rooms
              </h1>
              <p className="text-sm text-klo-muted mt-0.5">
                Collaborative sessions with Keith and fellow leaders
              </p>
            </div>
          </motion.div>

          {/* Tab Toggle */}
          <motion.div variants={fadeUp} custom={1} className="mt-8">
            <div className="inline-flex items-center bg-white/5 rounded-xl p-1 border border-klo-slate">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                  activeTab === "upcoming"
                    ? "bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white shadow-md"
                    : "text-[#8B949E] hover:text-klo-text"
                }`}
              >
                Upcoming ({upcoming.length})
              </button>
              <button
                onClick={() => setActiveTab("past")}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                  activeTab === "past"
                    ? "bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white shadow-md"
                    : "text-[#8B949E] hover:text-klo-text"
                }`}
              >
                Past Sessions ({past.length})
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* Session Grid */}
        <AnimatePresence mode="wait">
          {activeTab === "upcoming" ? (
            <motion.div
              key="upcoming"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={staggerContainer}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2"
            >
              {upcoming.map((session) => (
                <UpcomingSessionCard key={session.id} session={session} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="past"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={staggerContainer}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2"
            >
              {past.map((session) => (
                <PastSessionCard key={session.id} session={session} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
