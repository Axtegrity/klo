"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import type { InsightConfig } from "@/lib/page-config-server";

const DEFAULTS: InsightConfig = {
  category: "AI & Ethics",
  title: "Navigating the Moral Frontier of Generative AI in Ministry",
  description:
    "As generative AI tools become ubiquitous, faith-based organizations face unique ethical questions. This deep-dive explores frameworks for responsible AI adoption that honor both innovation and integrity, covering data stewardship, bias mitigation, and congregational transparency.",
  link: "/vault/moral-frontier-gen-ai-ministry",
  cta: "Read in the Vault",
};

interface FeaturedInsightProps {
  backgroundImage?: string | null;
  insightConfig?: InsightConfig | null;
}

export default function FeaturedInsight({ backgroundImage, insightConfig }: FeaturedInsightProps = {}) {
  const insight = insightConfig ?? DEFAULTS;
  // Fall back to the original hardcoded watermark when no admin override is set
  const watermarkSrc = backgroundImage ?? "/images/keith/a.jpg";

  return (
    <section>
      {/* Section heading */}
      <div className="flex items-center gap-4 mb-8">
        <span className="w-10 h-1 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] rounded-full" />
        <h2 className="font-display text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#E6EDF3] to-[#8B949E] bg-clip-text text-transparent uppercase tracking-wide">
          Featured Insight
        </h2>
      </div>

      {/* Insight card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Link href={insight.link} className="block group">
          <div className="relative bg-[#161B22] border border-[#21262D] rounded-xl p-6 sm:p-8 lg:p-10 transition-all duration-300 group-hover:-translate-y-1 hover:border-[#2764FF]/30 hover:shadow-[0_0_30px_rgba(39,100,255,0.1)] overflow-hidden">
            {/* Subtle background watermark image — admin-overridable via page_configs.home.section_images */}
            <div className="absolute inset-0 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500">
              <Image src={watermarkSrc} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            {/* Left accent bar */}
            <div className="absolute left-0 top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#2764FF] to-[#21B8CD] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
            {/* Decorative gradient corner */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#2764FF]/5 to-transparent rounded-bl-full pointer-events-none" />

            <div className="relative z-10">
              {/* Badges row */}
              <div className="flex items-center gap-3 mb-4">
                {/* Category badge */}
                <span className="inline-flex items-center px-3 py-1 text-xs font-semibold tracking-wide uppercase rounded-full bg-[#21262D] text-[#21B8CD]">
                  {insight.category}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold tracking-wide uppercase rounded-full bg-[#C8A84E]/15 text-[#C8A84E] border border-[#C8A84E]/20">
                  <Sparkles className="w-3 h-3" />
                  Premium
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-semibold text-[#E6EDF3] mb-4 group-hover:text-[#21B8CD] transition-colors duration-200 leading-snug">
                {insight.title}
              </h3>

              {/* Description */}
              <p className="text-sm sm:text-base text-[#8B949E] leading-relaxed mb-6 max-w-3xl">
                {insight.description}
              </p>

              {/* Arrow link */}
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2764FF] hover:underline group-hover:gap-2.5 transition-all duration-200">
                {insight.cta}
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    </section>
  );
}
