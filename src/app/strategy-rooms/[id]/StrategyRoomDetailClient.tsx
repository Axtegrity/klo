"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Users,
  Crown,
  Lock,
  Play,
  Download,
  CheckCircle,
  Heart,
  MessageSquare,
  Zap,
  ArrowRight,
  X,
  ShieldCheck,
  CalendarCheck,
  Loader2,
} from "lucide-react";
import Badge from "@/components/shared/Badge";
import Button from "@/components/shared/Button";
import Card from "@/components/shared/Card";
import { useToast } from "@/contexts/ToastContext";
import type { StrategySessionRow } from "@/lib/supabase";
import { sampleDiscussionComments, type DiscussionComment } from "@/lib/strategy-rooms-discussion-mock";

// ── Animation Variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemFade = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] as const } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
  },
  exit: {
    opacity: 0, scale: 0.95, y: 10,
    transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] as const },
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

// ── Countdown Timer ──────────────────────────────────────────────────────────

function CountdownTimer({ dateStr }: { dateStr: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    function calculate() {
      const target = new Date(dateStr).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft({ days, hours, minutes });
    }
    calculate();
    const interval = setInterval(calculate, 60000);
    return () => clearInterval(interval);
  }, [dateStr]);

  return (
    <div className="flex items-center gap-4">
      {[
        { label: "Days", value: timeLeft.days },
        { label: "Hours", value: timeLeft.hours },
        { label: "Minutes", value: timeLeft.minutes },
      ].map((item) => (
        <div key={item.label} className="text-center">
          <div className="w-16 h-16 bg-[#68E9FA]/10 border border-[#68E9FA]/20 rounded-xl flex items-center justify-center mb-1">
            <span className="font-display text-2xl font-bold text-klo-gold">
              {item.value}
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-klo-muted">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Discussion Comment ────────────────────────────────────────────────────────

function CommentItem({
  comment,
  onLike,
}: {
  comment: DiscussionComment;
  onLike: (id: string) => void;
}) {
  return (
    <motion.div variants={itemFade} className="flex gap-3">
      <div className="w-9 h-9 rounded-full bg-[#68E9FA]/15 border border-[#68E9FA]/20 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-klo-gold">{comment.authorInitials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-klo-text">{comment.author}</span>
          <span className="text-xs text-klo-muted">{comment.timestamp}</span>
        </div>
        <p className="text-sm text-klo-muted leading-relaxed mb-1.5">{comment.content}</p>
        <button
          onClick={() => onLike(comment.id)}
          className="inline-flex items-center gap-1.5 text-xs text-klo-muted hover:text-rose-400 transition-colors cursor-pointer"
        >
          <Heart size={13} />
          <span>{comment.likes}</span>
        </button>
      </div>
    </motion.div>
  );
}

// ── Related Session Card ─────────────────────────────────────────────────────

function RelatedSessionCard({ session }: { session: StrategySessionRow }) {
  return (
    <Link href={`/strategy-rooms/${session.slug}`}>
      <Card hoverable className="p-4">
        <TierBadge tier={session.tier} />
        <h4 className="font-display text-sm font-bold text-klo-text mt-2 mb-1 leading-snug hover:text-[#68E9FA] transition-colors">
          {session.title}
        </h4>
        {session.date && (
          <div className="flex items-center gap-1.5 text-xs text-klo-muted">
            <Calendar size={12} />
            <span>{session.date}</span>
          </div>
        )}
      </Card>
    </Link>
  );
}

// ── Registration Modal ────────────────────────────────────────────────────────

function RegistrationModal({
  session,
  onConfirm,
  onClose,
  confirming,
}: {
  session: StrategySessionRow;
  onConfirm: () => void;
  onClose: () => void;
  confirming: boolean;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative w-full max-w-md bg-klo-navy border border-klo-slate rounded-2xl p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-klo-muted hover:text-klo-text transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#68E9FA]/10 border border-[#68E9FA]/20 flex items-center justify-center">
            <CalendarCheck size={20} className="text-[#68E9FA]" />
          </div>
          <h2 className="font-display text-lg font-bold text-klo-text">Confirm Registration</h2>
        </div>

        <p className="text-sm text-klo-muted leading-relaxed mb-4">
          You are about to register for:
        </p>

        <div className="bg-klo-dark rounded-xl border border-klo-slate p-4 mb-5">
          <h3 className="font-display text-sm font-bold text-klo-text mb-2">{session.title}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-klo-muted">
            {session.date && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={12} className="text-[#68E9FA]" />
                {session.date}
              </span>
            )}
            {session.time && (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={12} className="text-[#68E9FA]" />
                {session.time}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm} className="flex-1" disabled={confirming}>
            {confirming ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            {confirming ? "Registering..." : "Confirm Registration"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Tier Gate Modal ───────────────────────────────────────────────────────────

function TierGateModal({
  requiredTier,
  onClose,
}: {
  requiredTier: "pro" | "executive";
  onClose: () => void;
}) {
  const tierLabel = requiredTier === "executive" ? "Executive" : "Pro";
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative w-full max-w-md bg-klo-navy border border-klo-slate rounded-2xl p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-klo-muted hover:text-klo-text transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#68E9FA]/10 border border-[#68E9FA]/20 flex items-center justify-center">
            <ShieldCheck size={20} className="text-[#68E9FA]" />
          </div>
          <h2 className="font-display text-lg font-bold text-klo-text">
            {tierLabel} Access Required
          </h2>
        </div>
        <p className="text-sm text-klo-muted leading-relaxed mb-5">
          This strategy room session is available to{" "}
          <span className="text-[#68E9FA] font-medium">{tierLabel}</span> members.
          Upgrade your plan to register and join exclusive sessions led by Keith L. Odom.
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">
            Maybe Later
          </Button>
          <Button variant="primary" size="sm" href="/pricing" className="flex-1">
            <Crown size={14} />
            Upgrade to {tierLabel}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Client Component ─────────────────────────────────────────────────────

interface Props {
  session: StrategySessionRow;
  related: StrategySessionRow[];
}

export default function StrategyRoomDetailClient({ session, related }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [registeredCount, setRegisteredCount] = useState(session.registered_count ?? 0);
  const [isRegistered, setIsRegistered] = useState(session.is_registered ?? false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showTierGateModal, setShowTierGateModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isUnregistering, setIsUnregistering] = useState(false);
  const [comments, setComments] = useState<DiscussionComment[]>(sampleDiscussionComments);

  function handleRegisterClick() {
    setShowConfirmModal(true);
  }

  async function handleConfirmRegistration() {
    setConfirming(true);
    try {
      const res = await fetch(`/api/strategy-rooms/${session.slug}/register`, {
        method: "POST",
      });
      if (res.status === 401) {
        setShowConfirmModal(false);
        router.push("/auth/signin");
        return;
      }
      if (res.status === 403) {
        setShowConfirmModal(false);
        setShowTierGateModal(true);
        return;
      }
      if (res.status === 409) {
        setShowConfirmModal(false);
        toast("error", "This session is full");
        return;
      }
      if (!res.ok) {
        setShowConfirmModal(false);
        toast("error", "Registration failed. Please try again.");
        return;
      }
      const data = await res.json();
      setRegisteredCount(data.registered_count);
      setIsRegistered(true);
      setShowConfirmModal(false);
      toast("success", "You're registered! Check your email for confirmation.");
    } catch {
      setShowConfirmModal(false);
      toast("error", "Registration failed. Please try again.");
    } finally {
      setConfirming(false);
    }
  }

  async function handleUnregister() {
    setIsUnregistering(true);
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
      setIsUnregistering(false);
    }
  }

  function handleLike(commentId: string) {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, likes: c.likes + 1 } : c))
    );
  }

const isPast = session.is_past;
  const attendees = session.attendees_override ?? registeredCount;

  return (
    <div className="min-h-screen px-6 py-24">
      <div className="max-w-6xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          {/* Back Link */}
          <motion.div variants={fadeUp} custom={0} className="mb-8">
            <Link
              href="/strategy-rooms"
              className="inline-flex items-center gap-2 text-sm text-klo-muted hover:text-[#68E9FA] transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Strategy Rooms
            </Link>
          </motion.div>

          {/* Layout: Main + Sidebar */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* ── Main Content ─────────────────────────────────── */}
            <div className="flex-1 min-w-0">
              {/* Session Header */}
              <motion.div variants={fadeUp} custom={1}>
                <Card className="mb-6">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <TierBadge tier={session.tier} />
                    <Badge variant={isPast ? "muted" : "green"}>
                      {isPast ? "Completed" : "Upcoming"}
                    </Badge>
                  </div>

                  <h1 className="font-display text-2xl md:text-3xl font-bold text-klo-text mb-4 leading-tight">
                    {session.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-klo-muted mb-5">
                    {session.date && (
                      <span className="inline-flex items-center gap-2">
                        <Calendar size={15} className="text-[#68E9FA]" />
                        {session.date}
                      </span>
                    )}
                    {session.time && (
                      <span className="inline-flex items-center gap-2">
                        <Clock size={15} className="text-[#68E9FA]" />
                        {session.time}
                      </span>
                    )}
                    {session.facilitator && (
                      <span className="inline-flex items-center gap-2">
                        <User size={15} className="text-[#68E9FA]" />
                        {session.facilitator}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-2">
                      <Users size={15} className="text-[#68E9FA]" />
                      {isPast
                        ? `${attendees} attended`
                        : `${registeredCount}/${session.total_seats} registered`}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {session.topics.map((topic) => (
                      <Badge key={topic} variant="muted">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </Card>
              </motion.div>

              {/* Description */}
              <motion.div variants={fadeUp} custom={2}>
                <Card className="mb-6">
                  <h2 className="font-display text-lg font-bold text-klo-text mb-3">
                    About This Session
                  </h2>
                  <p className="text-sm text-klo-muted leading-relaxed">
                    {session.description}
                  </p>
                </Card>
              </motion.div>

              {/* Upcoming sections */}
              {!isPast && (
                <>
                  {/* Countdown + Registration */}
                  <motion.div variants={fadeUp} custom={3}>
                    <Card className="mb-6">
                      <h2 className="font-display text-lg font-bold text-klo-text mb-5">
                        Session Starts In
                      </h2>
                      {session.session_date && <CountdownTimer dateStr={session.session_date} />}

                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        {isRegistered ? (
                          <Button
                            variant="secondary"
                            onClick={handleUnregister}
                            disabled={isUnregistering}
                          >
                            {isUnregistering ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                            {isUnregistering ? "Cancelling…" : "Registered"}
                          </Button>
                        ) : (
                          <Button variant="primary" onClick={handleRegisterClick}>
                            Register for Session
                          </Button>
                        )}
                        <Button variant="ghost" disabled={!isRegistered}>
                          <Zap size={16} />
                          Join Session
                        </Button>
                      </div>

                      <div className="mt-5">
                        <div className="flex items-center justify-between text-xs text-klo-muted mb-1.5">
                          <span>{session.total_seats - registeredCount} seats remaining</span>
                          <span>
                            {Math.round((registeredCount / session.total_seats) * 100)}% full
                          </span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-[#68E9FA] to-[#68E9FA]/70"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.round((registeredCount / session.total_seats) * 100)}%`,
                            }}
                            transition={{ duration: 0.8, ease: "easeOut" as const }}
                          />
                        </div>
                      </div>
                    </Card>
                  </motion.div>

                  {/* Agenda */}
                  {session.agenda && session.agenda.length > 0 && (
                    <motion.div variants={fadeUp} custom={4}>
                      <Card className="mb-6">
                        <h2 className="font-display text-lg font-bold text-klo-text mb-4">
                          Session Agenda
                        </h2>
                        <div className="space-y-0">
                          {session.agenda.map((item, idx) => (
                            <div
                              key={idx}
                              className={`flex gap-4 py-4 ${
                                idx < session.agenda.length - 1 ? "border-b border-klo-slate" : ""
                              }`}
                            >
                              <div className="shrink-0 w-20">
                                <span className="text-xs font-mono text-[#68E9FA] font-medium">
                                  {item.time}
                                </span>
                              </div>
                              <div>
                                <h3 className="text-sm font-semibold text-klo-text mb-0.5">
                                  {item.title}
                                </h3>
                                <p className="text-xs text-klo-muted leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </>
              )}

              {/* Past sections */}
              {isPast && (
                <>
                  {session.replay_url && (
                    <motion.div variants={fadeUp} custom={3}>
                      <Card className="mb-6">
                        <h2 className="font-display text-lg font-bold text-klo-text mb-4">
                          Session Replay
                        </h2>
                        <div className="relative aspect-video bg-klo-navy rounded-xl overflow-hidden border border-klo-slate mb-4 flex items-center justify-center group cursor-pointer">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          <div className="relative z-10 w-16 h-16 rounded-full bg-[#68E9FA]/20 border-2 border-[#68E9FA] flex items-center justify-center group-hover:bg-[#68E9FA]/30 transition-colors">
                            <Play size={28} className="text-[#68E9FA] ml-1" fill="currentColor" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button variant="primary" size="sm">
                            <Play size={14} />
                            Watch Replay
                          </Button>
                          {session.notes_url && (
                            <Button variant="secondary" size="sm">
                              <Download size={14} />
                              Download Notes
                            </Button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  )}

                  {session.key_takeaways && session.key_takeaways.length > 0 && (
                    <motion.div variants={fadeUp} custom={4}>
                      <Card className="mb-6">
                        <h2 className="font-display text-lg font-bold text-klo-text mb-4">
                          Key Takeaways
                        </h2>
                        <ul className="space-y-3">
                          {session.key_takeaways.map((takeaway, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-3 text-sm text-klo-muted leading-relaxed"
                            >
                              <CheckCircle size={16} className="text-[#68E9FA] shrink-0 mt-0.5" />
                              <span>{takeaway}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </motion.div>
                  )}
                </>
              )}

              {/* Discussion Thread */}
              <motion.div variants={fadeUp} custom={5}>
                <Card className="mb-6">
                  <div className="flex items-center gap-2 mb-5">
                    <MessageSquare size={18} className="text-[#68E9FA]" />
                    <h2 className="font-display text-lg font-bold text-klo-text">
                      Discussion ({comments.length})
                    </h2>
                  </div>

                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={stagger}
                    className="space-y-5 mb-6"
                  >
                    {comments.map((comment) => (
                      <CommentItem key={comment.id} comment={comment} onLike={handleLike} />
                    ))}
                  </motion.div>

                  {/* TODO: wire to strategy_comments API when table is built */}
                  <div className="border-t border-klo-slate pt-5">
                    <p className="text-xs text-klo-muted text-center py-2">
                      Discussion coming soon — live comments will be available for upcoming sessions.
                    </p>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* ── Sidebar ─────────────────────────────────────────── */}
            <motion.aside
              variants={fadeUp}
              custom={3}
              className="hidden lg:block w-72 shrink-0"
            >
              <div className="sticky top-28 space-y-6">
                <Card>
                  <h3 className="font-display text-sm font-bold text-klo-text mb-3 uppercase tracking-wider">
                    Session Info
                  </h3>
                  <dl className="space-y-3 text-sm">
                    {session.facilitator && (
                      <div>
                        <dt className="text-klo-muted text-xs mb-0.5">Facilitator</dt>
                        <dd className="text-klo-text font-medium">{session.facilitator}</dd>
                      </div>
                    )}
                    {(session.date || session.time) && (
                      <div>
                        <dt className="text-klo-muted text-xs mb-0.5">Date & Time</dt>
                        <dd className="text-klo-text font-medium">
                          {session.date}
                          {session.time && (
                            <>
                              <br />
                              <span className="text-klo-muted font-normal">{session.time}</span>
                            </>
                          )}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-klo-muted text-xs mb-0.5">Access Level</dt>
                      <dd><TierBadge tier={session.tier} /></dd>
                    </div>
                    <div>
                      <dt className="text-klo-muted text-xs mb-0.5">Discussion</dt>
                      <dd className="text-klo-text font-medium">{comments.length} comments</dd>
                    </div>
                  </dl>
                </Card>

                {related.length > 0 && (
                  <div>
                    <h3 className="font-display text-sm font-bold text-klo-text mb-3 uppercase tracking-wider">
                      Related Sessions
                    </h3>
                    <div className="space-y-3">
                      {related.map((s) => (
                        <RelatedSessionCard key={s.id} session={s} />
                      ))}
                    </div>
                  </div>
                )}

                <Button variant="ghost" size="sm" href="/strategy-rooms" className="w-full">
                  <ArrowRight size={14} className="rotate-180" />
                  All Strategy Rooms
                </Button>
              </div>
            </motion.aside>
          </div>
        </motion.div>

        {/* Registration Confirmation Modal */}
        <AnimatePresence>
          {showConfirmModal && (
            <RegistrationModal
              session={session}
              onConfirm={handleConfirmRegistration}
              onClose={() => setShowConfirmModal(false)}
              confirming={confirming}
            />
          )}
        </AnimatePresence>

        {/* Tier Gate Modal */}
        <AnimatePresence>
          {showTierGateModal && (
            <TierGateModal
              requiredTier={session.tier}
              onClose={() => setShowTierGateModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
