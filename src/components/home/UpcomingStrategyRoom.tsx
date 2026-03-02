"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Users, ArrowRight, Shield } from "lucide-react";

const mockSession = {
  title: "AI Governance for Faith Organizations",
  date: "April 15, 2026",
  description:
    "Explore responsible AI adoption frameworks tailored for faith-based organizations. This session covers ethical AI policies, risk management, and governance structures that align technology decisions with your mission and values.",
  seatsRemaining: 8,
  totalSeats: 20,
  tier: "Executive" as const,
};

export default function UpcomingStrategyRoom() {
  return (
    <section>
      {/* Section heading */}
      <div className="flex items-center gap-4 mb-8">
        <span className="w-10 h-1 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] rounded-full" />
        <h2 className="font-display text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#E6EDF3] to-[#8B949E] bg-clip-text text-transparent uppercase tracking-wide">
          Next Strategy Room
        </h2>
      </div>

      {/* Strategy room card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: "easeOut" as const }}
      >
        <div className="relative bg-[#161B22] border border-[#21262D] rounded-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            {/* Cyan left accent bar */}
            <div className="hidden sm:block w-1.5 bg-gradient-to-b from-[#2764FF] to-[#21B8CD] shrink-0" />
            {/* Mobile top accent bar */}
            <div className="sm:hidden h-1 bg-gradient-to-r from-[#2764FF] to-[#21B8CD]" />

            {/* Content */}
            <div className="flex-1 p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Details */}
                <div className="space-y-4 flex-1 min-w-0">
                  {/* Badges row */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-[#21B8CD] font-medium">
                      <Calendar className="w-4 h-4" />
                      <span className="font-mono tracking-wide">{mockSession.date}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold tracking-wide uppercase rounded-full bg-[#C8A84E]/15 text-[#C8A84E] border border-[#C8A84E]/20">
                      <Shield className="w-3 h-3" />
                      {mockSession.tier}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-semibold text-[#E6EDF3] leading-snug">
                    {mockSession.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-[#8B949E] leading-relaxed max-w-2xl">
                    {mockSession.description}
                  </p>

                  {/* Seats indicator */}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#8B949E]" />
                    <span className="text-sm text-[#8B949E]">
                      <span className="text-[#21B8CD] font-semibold">
                        {mockSession.seatsRemaining}
                      </span>{" "}
                      of {mockSession.totalSeats} seats remaining
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href="/strategy-rooms"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-bold text-sm uppercase tracking-wider rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-[#2764FF]/25 hover:scale-105 active:scale-[0.98] shrink-0 w-full sm:w-auto lg:w-auto"
                >
                  Register
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
