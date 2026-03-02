"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Users, ArrowRight, Shield } from "lucide-react";

const mockSession = {
  title: "AI Governance Playbook: Building Your 90-Day Roadmap",
  date: "March 20, 2026",
  description:
    "Join Keith for an interactive strategy session where we build a practical AI governance framework tailored to your organization. Walk away with a concrete 90-day action plan.",
  seatsRemaining: 4,
  totalSeats: 12,
  tier: "Pro" as const,
};

export default function UpcomingStrategyRoom() {
  return (
    <section>
      {/* Section heading */}
      <div className="flex items-center gap-4 mb-8">
        <span className="w-8 h-0.5 bg-klo-gold rounded-full" />
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-klo-text">
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
        <div className="relative bg-klo-dark border border-klo-slate rounded-xl overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            {/* Gold left accent bar */}
            <div className="hidden sm:block w-1.5 bg-klo-gold shrink-0" />
            {/* Mobile top accent bar */}
            <div className="sm:hidden h-1 bg-klo-gold" />

            {/* Content */}
            <div className="flex-1 p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Details */}
                <div className="space-y-4 flex-1 min-w-0">
                  {/* Badges row */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-klo-gold font-medium">
                      <Calendar className="w-4 h-4" />
                      <span>{mockSession.date}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold tracking-wide uppercase rounded-full bg-klo-gold/15 text-klo-gold border border-klo-gold/20">
                      <Shield className="w-3 h-3" />
                      {mockSession.tier}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-semibold text-klo-text leading-snug">
                    {mockSession.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-klo-muted leading-relaxed max-w-2xl">
                    {mockSession.description}
                  </p>

                  {/* Seats indicator */}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-klo-muted" />
                    <span className="text-sm text-klo-muted">
                      <span className="text-klo-gold font-semibold">
                        {mockSession.seatsRemaining}
                      </span>{" "}
                      of {mockSession.totalSeats} seats remaining
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href="/strategy-rooms"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-klo-gold text-klo-navy font-semibold text-sm tracking-wide rounded-lg transition-all duration-300 hover:bg-klo-gold-light hover:shadow-lg hover:shadow-klo-gold/20 active:scale-[0.98] shrink-0 w-full sm:w-auto lg:w-auto"
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
