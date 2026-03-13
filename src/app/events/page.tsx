"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  ArrowRight,
  CalendarDays,
  Sparkles,
  FileText,
  Download,
  ExternalLink,
  Share2,
  Radio,
  Lock,
  Eye,
  BarChart3,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Badge from "@/components/shared/Badge";
import Card from "@/components/shared/Card";
import { nativeShare } from "@/lib/native-share";

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

interface EventFile {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: string | null;
}

interface EventItem {
  id: string;
  title: string;
  slug: string;
  conference_name: string;
  conference_location: string;
  event_date: string;
  event_time: string | null;
  description: string | null;
  notes: string | null;
  is_featured: boolean;
  access_code: string | null;
  website_url: string | null;
  start_date: string | null;
  end_date: string | null;
  session_name: string | null;
  room_location: string | null;
  display_name_mode: string | null;
  event_files: EventFile[];
}

interface PollResult {
  id: string;
  question: string;
  options: string[];
  votes: number[];
  totalVotes: number;
  closed_at: string | null;
}

function formatDate(dateStr: string): string {
  if (dateStr === "SAVE THE DATE") return "SAVE THE DATE";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function linkifyText(text: string): React.ReactNode[] {
  const urlPattern = /(https?:\/\/[^\s,)<>]+[^\s,)<>.!?]|www\.[^\s,)<>]+[^\s,)<>.!?])/gi;
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = urlPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }
    const url = match[0];
    const href = url.startsWith("http") ? url : `https://${url}`;
    result.push(
      <a
        key={`l-${match.index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-[#2764FF] hover:text-[#21B8CD] underline underline-offset-2 break-all transition-colors"
      >
        {url}
      </a>
    );
    lastIndex = urlPattern.lastIndex;
  }
  if (lastIndex < text.length) {
    result.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }
  return result;
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

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

function isToday(dateStr: string): boolean {
  if (dateStr === "SAVE THE DATE") return false;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return dateStr === today;
}

function isUpcoming(dateStr: string, eventTime?: string | null): boolean {
  if (dateStr === "SAVE THE DATE") return true;
  const timeSuffix = eventTime ? `T${eventTime}:00` : "T23:59:59";
  const eventDate = new Date(dateStr + timeSuffix);
  return eventDate >= new Date();
}

function isPast(dateStr: string, eventTime?: string | null): boolean {
  if (dateStr === "SAVE THE DATE") return false;
  // An event that's today is "live", not "past"
  if (isToday(dateStr)) return false;
  const timeSuffix = eventTime ? `T${eventTime}:00` : "T23:59:59";
  return new Date(dateStr + timeSuffix) < new Date();
}

const fileTypeColors: Record<string, string> = {
  pdf: "text-red-400 bg-red-400/10",
  doc: "text-blue-400 bg-blue-400/10",
  docx: "text-blue-400 bg-blue-400/10",
  ppt: "text-orange-400 bg-orange-400/10",
  pptx: "text-orange-400 bg-orange-400/10",
  xls: "text-green-400 bg-green-400/10",
  xlsx: "text-green-400 bg-green-400/10",
  txt: "text-gray-400 bg-gray-400/10",
};

export default function EventsPage() {
  const { data: session } = useSession();
  const isAuthenticated = !!(session?.user as { id?: string } | undefined)?.id;
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventPolls, setEventPolls] = useState<PollResult[]>([]);
  const [pollsLoading, setPollsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEvents(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load poll results when viewing a past event detail
  useEffect(() => {
    if (!selectedEventId) {
      setEventPolls([]);
      return;
    }
    const ev = events.find((e) => e.id === selectedEventId);
    if (!ev || !isPast(ev.event_date, ev.event_time)) return;

    setPollsLoading(true);
    fetch(`/api/conference/polls?event_id=${selectedEventId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Only show closed polls (non-active)
          setEventPolls(data.filter((p: PollResult & { is_active?: boolean }) => !p.is_active));
        }
      })
      .catch(() => {})
      .finally(() => setPollsLoading(false));
  }, [selectedEventId, events]);

  const sortDate = (d: string) => {
    if (d === "SAVE THE DATE") return Infinity;
    const ts = new Date(d).getTime();
    return isNaN(ts) ? Infinity : ts;
  };

  // Three-way split: Live (today), Upcoming (future), Past (before today)
  const liveEvents = events
    .filter((e) => isToday(e.event_date))
    .sort((a, b) => sortDate(a.event_date) - sortDate(b.event_date));
  const upcomingEvents = events
    .filter((e) => !isToday(e.event_date) && isUpcoming(e.event_date, e.event_time))
    .sort((a, b) => sortDate(a.event_date) - sortDate(b.event_date));
  const pastEvents = events
    .filter((e) => isPast(e.event_date, e.event_time))
    .sort((a, b) => sortDate(b.event_date) - sortDate(a.event_date));

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2764FF]/5 via-transparent to-transparent pointer-events-none" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 max-w-4xl mx-auto text-center"
        >
          <motion.div variants={fadeUp} custom={0}>
            <Badge variant="blue" className="mb-6">
              Upcoming &amp; Past Events
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="font-display text-4xl md:text-6xl font-bold text-klo-text leading-tight"
          >
            Events
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-6 text-lg md:text-xl text-klo-muted max-w-2xl mx-auto leading-relaxed"
          >
            Conferences, keynotes, and workshops where Keith shares insights on
            AI, leadership, and digital transformation.
          </motion.p>
        </motion.div>
      </section>

      {/* Live Events — only visible when today matches an event date */}
      {liveEvents.length > 0 && (
        <section className="px-6 pt-0 pb-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeUp} custom={0} className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Radio size={20} className="text-emerald-400" />
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-klo-text">
                  Live Events
                </h2>
              </div>
              <p className="text-klo-muted">
                Events happening today.
              </p>
            </motion.div>
            <div className="space-y-4">
              {liveEvents.map((event, i) => (
                <motion.div key={event.id} variants={fadeUp} custom={i + 1}>
                  <Card className="relative overflow-hidden border-emerald-500/40 shadow-lg shadow-emerald-500/5 bg-gradient-to-br from-emerald-500/5 to-transparent">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-[#2764FF] rounded-l-xl" />
                    <div className="pl-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="green">Live Now</Badge>
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-klo-text">
                        {event.display_name_mode === "session" && event.session_name
                          ? event.session_name
                          : event.conference_name}
                      </h3>
                      <p className="text-sm md:text-base text-klo-muted leading-relaxed">
                        {event.display_name_mode === "session" && event.session_name
                          ? event.conference_name
                          : event.title}
                      </p>
                      {event.description && (
                        <p className="text-sm text-klo-muted/70 leading-relaxed">
                          {linkifyText(event.description)}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-klo-muted pt-1">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar size={14} className="text-emerald-400" />
                          {formatDateRange(event.start_date, event.end_date, event.event_date)}
                          {event.event_time && ` at ${formatTime(event.event_time)}`}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={14} className="text-emerald-400" />
                          {event.conference_location}
                        </span>
                      </div>
                      <div className="pt-2 flex flex-wrap gap-3">
                        <Link
                          href={event.slug ? `/conference/${event.slug}` : "/conference"}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-semibold text-sm rounded-lg hover:brightness-110 transition-colors"
                        >
                          Join Session
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedEventId(null)}>
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-[#161B22] border border-white/10 p-6 space-y-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedEventId(null)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5 text-klo-muted hover:text-klo-text transition-colors">
              <X size={18} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-klo-text pr-10">
                {selectedEvent.display_name_mode === "session" && selectedEvent.session_name
                  ? selectedEvent.session_name
                  : selectedEvent.title}
              </h2>
              {selectedEvent.display_name_mode === "session" && selectedEvent.session_name ? (
                <p className="text-sm text-klo-muted mt-1">{selectedEvent.conference_name}</p>
              ) : selectedEvent.conference_name !== selectedEvent.title ? (
                <p className="text-sm text-klo-muted mt-1">{selectedEvent.conference_name}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-klo-muted mt-3">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={12} className="text-[#2764FF]/70" />
                  {formatDateRange(selectedEvent.start_date, selectedEvent.end_date, selectedEvent.event_date)}
                  {selectedEvent.event_time && ` at ${formatTime(selectedEvent.event_time)}`}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={12} className="text-[#2764FF]/70" />
                  {selectedEvent.conference_location}
                </span>
                {selectedEvent.room_location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={12} className="text-klo-gold/70" />
                    Room: {selectedEvent.room_location}
                  </span>
                )}
              </div>
            </div>

            {/* Notes/Description */}
            {(selectedEvent.notes || selectedEvent.description) && (
              <div className="border-t border-white/5 pt-4">
                <h3 className="text-sm font-semibold text-klo-text mb-2">Details</h3>
                <p className="text-sm text-klo-muted leading-relaxed whitespace-pre-wrap">
                  {linkifyText(selectedEvent.notes || selectedEvent.description || "")}
                </p>
              </div>
            )}

            {/* Presentation Files */}
            {selectedEvent.event_files?.length > 0 && (
              <div className="border-t border-white/5 pt-4">
                <p className="text-sm font-semibold text-klo-text mb-3 flex items-center gap-1.5">
                  <FileText size={14} />
                  Presentations & Materials
                </p>
                <div className="space-y-2">
                  {selectedEvent.event_files.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${fileTypeColors[file.file_type] ?? "text-klo-muted bg-white/5"}`}>
                        {file.file_type}
                      </span>
                      <span className="text-sm text-klo-text truncate flex-1">{file.file_name}</span>
                      {file.file_size && <span className="text-[10px] text-klo-muted/60">{file.file_size}</span>}
                      {isAuthenticated ? (
                        <div className="flex items-center gap-2">
                          <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2764FF]/10 text-[#2764FF] text-xs font-medium rounded-lg hover:bg-[#2764FF]/20 transition">
                            <Eye size={12} /> Preview
                          </a>
                          <a href={file.file_url} download className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-klo-muted text-xs font-medium rounded-lg hover:bg-white/10 hover:text-klo-text transition">
                            <Download size={12} /> Download
                          </a>
                        </div>
                      ) : (
                        <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-klo-muted text-xs rounded-lg hover:bg-white/10 transition">
                          <Eye size={12} /> View Only
                        </a>
                      )}
                    </div>
                  ))}
                  {!isAuthenticated && (
                    <p className="text-xs text-klo-muted mt-2 flex items-center gap-1.5">
                      <Lock size={12} />
                      <Link href="/auth/signin" className="text-[#2764FF] hover:underline">Sign in</Link> to download files
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Poll Results (past events only) */}
            {isPast(selectedEvent.event_date, selectedEvent.event_time) && (
              <div className="border-t border-white/5 pt-4">
                <p className="text-sm font-semibold text-klo-text mb-3 flex items-center gap-1.5">
                  <BarChart3 size={14} />
                  Poll Results
                </p>
                {pollsLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
                  </div>
                ) : eventPolls.length === 0 ? (
                  <p className="text-xs text-klo-muted">No poll results for this event.</p>
                ) : (
                  <div className="space-y-4">
                    {eventPolls.map((poll) => (
                      <div key={poll.id} className="rounded-xl bg-white/[0.02] border border-white/5 p-4 space-y-3">
                        <p className="text-sm font-medium text-klo-text">{poll.question}</p>
                        <div className="space-y-2">
                          {poll.options.map((option, idx) => {
                            const votes = poll.votes?.[idx] ?? 0;
                            const pct = poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0;
                            const isLeading = votes === Math.max(...(poll.votes || [])) && votes > 0;
                            return (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className={isLeading ? "text-klo-gold font-medium" : "text-klo-muted"}>{option}</span>
                                  <span className={isLeading ? "text-klo-gold font-medium" : "text-klo-muted"}>{pct}% ({votes})</span>
                                </div>
                                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                  <div className={`h-full rounded-full transition-all ${isLeading ? "bg-klo-gold" : "bg-[#2764FF]/50"}`} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[10px] text-klo-muted/60 pt-1">
                          <span>{poll.totalVotes} total vote{poll.totalVotes !== 1 ? "s" : ""}</span>
                          {poll.closed_at && <span>Closed {new Date(poll.closed_at).toLocaleString()}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
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
                <Sparkles size={20} className="text-[#2764FF]" />
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-klo-text">
                Upcoming Events
              </h2>
            </div>
            <p className="text-klo-muted">
              Don&apos;t miss these upcoming opportunities to connect with Keith.
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
            </div>
          ) : upcomingEvents.length === 0 ? (
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
              <Card>
                <p className="text-klo-muted text-sm text-center py-6">
                  No upcoming events at this time. Check back soon!
                </p>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-4"
            >
              {upcomingEvents.map((event, i) => (
                <motion.div key={event.id} variants={fadeUp} custom={i + 1}>
                  <EventCard event={event} isLive={isToday(event.event_date)} onViewDetails={setSelectedEventId} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Past Events */}
      {pastEvents.length > 0 && (
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
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <CalendarDays size={20} className="text-klo-muted" />
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-klo-text">
                  Past Events
                </h2>
              </div>
              <p className="text-klo-muted">
                Browse recordings, slides, and materials from previous events.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-4"
            >
              {pastEvents.map((event, i) => (
                <motion.div key={event.id} variants={fadeUp} custom={i + 1}>
                  <EventCard event={event} isPastEvent onViewDetails={setSelectedEventId} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>
      )}

      {/* CTA */}
      <section className="px-6 py-16 md:py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={fadeUp}
          custom={0}
          className="max-w-2xl mx-auto text-center"
        >
          <h3 className="font-display text-2xl md:text-3xl font-bold text-klo-text mb-4">
            Want Keith at Your Event?
          </h3>
          <p className="text-klo-muted text-sm leading-relaxed mb-6">
            Keith is available for keynotes, workshops, and panel discussions on
            AI, digital transformation, and faith-driven innovation.
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-semibold text-sm rounded-lg hover:brightness-110 transition-colors"
          >
            Invite Keith To Speak
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}

function EventCard({
  event,
  isPastEvent,
  isLive,
  onViewDetails,
}: {
  event: EventItem;
  isPastEvent?: boolean;
  isLive?: boolean;
  onViewDetails?: (id: string) => void;
}) {
  const files = event.event_files ?? [];
  const hasFiles = files.length > 0;

  return (
    <Card className="relative overflow-hidden">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-klo-text">
                {event.display_name_mode === "session" && event.session_name
                  ? event.session_name
                  : event.title}
              </h3>
              {isPastEvent && <Badge variant="muted">Past</Badge>}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nativeShare({
                    title: event.title,
                    text: event.conference_name,
                    url: event.website_url || "https://keithlodom.ai/events",
                  });
                }}
                className="ml-auto shrink-0 w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-klo-muted hover:text-[#2764FF] hover:border-[#2764FF]/30 hover:bg-[#2764FF]/10 transition-colors"
                aria-label="Share event"
              >
                <Share2 size={14} />
              </button>
            </div>
            {event.display_name_mode === "session" && event.session_name ? (
              <p className="text-sm text-klo-muted leading-relaxed">
                {event.conference_name}
              </p>
            ) : event.conference_name !== event.title ? (
              <p className="text-sm text-klo-muted leading-relaxed">
                {event.conference_name}
              </p>
            ) : null}
            {event.description && (
              <p className="text-sm text-klo-muted/70 leading-relaxed">
                {linkifyText(event.description)}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-klo-muted pt-1">
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={12} className="text-[#2764FF]/70" />
                {formatDateRange(event.start_date, event.end_date, event.event_date)}
                {event.event_time && ` at ${formatTime(event.event_time)}`}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={12} className="text-[#2764FF]/70" />
                {event.conference_location}
              </span>
            </div>
            {event.website_url && (
              <a
                href={event.website_url.startsWith("http") ? event.website_url : `https://${event.website_url}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-[#2764FF]/10 border border-[#2764FF]/20 text-[#2764FF] hover:bg-[#2764FF]/20 hover:text-[#21B8CD] text-sm font-medium transition-colors cursor-pointer"
              >
                <ExternalLink size={14} />
                Visit Website
              </a>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            {/* View More Details — shows notes content in modal */}
            <button
              onClick={() => onViewDetails?.(event.id)}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/10 text-klo-muted font-semibold text-sm rounded-lg hover:border-[#2764FF]/30 hover:text-[#2764FF] transition-colors"
            >
              View More Details
              <ChevronDown size={14} />
            </button>
            {!isPastEvent && isLive && (
              <Link
                href={event.slug ? `/conference/${event.slug}` : "/conference"}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-semibold text-sm rounded-lg hover:brightness-110 transition-colors"
              >
                Join Event
                <ArrowRight size={14} />
              </Link>
            )}
            {!isPastEvent && !isLive && (
              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 text-klo-muted/50 border border-white/5 font-semibold text-sm rounded-lg cursor-not-allowed">
                Join Event
                <ArrowRight size={14} />
              </span>
            )}
            {/* Past event presentation CTA */}
            {isPastEvent && (
              <button
                onClick={() => hasFiles ? onViewDetails?.(event.id) : undefined}
                disabled={!hasFiles}
                className={`inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-lg transition-colors ${
                  hasFiles
                    ? "bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white hover:brightness-110 cursor-pointer"
                    : "bg-white/5 text-klo-muted/50 border border-white/5 cursor-not-allowed"
                }`}
              >
                <FileText size={14} />
                {hasFiles ? "View Presentation" : "No Presentation"}
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
