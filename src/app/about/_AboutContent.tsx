"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  Monitor,
  BriefcaseBusiness,
  FolderKanban,
  Mic2,
  ArrowRight,
  Share2,
} from "lucide-react";
import Badge from "@/components/shared/Badge";
import Button from "@/components/shared/Button";
import AffiliationStrip from "@/components/affiliations/AffiliationStrip";
import AnimatedImage from "@/components/shared/AnimatedImage";
import FadeInOnScroll from "@/components/shared/FadeInOnScroll";
import { nativeShare } from "@/lib/native-share";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface ServiceItem {
  title: string;
  description: string;
  badge: string;
}

export interface AboutContent {
  id: string;
  hero_badge: string | null;
  hero_heading: string | null;
  hero_tagline: string | null;
  bio_paragraphs: string[] | null;
  services: ServiceItem[] | null;
}

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                   */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

/* ------------------------------------------------------------------ */
/*  Icon map — service cards still have hardcoded icons by index        */
/* ------------------------------------------------------------------ */

const SERVICE_ICONS: LucideIcon[] = [Monitor, BriefcaseBusiness, FolderKanban, Mic2];
const SERVICE_IMAGES = [
  "/images/keith/a.jpg",
  "/images/keith/b.jpg",
  "/images/keith/c.jpg",
  "/images/keith/d.jpg",
];

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function AboutContent({ content }: { content: AboutContent }) {
  const heroBadge = content.hero_badge ?? "Technology Innovator · Speaker · Pastor";
  const heroHeading = content.hero_heading ?? "Keith L. Odom";
  const heroTagline =
    content.hero_tagline ??
    "Bridging faith, technology, and leadership to empower organizations and communities for the digital age.";
  const bioParagraphs = content.bio_paragraphs ?? [];
  const services = content.services ?? [];

  return (
    <div className="min-h-screen">
      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden py-24 md:py-32 px-6">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2764FF]/5 via-transparent to-transparent pointer-events-none" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 max-w-4xl mx-auto text-center"
        >
          <motion.div variants={fadeUp} custom={0}>
            <Badge variant="cyan" className="mb-6">
              {heroBadge}
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="font-display text-4xl md:text-6xl font-bold leading-tight"
          >
            <span className="bg-gradient-to-r from-[#2764FF] to-[#21B8CD] bg-clip-text text-transparent">
              {heroHeading}
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-6 text-lg md:text-xl text-klo-muted max-w-2xl mx-auto leading-relaxed"
          >
            {heroTagline}
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="mt-6">
            <button
              onClick={() =>
                nativeShare({
                  title: heroHeading,
                  text: "AI Strategist, Leadership Speaker & Executive Advisor",
                  url: "https://keithlodom.ai/about",
                })
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-klo-muted hover:text-[#2764FF] hover:border-[#2764FF]/30 hover:bg-[#2764FF]/10 text-sm font-medium transition-colors"
            >
              <Share2 size={16} />
              Share Profile
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ====== About Keith ====== */}
      <section className="px-6 py-16 md:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="max-w-4xl mx-auto"
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="font-display text-3xl md:text-4xl font-bold text-klo-text mb-8"
          >
            About Keith
          </motion.h2>

          {/* Keith Hero Image */}
          <div className="mb-10 flex justify-center">
            <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-xl overflow-hidden border-2 border-[#21262D] hover:border-[#2764FF]/30 hover:shadow-[0_0_30px_rgba(39,100,255,0.15)] transition-all duration-300 group">
              <AnimatedImage
                src="/images/keith/KO.jpg"
                alt="Keith L. Odom"
                fill
                effect="zoom-hover"
                className="object-cover rounded-2xl"
                containerClassName="w-full h-full rounded-2xl"
              />
            </div>
          </div>

          <div className="space-y-6 text-klo-muted leading-relaxed text-base md:text-lg">
            {bioParagraphs.map((paragraph, i) => (
              <motion.p key={i} variants={fadeUp} custom={i + 1}>
                {paragraph}
              </motion.p>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ====== Services ====== */}
      <FadeInOnScroll>
        <section className="px-6 py-16 md:py-24 bg-klo-dark/40">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto"
          >
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-klo-text mb-4">
                Services
              </h2>
              <p className="text-klo-muted max-w-xl mx-auto">
                Comprehensive technology leadership and strategic advisory for
                organizations ready to transform.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service, i) => {
                const Icon = SERVICE_ICONS[i] ?? Monitor;
                const bgImage = SERVICE_IMAGES[i] ?? SERVICE_IMAGES[0];
                return (
                  <motion.div key={service.title} variants={fadeUp} custom={i + 1}>
                    <div className="group relative h-full bg-[#161B22] border border-[#21262D] rounded-xl p-8 overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#2764FF]/30 hover:shadow-[0_0_30px_rgba(39,100,255,0.1)]">
                      {/* Subtle background watermark image */}
                      <div className="absolute inset-0 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500">
                        <Image src={bgImage} alt="" fill className="object-cover" />
                      </div>
                      {/* Left accent bar */}
                      <div className="absolute left-0 top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#2764FF] to-[#21B8CD] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                      <div className="relative z-10 flex items-start gap-4">
                        <div className="shrink-0 w-12 h-12 rounded-lg bg-[#2764FF]/10 flex items-center justify-center">
                          <Icon size={22} className="text-[#2764FF]" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-klo-text">
                              {service.title}
                            </h3>
                            <Badge variant="cyan">{service.badge}</Badge>
                          </div>
                          <p className="text-klo-muted text-sm leading-relaxed">
                            {service.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              variants={fadeUp}
              custom={6}
              className="mt-10 text-center"
            >
              <Button variant="secondary" size="lg" href="/consult">
                Work With Keith
                <ArrowRight size={16} />
              </Button>
            </motion.div>
          </motion.div>
        </section>
      </FadeInOnScroll>

      {/* ====== Affiliations ====== */}
      <AffiliationStrip />
    </div>
  );
}
