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
} from "lucide-react";
import Badge from "@/components/shared/Badge";
import Card from "@/components/shared/Card";

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
  conference_name: string;
  conference_location: string;
  event_date: string;
  description: string | null;
  is_featured: boolean;
  event_files: EventFile[];
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

function isUpcoming(dateStr: string): boolean {
  const eventDate = new Date(dateStr + "T23:59:59");
  return eventDate >= new Date();
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
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const upcomingEvents = events
    .filter((e) => isUpcoming(e.event_date))
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  const pastEvents = events
    .filter((e) => !isUpcoming(e.event_date))
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

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
            <motion.div variants={fadeUp} custom={1}>
              <Card>
                <p className="text-klo-muted text-sm text-center py-6">
                  No upcoming events at this time. Check back soon!
                </p>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event, i) => (
                <motion.div key={event.id} variants={fadeUp} custom={i + 1}>
                  <EventCard event={event} />
                </motion.div>
              ))}
            </div>
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

            <div className="space-y-4">
              {pastEvents.map((event, i) => (
                <motion.div key={event.id} variants={fadeUp} custom={i + 1}>
                  <EventCard event={event} isPast />
                </motion.div>
              ))}
            </div>
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

function EventCard({ event, isPast }: { event: EventItem; isPast?: boolean }) {
  const files = event.event_files ?? [];

  return (
    <Card
      className={`relative overflow-hidden ${
        event.is_featured && !isPast
          ? "border-[#2764FF]/40 shadow-lg shadow-[#2764FF]/5"
          : ""
      }`}
    >
      {event.is_featured && !isPast && (
        <div className="absolute top-0 left-0 w-1 h-full bg-klo-gold rounded-l-xl" />
      )}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-klo-text">
                {event.conference_name}
              </h3>
              {event.is_featured && !isPast && (
                <Badge variant="gold">Featured</Badge>
              )}
              {isPast && <Badge variant="muted">Past</Badge>}
            </div>
            <p className="text-sm text-klo-muted leading-relaxed">
              {event.title}
            </p>
            {event.description && (
              <p className="text-sm text-klo-muted/70 leading-relaxed">
                {event.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-klo-muted pt-1">
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={12} className="text-[#2764FF]/70" />
                {formatDate(event.event_date)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={12} className="text-[#2764FF]/70" />
                {event.conference_location}
              </span>
            </div>
          </div>
          {!isPast && (
            <Link
              href="/conference"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-semibold text-sm rounded-lg hover:brightness-110 transition-colors"
            >
              Join Event
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {/* Presentation Files */}
        {files.length > 0 && (
          <div className="border-t border-white/5 pt-3">
            <p className="text-xs text-klo-muted font-medium mb-2 flex items-center gap-1.5">
              <FileText size={12} />
              Presentations &amp; Materials
            </p>
            <div className="flex flex-wrap gap-2">
              {files.map((file) => (
                <a
                  key={file.id}
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 hover:border-[#2764FF]/30 hover:bg-[#2764FF]/5 transition-colors group"
                >
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      fileTypeColors[file.file_type] ?? "text-klo-muted bg-white/5"
                    }`}
                  >
                    {file.file_type}
                  </span>
                  <span className="text-xs text-klo-muted group-hover:text-klo-text transition-colors truncate max-w-[200px]">
                    {file.file_name}
                  </span>
                  {file.file_size && (
                    <span className="text-[10px] text-klo-muted/60">
                      {file.file_size}
                    </span>
                  )}
                  <Download size={12} className="text-klo-muted/50 group-hover:text-[#2764FF] transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
