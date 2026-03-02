"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowRight } from "lucide-react";

const mockEvent = {
  date: "April 18, 2026",
  name: "Future of Faith & Technology Summit",
  location: "Atlanta, GA",
};

export default function UpcomingKeynote() {
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
          className="relative rounded-2xl overflow-hidden border border-[#21262D]"
        >
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url(/images/keith/c.jpg)" }}
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D1117]/95 via-[#0D1117]/85 to-[#0D1117]/70" />

          <div className="relative z-10 flex flex-col sm:flex-row">
            {/* Cyan left accent bar */}
            <div className="hidden sm:block w-1.5 bg-gradient-to-b from-[#2764FF] to-[#21B8CD] shrink-0" />
            {/* Mobile top accent bar */}
            <div className="sm:hidden h-1 bg-gradient-to-r from-[#2764FF] to-[#21B8CD]" />

            {/* Content */}
            <div className="flex-1 p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              {/* Event details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-[#21B8CD] font-medium">
                  <Calendar className="w-4 h-4" />
                  <span className="font-mono tracking-wide">{mockEvent.date}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#E6EDF3]">
                  {mockEvent.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-[#8B949E]">
                  <MapPin className="w-4 h-4" />
                  <span>{mockEvent.location}</span>
                </div>
              </div>

              {/* CTA */}
              <Link
                href="/booking"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-bold text-sm uppercase tracking-wider rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-[#2764FF]/25 hover:scale-105 active:scale-[0.98] shrink-0 w-full sm:w-auto"
              >
                Request Keith to Speak
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
