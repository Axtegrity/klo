"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Wrench, ArrowRight, Star } from "lucide-react";
import type { ToolConfig } from "@/lib/page-config-server";

const DEFAULTS: ToolConfig = {
  name: "NotebookLM by Google",
  category: "Productivity",
  description:
    "Google's AI-powered research assistant transforms your documents into interactive study guides, podcasts, and Q&A sessions. Upload PDFs, articles, or notes and let AI synthesize the key insights for you.",
  why: "For pastors preparing sermons, executives digesting reports, or board members reviewing governance docs, NotebookLM cuts research time significantly while preserving source fidelity.",
  link: "https://notebooklm.google.com",
};

interface AIToolOfTheWeekProps {
  toolConfig?: ToolConfig | null;
}

export default function AIToolOfTheWeek({ toolConfig }: AIToolOfTheWeekProps = {}) {
  const tool = toolConfig ?? DEFAULTS;
  return (
    <section>
      {/* Section heading */}
      <div className="flex items-center gap-4 mb-8">
        <span className="w-10 h-1 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] rounded-full" />
        <h2 className="font-display text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#E6EDF3] to-[#8B949E] bg-clip-text text-transparent uppercase tracking-wide">
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
        <div className="group relative bg-[#161B22] border border-[#21262D] rounded-xl p-6 sm:p-8 lg:p-10 overflow-hidden transition-all duration-300 hover:border-[#2764FF]/30 hover:shadow-[0_0_30px_rgba(39,100,255,0.1)]">
          {/* Subtle background watermark image */}
          <div className="absolute inset-0 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500">
            <Image src="/images/keith/d.jpg" alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          </div>
          {/* Left accent bar */}
          <div className="absolute left-0 top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#2764FF] to-[#21B8CD] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
          {/* Decorative gradient corner */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#2764FF]/5 to-transparent rounded-bl-full pointer-events-none" />

          <div className="relative z-10">
            {/* Header row */}
            <div className="flex items-start gap-4 mb-5">
              {/* Icon */}
              <div className="hidden sm:flex shrink-0 w-12 h-12 items-center justify-center rounded-xl bg-[#21262D]">
                <Wrench className="w-5 h-5 text-[#21B8CD]" />
              </div>

              <div className="flex-1 min-w-0">
                {/* Badges row */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center px-3 py-1 text-xs font-semibold tracking-wide uppercase rounded-full bg-[#21262D] text-[#21B8CD]">
                    {tool.category}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold tracking-wide uppercase rounded-full bg-[#C8A84E]/15 text-[#C8A84E] border border-[#C8A84E]/20">
                    <Star className="w-3 h-3" />
                    Keith&apos;s Pick
                  </span>
                </div>

                {/* Tool name */}
                <h3 className="text-xl sm:text-2xl font-semibold text-[#E6EDF3] leading-snug">
                  {tool.name}
                </h3>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base text-[#8B949E] leading-relaxed mb-4 max-w-3xl">
              {tool.description}
            </p>

            {/* Why it matters */}
            <div className="bg-[#0D1117]/60 border border-[#21262D]/50 rounded-xl p-4 mb-6">
              <p className="text-xs font-semibold text-[#21B8CD] uppercase tracking-wider mb-1.5">
                Why It Matters
              </p>
              <p className="text-sm text-[#8B949E] leading-relaxed">
                {tool.why}
              </p>
            </div>

            {/* CTA */}
            <Link
              href={tool.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2764FF] hover:underline hover:gap-2.5 transition-all duration-200"
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
