"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const mockInsight = {
  category: "AI & Ethics",
  title: "Navigating the Moral Frontier of Generative AI in Ministry",
  description:
    "As generative AI tools become ubiquitous, faith-based organizations face unique ethical questions. This deep-dive explores frameworks for responsible AI adoption that honor both innovation and integrity, covering data stewardship, bias mitigation, and congregational transparency.",
  isPremium: true,
  slug: "/vault/moral-frontier-gen-ai-ministry",
};

export default function FeaturedInsight() {
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
        <Link href={mockInsight.slug} className="block group">
          <div className="relative bg-[#161B22] border border-[#21262D] rounded-2xl p-6 sm:p-8 lg:p-10 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-[#2764FF]/10 group-hover:border-[#2764FF]/30 overflow-hidden">
            {/* Background accent image */}
            <div
              className="absolute top-0 right-0 w-72 h-72 opacity-10 pointer-events-none bg-cover bg-center rounded-bl-full"
              style={{ backgroundImage: "url(/images/keith/a.jpg)" }}
            />
            {/* Decorative gradient corner */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#2764FF]/5 to-transparent rounded-bl-full pointer-events-none" />

            <div className="relative z-10">
              {/* Badges row */}
              <div className="flex items-center gap-3 mb-4">
                {/* Category badge */}
                <span className="inline-flex items-center px-3 py-1 text-xs font-semibold tracking-wide uppercase rounded-full bg-[#21262D] text-[#21B8CD]">
                  {mockInsight.category}
                </span>

                {/* Premium badge */}
                {mockInsight.isPremium && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold tracking-wide uppercase rounded-full bg-[#C8A84E]/15 text-[#C8A84E] border border-[#C8A84E]/20">
                    <Sparkles className="w-3 h-3" />
                    Premium
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-semibold text-[#E6EDF3] mb-4 group-hover:text-[#21B8CD] transition-colors duration-200 leading-snug">
                {mockInsight.title}
              </h3>

              {/* Description */}
              <p className="text-sm sm:text-base text-[#8B949E] leading-relaxed mb-6 max-w-3xl">
                {mockInsight.description}
              </p>

              {/* Arrow link */}
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2764FF] hover:underline group-hover:gap-2.5 transition-all duration-200">
                Read in the Vault
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    </section>
  );
}
