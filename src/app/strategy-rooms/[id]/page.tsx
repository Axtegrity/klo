"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
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
  Send,
  MessageSquare,
  Zap,
  ArrowRight,
  X,
  ShieldCheck,
  CalendarCheck,
} from "lucide-react";
import Badge from "@/components/shared/Badge";
import Button from "@/components/shared/Button";
import Card from "@/components/shared/Card";
import {
  getSessionById,
  getRelatedSessions,
  sampleDiscussionComments,
  type StrategySession,
  type DiscussionComment,
} from "@/lib/strategy-rooms-data";
import { useSubscription } from "@/hooks/useSubscription";

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
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
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

// ── Discussion Comment Component ─────────────────────────────────────────────

function CommentItem({
  comment,
  onLike,
}: {
  comment: DiscussionComment;
  onLike: (id: string) => void;
}) {
  return (
    <motion.div variants={itemFade} className="flex gap-3">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-[#68E9FA]/15 border border-[#68E9FA]/20 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-klo-gold">
          {comment.authorInitials}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-klo-text">
            {comment.author}
          </span>
          <span className="text-xs text-klo-muted">{comment.timestamp}</span>
        </div>
        <p className="text-sm text-klo-muted leading-relaxed mb-1.5">
          {comment.content}
        </p>
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

function RelatedSessionCard({ session }: { session: StrategySession }) {
  return (
    <Link href={`/strategy-rooms/${session.id}`}>
      <Card hoverable className="p-4">
        <TierBadge tier={session.tier} />
        <h4 className="font-display text-sm font-bold text-klo-text mt-2 mb-1 leading-snug hover:text-[#68E9FA] transition-colors">
          {session.title}
        </h4>
        <div className="flex items-center gap-1.5 text-xs text-klo-muted">
          <Calendar size={12} />
          <span>{session.date}</span>
        </div>
      </Card>
    </Link>
  );
}

// ── localStorage helpers ─────────────────────────────────────────────────────

const REGISTRATION_PREFIX = "klo-strategy-room-reg-";

function getRegistration(roomId: string): boolean {
  try {
    return localStorage.getItem(`${REGISTRATION_PREFIX}${roomId}`) === "true";
  } catch {
    return false;
  }
}

function setRegistration(roomId: string, value: boolean) {
  try {
    if (value) {
      localStorage.setItem(`${REGISTRATION_PREFIX}${roomId}`, "true");
    } else {
      localStorage.removeItem(`${REGISTRATION_PREFIX}${roomId}`);
    }
  } catch {
    // localStorage unavailable
  }
}

// ── Modal overlay animation ─────────────────────────────────────────────────

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] as const } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] as const },
  },
};

// ── Registration Confirmation Modal ─────────────────────────────────────────

