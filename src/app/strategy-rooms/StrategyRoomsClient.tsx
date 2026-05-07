"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Loader2,
} from "lucide-react";
import Badge from "@/components/shared/Badge";
import Button from "@/components/shared/Button";
import Card from "@/components/shared/Card";
import { useToast } from "@/contexts/ToastContext";
import type { StrategySessionRow } from "@/lib/supabase";

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

function UpcomingSessionCard({ session }: { session: StrategySessionRow }) {
  const router = useRouter();
  const { toast } = useToast();
  const [registeredCount, setRegisteredCount] = useState(session.registered_count ?? 0);
  const [isRegistered, setIsRegistered] = useState(session.is_registered ?? false);
  const [loading, setLoading] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);

  async function handleRegister() {
    setLoading(true);
    setUpgradeMsg(null);
    try {
      const res = await fetch(`/api/strategy-rooms/${session.slug}/register`, {
        method: "POST",
      });
      if (res.status === 401) {
        router.push("/auth/signin");
        return;
      }
      if (res.status === 403) {
        const data = await res.json();
        const tierLabel = data.tier === "executive" ? "Executive" : "Pro";
        setUpgradeMsg(`This session requires a ${tierLabel} membership.`);
        return;
      }
      if (res.status === 409) {
        toast("error", "This session is full");
        return;
      }
      if (!res.ok) {
        toast("error", "Registration failed. Please try again.");
        return;
      }
      const data = await res.json();
      setRegisteredCount(data.registered_count);
      setIsRegistered(true);
      toast("success", "You're registered! Check your email for confirmation.");
    } catch {
      toast("error", "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnregister() {
    setLoading(true);
    try {
      const res = await fetch(`/api/strategy-rooms/${session.slug}/register`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        router.push("/auth/signin");
        return;
      }
      if (!res.ok) {
        toast("error", "Could not cancel registration. Please try again.");
        return;
      }
      const data = await res.json();
      setRegisteredCount(data.registered_count);
      setIsRegistered(false);
      toast("success", "Registration cancelled.");
    } catch {
      toast("error", "Could not cancel registration. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div variants={cardVariant}>
      <Card hoverable className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <TierBadge tier={session.tier} />
          <div className="flex items-center gap-1.5 text-xs text-klo-muted shrink-0">
            <MessageSquare size={13} />
            <span>{session.discussion_count}</span>
          </div>
        </div>

        {/* Title */}
        <Link href={`/strategy-rooms/${session.slug}`}>
          <h3 className="font-display text-lg font-bold text-klo-text mb-2 hover:text-[#2764FF] transition-colors leading-snug">
            {session.title}
          </h3>
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-klo-muted mb-3">
          {session.date && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={13} className="text-[#2764FF]" />
              {session.date}
            </span>
          )}
          {session.time && (
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} className="text-[#2764FF]" />
              {session.time}
            </span>
          )}
          {session.facilitator && (
            <span className="inline-flex items-center gap-1.5">
              <User size={13} className="text-[#2764FF]" />
              {session.facilitator}
            </span>
          )}
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

        {/* Upgrade message */}
        {upgradeMsg && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
            {upgradeMsg}{" "}
            <Link href="/pricing" className="underline hover:no-underline">
              Upgrade
            </Link>
          </div>
        )}

        {/* Spacer */}
        <div className="mt-auto" />

        {/* Seats */}
        <div className="mb-4">
          <SeatsProgress registered={registeredCount} total={session.total_seats} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isRegistered ? (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={handleUnregister}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              Registered
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              {loading ? "Registering..." : "Register"}
            </Button>
          )}
          <Button variant="ghost" size="sm" href={`/strategy-rooms/${session.slug}`}>
            Details
            <ArrowRight size={14} />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Past Session Card ────────────────────────────────────────────────────────

function PastSessionCard({ session }: { session: StrategySessionRow }) {
  const attendees = session.attendees_override ?? session.registered_count ?? 0;

  return (
    <motion.div variants={cardVariant}>
      <Card hoverable className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <TierBadge tier={session.tier} />
          <div className="flex items-center gap-1.5 text-xs text-klo-muted shrink-0">
            <Users size={13} />
            <span>{attendees} attended</span>
          </div>
        </div>

        {/* Title */}
        <Link href={`/strategy-rooms/${session.slug}`}>
          <h3 className="font-display text-lg font-bold text-klo-text mb-2 hover:text-[#2764FF] transition-colors leading-snug">
            {session.title}
          </h3>
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-klo-muted mb-3">
          {session.date && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={13} className="text-[#2764FF]" />
              {session.date}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare size={13} className="text-[#2764FF]" />
            {session.discussion_count} comments
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
          {session.replay_url && (
            <Button variant="primary" size="sm" className="flex-1">
              <Play size={14} />
              Watch Replay
            </Button>
          )}
          {session.notes_url && (
            <Button variant="secondary" size="sm" className="flex-1">
              <Download size={14} />
              Notes
            </Button>
          )}
          <Button variant="ghost" size="sm" href={`/strategy-rooms/${session.slug}`}>
            Details
            <ArrowRight size={14} />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Client Wrapper ────────────────────────────────────────────────────────────

interface StrategyRoomsClientProps {
  upcoming: StrategySessionRow[];
  past: StrategySessionRow[];
}

export default function StrategyRoomsClient({ upcoming, past }: StrategyRoomsClientProps) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  return (
    <>
      {/* Tab Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.5, ease: "easeOut" }}
        className="mt-8 mb-12"
      >
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
            {upcoming.length === 0 ? (
              <p className="text-klo-muted col-span-2">No upcoming sessions scheduled.</p>
            ) : (
              upcoming.map((session) => (
                <UpcomingSessionCard key={session.id} session={session} />
              ))
            )}
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
            {past.length === 0 ? (
              <p className="text-klo-muted col-span-2">No past sessions found.</p>
            ) : (
              past.map((session) => (
                <PastSessionCard key={session.id} session={session} />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export { fadeUp, staggerContainer };
