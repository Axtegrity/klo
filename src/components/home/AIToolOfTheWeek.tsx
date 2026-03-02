"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Wrench, ArrowRight, Star } from "lucide-react";

const mockTool = {
  name: "NotebookLM by Google",
  category: "Productivity",
  description:
    "Google's AI-powered research assistant transforms your documents into interactive study guides, podcasts, and Q&A sessions. Upload PDFs, articles, or notes and let AI synthesize the key insights for you.",
  whyItMatters:
    "For pastors preparing sermons, executives digesting reports, or board members reviewing governance docs, NotebookLM cuts research time by up to 70% while preserving source fidelity.",
  link: "/feed?category=productivity",
};

export default function AIToolOfTheWeek() {
  return (
    <section>
      {/* Section heading */}
      <div className="flex items-center gap-4 mb-8">
        <span className="w-8 h-0.5 bg-klo-gold rounded-full" />
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-klo-text">
          AI Tool of the Week
        </h2>
      </div>

      {/* Tool card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: "easeOut" as const }}
      >
        <div className="relative bg-klo-dark border border-klo-slate rounded-xl p-6 sm:p-8 lg:p-10 overflow-hidden">
          {/* Decorative gradient corner */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-klo-gold/5 to-transparent rounded-bl-full pointer-events-none" />

          <div className="relative z-10">
            {/* Header row */}
            <div className="flex items-start gap-4 mb-5">
              {/* Icon */}
              <div className="hidden sm:flex shrink-0 w-12 h-12 items-center justify-center rounded-lg bg-klo-slate">
                <Wrench className="w-5 h-5 text-klo-gold" />
              </div>

              <div className="flex-1 min-w-0">
                {/* Badges row */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center px-3 py-1 text-xs font-semibold tracking-wide uppercase rounded-full bg-klo-slate text-klo-gold">
                    {mockTool.category}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold tracking-wide uppercase rounded-full bg-klo-gold/15 text-klo-gold border border-klo-gold/20">
                    <Star className="w-3 h-3" />
                    Keith&apos;s Pick
                  </span>
                </div>

                {/* Tool name */}
                <h3 className="text-xl sm:text-2xl font-semibold text-klo-text leading-snug">
                  {mockTool.name}
                </h3>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base text-klo-muted leading-relaxed mb-4 max-w-3xl">
              {mockTool.description}
            </p>

            {/* Why it matters */}
            <div className="bg-klo-navy/50 border border-klo-slate/50 rounded-lg p-4 mb-6">
              <p className="text-xs font-semibold text-klo-gold uppercase tracking-wider mb-1.5">
                Why It Matters
              </p>
              <p className="text-sm text-klo-muted leading-relaxed">
                {mockTool.whyItMatters}
              </p>
            </div>

            {/* CTA */}
            <Link
              href={mockTool.link}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-klo-gold hover:gap-2.5 transition-all duration-200"
            >
              Learn More
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