function RegistrationModal({
  session,
  onConfirm,
  onClose,
}: {
  session: StrategySession;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
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
          <h2 className="font-display text-lg font-bold text-klo-text">
            Confirm Registration
          </h2>
        </div>

        <p className="text-sm text-klo-muted leading-relaxed mb-4">
          You are about to register for:
        </p>

        <div className="bg-klo-dark rounded-xl border border-klo-slate p-4 mb-5">
          <h3 className="font-display text-sm font-bold text-klo-text mb-2">
            {session.title}
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-klo-muted">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={12} className="text-[#68E9FA]" />
              {session.date}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={12} className="text-[#68E9FA]" />
              {session.time}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm} className="flex-1">
            <CheckCircle size={14} />
            Confirm Registration
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Tier Gate Modal ─────────────────────────────────────────────────────────

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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
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
          This strategy room session is available to <span className="text-[#68E9FA] font-medium">{tierLabel}</span> members.
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

// ── Main Page Component ──────────────────────────────────────────────────────

export default function StrategyRoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const session = getSessionById(id);
  const related = getRelatedSessions(id, 3);

  const { canAccess } = useSubscription();

  const [registered, setRegistered] = useState(() =>
    session ? getRegistration(session.id) : false
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showTierGateModal, setShowTierGateModal] = useState(false);
  const [comments, setComments] = useState<DiscussionComment[]>(
    sampleDiscussionComments
  );
  const [newComment, setNewComment] = useState("");

  function handleRegisterClick() {
    if (!session) return;
    // Tier gate: pro/executive rooms require matching tier
    if (!canAccess(session.tier)) {
      setShowTierGateModal(true);
      return;
    }
    setShowConfirmModal(true);
  }

  function handleConfirmRegistration() {
    if (!session) return;
    setRegistration(session.id, true);
    setRegistered(true);
    setShowConfirmModal(false);
  }

  function handleUnregister() {
    if (!session) return;
    setRegistration(session.id, false);
    setRegistered(false);
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-24">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-klo-text mb-4">
            Session Not Found
          </h1>
          <p className="text-klo-muted mb-6">
            This strategy room session could not be found.
          </p>
          <Button variant="secondary" href="/strategy-rooms">
            <ArrowLeft size={16} />
            Back to Strategy Rooms
          </Button>
        </div>
      </div>
    );
  }

  function handleLike(commentId: string) {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, likes: c.likes + 1 } : c))
    );
  }

  function handleSubmitComment() {
    if (!newComment.trim()) return;
    const comment: DiscussionComment = {
      id: `dc-new-${Date.now()}`,
      author: "You",
      authorInitials: "YO",
      content: newComment.trim(),
      timestamp: "Just now",
      likes: 0,
    };
    setComments((prev) => [...prev, comment]);
    setNewComment("");
  }

  return (
    <div className="min-h-screen px-6 py-24">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
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
            {/* ── Main Content ──────────────────────────────────── */}
            <div className="flex-1 min-w-0">
              {/* Session Header */}
              <motion.div variants={fadeUp} custom={1}>
                <Card className="mb-6">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <TierBadge tier={session.tier} />
                    <Badge variant={session.isPast ? "muted" : "green"}>
                      {session.isPast ? "Completed" : "Upcoming"}
                    </Badge>
                  </div>

                  <h1 className="font-display text-2xl md:text-3xl font-bold text-klo-text mb-4 leading-tight">
                    {session.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-klo-muted mb-5">
                    <span className="inline-flex items-center gap-2">
                      <Calendar size={15} className="text-[#68E9FA]" />
                      {session.date}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Clock size={15} className="text-[#68E9FA]" />
                      {session.time}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <User size={15} className="text-[#68E9FA]" />
                      {session.facilitator}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Users size={15} className="text-[#68E9FA]" />
                      {session.isPast
                        ? `${session.attendees} attended`
                        : `${session.registeredCount}/${session.totalSeats} registered`}
                    </span>
                  </div>

                  {/* Topics */}
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

              {/* ── Upcoming-specific sections ────────────────── */}
              {!session.isPast && (
                <>
                  {/* Countdown + Registration */}
                  <motion.div variants={fadeUp} custom={3}>
                    <Card className="mb-6">
                      <h2 className="font-display text-lg font-bold text-klo-text mb-5">
                        Session Starts In
                      </h2>
                      <CountdownTimer dateStr={session.date} />

                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        {registered ? (
                          <Button
                            variant="secondary"
                            onClick={handleUnregister}
                          >
                            <CheckCircle size={16} />
                            Registered
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            onClick={handleRegisterClick}
                          >
                            Register for Session
                          </Button>
                        )}
                        <Button variant="ghost" disabled={!registered}>
                          <Zap size={16} />
                          Join Session
                        </Button>
                      </div>

                      {/* Capacity */}
                      <div className="mt-5">
                        <div className="flex items-center justify-between text-xs text-klo-muted mb-1.5">
                          <span>
                            {session.totalSeats - session.registeredCount} seats
                            remaining
                          </span>
                          <span>
                            {Math.round(
                              (session.registeredCount / session.totalSeats) *
                                100
                            )}
                            % full
                          </span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-[#68E9FA] to-[#68E9FA]/70"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.round(
                                (session.registeredCount /
                                  session.totalSeats) *
                                  100
                              )}%`,
                            }}
                            transition={{
                              duration: 0.8,
                              ease: "easeOut" as const,
                            }}
                          />
                        </div>
                      </div>
                    </Card>
                  </motion.div>

                  {/* Agenda */}
                  {session.agenda && (
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
                                idx < (session.agenda?.length ?? 0) - 1
                                  ? "border-b border-klo-slate"
                                  : ""
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

              {/* ── Past-specific sections ────────────────────── */}
              {session.isPast && (
                <>
                  {/* Replay */}
                  {session.replayUrl && (
                    <motion.div variants={fadeUp} custom={3}>
                      <Card className="mb-6">
                        <h2 className="font-display text-lg font-bold text-klo-text mb-4">
                          Session Replay
                        </h2>
                        {/* Video placeholder */}
                        <div className="relative aspect-video bg-klo-navy rounded-xl overflow-hidden border border-klo-slate mb-4 flex items-center justify-center group cursor-pointer">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          <div className="relative z-10 w-16 h-16 rounded-full bg-[#68E9FA]/20 border-2 border-[#68E9FA] flex items-center justify-center group-hover:bg-[#68E9FA]/30 transition-colors">
                            <Play
                              size={28}
                              className="text-[#68E9FA] ml-1"
                              fill="currentColor"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button variant="primary" size="sm">
                            <Play size={14} />
                            Watch Replay
                          </Button>
                          {session.notesUrl && (
                            <Button variant="secondary" size="sm">
                              <Download size={14} />
                              Download Notes
                            </Button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  )}

                  {/* Key Takeaways */}
                  {session.keyTakeaways && (
                    <motion.div variants={fadeUp} custom={4}>
                      <Card className="mb-6">
                        <h2 className="font-display text-lg font-bold text-klo-text mb-4">
                          Key Takeaways
                        </h2>
                        <ul className="space-y-3">
                          {session.keyTakeaways.map((takeaway, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-3 text-sm text-klo-muted leading-relaxed"
                            >
                              <CheckCircle
                                size={16}
                                className="text-[#68E9FA] shrink-0 mt-0.5"
                              />
                              <span>{takeaway}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </motion.div>
                  )}
                </>
              )}

              {/* ── Discussion Thread ─────────────────────────── */}
              <motion.div variants={fadeUp} custom={5}>
                <Card className="mb-6">
                  <div className="flex items-center gap-2 mb-5">
                    <MessageSquare size={18} className="text-[#68E9FA]" />
                    <h2 className="font-display text-lg font-bold text-klo-text">
                      Discussion ({comments.length})
                    </h2>
                  </div>

                  {/* Comments */}
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={stagger}
                    className="space-y-5 mb-6"
                  >
                    {comments.map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        onLike={handleLike}
                      />
                    ))}
                  </motion.div>

                  {/* New Comment */}
                  <div className="border-t border-klo-slate pt-5">
                    <h3 className="text-sm font-semibold text-klo-text mb-3">
                      Add a Comment
                    </h3>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts or questions..."
                      rows={3}
                      className="w-full bg-white/5 border border-klo-slate rounded-xl px-4 py-3 text-sm text-klo-text placeholder-klo-muted focus:outline-none focus:ring-2 focus:ring-[#68E9FA]/30 focus:border-[#68E9FA]/40 resize-none transition-all"
                    />
                    <div className="flex justify-end mt-3">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim()}
                      >
                        <Send size={14} />
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* ── Sidebar (desktop) ─────────────────────────────── */}
            <motion.aside
              variants={fadeUp}
              custom={3}
              className="hidden lg:block w-72 shrink-0"
            >
              <div className="sticky top-28 space-y-6">
                {/* Quick Info */}
                <Card>
                  <h3 className="font-display text-sm font-bold text-klo-text mb-3 uppercase tracking-wider">
                    Session Info
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-klo-muted text-xs mb-0.5">
                        Facilitator
                      </dt>
                      <dd className="text-klo-text font-medium">
                        {session.facilitator}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-klo-muted text-xs mb-0.5">
                        Date & Time
                      </dt>
                      <dd className="text-klo-text font-medium">
                        {session.date}
                        <br />
                        <span className="text-klo-muted font-normal">
                          {session.time}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-klo-muted text-xs mb-0.5">
                        Access Level
                      </dt>
                      <dd>
                        <TierBadge tier={session.tier} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-klo-muted text-xs mb-0.5">
                        Discussion
                      </dt>
                      <dd className="text-klo-text font-medium">
                        {comments.length} comments
                      </dd>
                    </div>
                  </dl>
                </Card>

                {/* Related Sessions */}
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

                {/* Back CTA */}
                <Button
                  variant="ghost"
                  size="sm"
                  href="/strategy-rooms"
                  className="w-full"
                >
                  <ArrowRight size={14} className="rotate-180" />
                  All Strategy Rooms
                </Button>
              </div>
            </motion.aside>
          </div>
        </motion.div>

        {/* Registration Confirmation Modal */}
        <AnimatePresence>
          {showConfirmModal && session && (
            <RegistrationModal
              session={session}
              onConfirm={handleConfirmRegistration}
              onClose={() => setShowConfirmModal(false)}
            />
          )}
        </AnimatePresence>

        {/* Tier Gate Modal */}
        <AnimatePresence>
          {showTierGateModal && session && (
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
