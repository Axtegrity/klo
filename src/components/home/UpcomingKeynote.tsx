"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowRight } from "lucide-react";

interface FeaturedEvent {
  id: string;
  title: string;
  conference_name: string;
  conference_location: string;
  event_date: string;
  description: string | null;
}

const fallbackEvent: FeaturedEvent = {
  id: "fallback",
  title: "New Life Leadership Conference — AI and the Future of Ministry",
  conference_name: "New Life Leadership Conference",
  conference_location: "Montgomery, AL",
  event_date: "2026-03-07",
  description: null,
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function UpcomingKeynote() {
  const [event, setEvent] = useState<FeaturedEvent | null>(fallbackEvent);

  useEffect(() => {
    fetch("/api/featured-keynote")
      .then((res) => res.json())
      .then((data) => {
        // Use fetched event if available, otherwise keep fallback
        setEvent(data ?? fallbackEvent);
      })
      .catch(() => {
        // Keep fallback on error
      });
  }, []);

  if (!event) return null;

  return (
    <section>
      {/* Section heading */}
      <div className="flex items-center gap-4 mb-8">
        <span className="w-10 h-1 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] rounded-full" />
        <h2 className="font-display text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#E6EDF3] to-[#8B949E] bg-clip-text text-transparent uppercase tracking-wide">
          Upcoming Keynote
        </h2>
      </div>

      {/* Keynote card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div
          className="group relative rounded-xl overflow-hidden border border-[#21262D] transition-all duration-300 hover:border-[#2764FF]/30 hover:shadow-[0_0_30px_rgba(39,100,255,0.1)]"
        >
          {/* Subtle background watermark image */}
          <div className="absolute inset-0 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-500 bg-cover bg-center"
            style={{ backgroundImage: "url(/images/keith/c.jpg)" }}
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D1117]/95 via-[#0D1117]/85 to-[#0D1117]/70" />
          {/* Left accent bar */}
          <div className="absolute left-0 top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#2764FF] to-[#21B8CD] rounded-full opacity-50 group-hover:opacity-100 transition-opacity z-20" />

          <div className="relative z-10 flex flex-col sm:flex-row">

            {/* Content */}
            <div className="flex-1 p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              {/* Event details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-[#21B8CD] font-medium">
                  <Calendar className="w-4 h-4" />
                  <span className="font-mono tracking-wide">{formatDate(event.event_date)}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#E6EDF3]">
                  {event.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-[#8B949E]">
                  <MapPin className="w-4 h-4" />
                  <span>{event.conference_location}</span>
                </div>
              </div>

              {/* CTA */}
              <Link
                href="/conference"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-bold text-sm uppercase tracking-wider rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-[#2764FF]/25 hover:scale-105 active:scale-[0.98] shrink-0 w-full sm:w-auto"
              >
                Join the Conference
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
