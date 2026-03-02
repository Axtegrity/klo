"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

const trendingTopics = [
  { label: "AI Regulation", category: "ai-regulation" },
  { label: "Church Tech", category: "church-tech" },
  { label: "Cybersecurity", category: "cybersecurity" },
  { label: "Digital Ethics", category: "digital-ethics" },
  { label: "AI in Education", category: "ai-education" },
];

export default function TrendingTopics() {
  return (
    <section>
      {/* Section heading */}
      <div className="flex items-center gap-4 mb-8">
        <span className="w-8 h-0.5 bg-klo-gold rounded-full" />
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-klo-text">
          Trending in Tech &amp; Faith
        </h2>
      </div>

      {/* Topics */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: "easeOut" as const }}
      >
        <div className="bg-klo-dark border border-klo-slate rounded-xl p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-klo-gold" />
            <p className="text-xs font-semibold text-klo-muted uppercase tracking-wider">
              Popular this week
            </p>
          </div>

          {/* Mobile: horizontal scroll / Desktop: flex wrap grid */}
          <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0 sm:flex-wrap scrollbar-thin">
            {trendingTopics.map((topic) => (
              <Link
                key={topic.category}
                href={`/feed?category=${topic.category}`}
                className="shrink-0 inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-full border border-klo-slate bg-klo-slate/50 text-klo-text transition-all duration-200 hover:border-klo-gold/30 hover:bg-klo-gold/10 hover:text-klo-gold active:scale-[0.97]"
              >
                {topic.label}
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
