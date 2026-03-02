"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { FileText, ArrowRight } from "lucide-react";

const mockBrief = {
  title: "The AI Executive Order: What Leaders Need to Know in 2026",
  date: "February 24, 2026",
  excerpt:
    "A concise breakdown of the latest federal guidance on AI governance, what it means for enterprise leaders, and three action steps every organization should take this quarter.",
  slug: "/vault/executives-ai-briefing-q1-2026",
};

export default function LatestBrief() {
  return (
    <section>
      {/* Section heading */}
      <div className="flex items-center gap-4 mb-8">
        <span className="w-10 h-1 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] rounded-full" />
        <h2 className="font-display text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#E6EDF3] to-[#8B949E] bg-clip-text text-transparent uppercase tracking-wide">
          Latest Intelligence Brief
        </h2>
      </div>

      {/* Brief card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Link href={mockBrief.slug} className="block group">
          <div className="relative bg-[#161B22] border border-[#21262D] rounded-xl p-6 sm:p-8 transition-all duration-300 group-hover:-translate-y-1 hover:border-[#2764FF]/30 hover:shadow-[0_0_30px_rgba(39,100,255,0.1)] overflow-hidden">
            {/* Subtle background watermark image */}
            <div className="absolute inset-0 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500">
              <Image src="/images/keith/b.jpg" alt="" fill className="object-cover" />
            </div>
            {/* Left accent bar */}
            <div className="absolute left-0 top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#2764FF] to-[#21B8CD] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex items-start gap-4">
              {/* Icon */}
              <div className="hidden sm:flex shrink-0 w-12 h-12 items-center justify-center rounded-xl bg-[#21262D]">
                <FileText className="w-5 h-5 text-[#21B8CD]" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#8B949E] uppercase tracking-wider mb-2">
                  {mockBrief.date}
                </p>
                <h3 className="text-lg sm:text-xl font-semibold text-[#E6EDF3] mb-3 group-hover:text-[#21B8CD] transition-colors duration-200">
                  {mockBrief.title}
                </h3>
                <p className="text-sm text-[#8B949E] leading-relaxed line-clamp-2 mb-4">
                  {mockBrief.excerpt}
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2764FF] hover:underline group-hover:gap-2.5 transition-all duration-200">
                  Read More
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </section>
  );
}
