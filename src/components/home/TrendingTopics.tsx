"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import type { TrendingConfig } from "@/lib/page-config-server";

const TOPIC_COLORS = [
  "border-[#21B8CD]/30 bg-[#21B8CD]/10 text-[#21B8CD] hover:border-[#21B8CD]/60 hover:bg-[#21B8CD]/15",
  "border-[#2764FF]/30 bg-[#2764FF]/10 text-[#2764FF] hover:border-[#2764FF]/60 hover:bg-[#2764FF]/15",
  "border-[#F77A81]/30 bg-[#F77A81]/10 text-[#F77A81] hover:border-[#F77A81]/60 hover:bg-[#F77A81]/15",
  "border-[#C8A84E]/30 bg-[#C8A84E]/10 text-[#C8A84E] hover:border-[#C8A84E]/60 hover:bg-[#C8A84E]/15",
  "border-[#2764FF]/30 bg-[#2764FF]/10 text-[#2764FF] hover:border-[#2764FF]/60 hover:bg-[#2764FF]/15",
];

const DEFAULTS: TrendingConfig = {
  heading: "Trending in Tech & Faith",
  topic1: "AI Regulation",
  topic2: "Church Tech",
  topic3: "Cybersecurity",
  topic4: "Digital Ethics",
  topic5: "AI in Education",
};

interface TrendingTopicsProps {
  trendingConfig?: TrendingConfig | null;
}

export default function TrendingTopics({ trendingConfig }: TrendingTopicsProps = {}) {
  const cfg = trendingConfig ?? DEFAULTS;
  const topics = [cfg.topic1, cfg.topic2, cfg.topic3, cfg.topic4, cfg.topic5].filter(Boolean);
  return (
    <section>
      {/* Section heading */}
      <div className="flex items-center gap-4 mb-8">
        <span className="w-10 h-1 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] rounded-full" />
        <h2 className="font-display text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#E6EDF3] to-[#8B949E] bg-clip-text text-transparent uppercase tracking-wide">
          {cfg.heading}
        </h2>
      </div>

      {/* Topics */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: "easeOut" as const }}
      >
        <div className="group relative bg-[#161B22] border border-[#21262D] rounded-xl p-6 sm:p-8 overflow-hidden transition-all duration-300 hover:border-[#2764FF]/30 hover:shadow-[0_0_30px_rgba(39,100,255,0.1)]">
          {/* Subtle background watermark image */}
          <div className="absolute inset-0 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500">
            <Image src="/images/keith/a.jpg" alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          </div>
          {/* Left accent bar */}
          <div className="absolute left-0 top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#2764FF] to-[#21B8CD] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-[#21B8CD]" />
            <p className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider">
              Popular this week
            </p>
          </div>

          {/* Mobile: horizontal scroll / Desktop: flex wrap grid */}
          <div className="relative z-10 flex gap-3 overflow-x-auto pb-2 sm:pb-0 sm:flex-wrap scrollbar-thin">
            {topics.map((label, i) => (
              <Link
                key={label}
                href={`/feed?category=${encodeURIComponent(label.toLowerCase().replace(/\s+/g, "-"))}`}
                className={`shrink-0 inline-flex items-center px-5 py-3 text-sm font-medium rounded-full border transition-all duration-200 active:scale-[0.97] min-h-[44px] ${TOPIC_COLORS[i % TOPIC_COLORS.length]}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
