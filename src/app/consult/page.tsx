"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor,
  Building2,
  FolderKanban,
  Church,
  Globe,
  Brain,
  ChevronDown,
} from "lucide-react";
import Badge from "@/components/shared/Badge";
import Card from "@/components/shared/Card";
import FadeInOnScroll from "@/components/shared/FadeInOnScroll";
import ConsultIntakeForm from "@/components/consult/ConsultIntakeForm";
import type { LucideIcon } from "lucide-react";

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
/*  Photo gallery images                                                */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Consultation topics                                                 */
/* ------------------------------------------------------------------ */

interface ConsultTopic {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
  accent: string;
  accentBg: string;
  dotColor: string;
}

const topics: ConsultTopic[] = [
  {
    icon: Monitor,
    title: "IT Consulting",
    description:
      "Strategic technology guidance to optimize your infrastructure, strengthen security posture, and drive operational efficiency.",
    bullets: [
      "Infrastructure assessment & optimization",
      "Security audits & compliance planning",
      "Vendor evaluation & selection",
      "IT cost optimization strategies",
    ],
    accent: "text-[#2764FF]",
    accentBg: "bg-[#2764FF]/10",
    dotColor: "bg-[#2764FF]",
  },
  {
    icon: Building2,
    title: "CTO Services",
    description:
      "Fractional CTO expertise to align technology with your business vision and scale your engineering capabilities.",
    bullets: [
      "Technology roadmap development",
      "Team structure & hiring strategy",
      "Architecture review & recommendations",
      "Technical due diligence",
    ],
    accent: "text-[#21B8CD]",
    accentBg: "bg-[#21B8CD]/10",
    dotColor: "bg-[#21B8CD]",
  },
  {
    icon: FolderKanban,
    title: "Project Management",
    description:
      "End-to-end project leadership that keeps initiatives on track, within scope, and aligned with business objectives.",
    bullets: [
      "Project scoping & planning",
      "Risk identification & mitigation",
      "Milestone tracking & delivery",
      "Stakeholder communication frameworks",
    ],
    accent: "text-[#6ECF55]",
    accentBg: "bg-[#6ECF55]/10",
    dotColor: "bg-[#6ECF55]",
  },
  {
    icon: Church,
    title: "Church & Ministry Technology",
    description:
      "Empowering faith-based organizations to leverage technology for deeper engagement, streamlined operations, and expanded reach.",
    bullets: [
      "Digital worship & hybrid experiences",
      "Ministry management systems",
      "Live streaming & media infrastructure",
      "Congregation engagement platforms",
    ],
    accent: "text-[#8840FF]",
    accentBg: "bg-[#8840FF]/10",
    dotColor: "bg-[#8840FF]",
  },
  {
    icon: Globe,
    title: "Digital Transformation",
    description:
      "Comprehensive digital strategy to modernize operations, enhance customer experiences, and unlock new growth opportunities.",
    bullets: [
      "ERP & system modernization",
      "Cloud migration strategy",
      "Custom application development",
      "Process automation & integration",
    ],
    accent: "text-[#21B8CD]",
    accentBg: "bg-[#21B8CD]/10",
    dotColor: "bg-[#21B8CD]",
  },
  {
    icon: Brain,
    title: "AI & Leadership Strategy",
    description:
      "Executive-level guidance on adopting AI responsibly, building governance frameworks, and preparing your organization for the intelligent enterprise.",
    bullets: [
      "AI readiness assessments",
      "Governance & ethics frameworks",
      "Use-case identification & prioritization",
      "Executive AI briefings & workshops",
    ],
    accent: "text-[#2764FF]",
    accentBg: "bg-[#2764FF]/10",
    dotColor: "bg-[#2764FF]",
  },
];

/* ------------------------------------------------------------------ */
/*  Accordion Item                                                      */
/* ------------------------------------------------------------------ */

function AccordionItem({ topic, isOpen, onToggle }: {
  topic: ConsultTopic;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = topic.icon;

  return (
    <div className="border border-[#21262D] rounded-xl overflow-hidden transition-colors duration-200 hover:border-[#21262D]/80">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 md:p-6 text-left cursor-pointer transition-colors duration-200 hover:bg-white/[0.02]"
        aria-expanded={isOpen}
      >
        <div className={`w-11 h-11 rounded-lg ${topic.accentBg} flex items-center justify-center shrink-0`}>
          <Icon size={20} className={topic.accent} />
        </div>
        <h3 className="flex-1 text-lg font-semibold text-klo-text">
          {topic.title}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <ChevronDown size={20} className="text-klo-muted" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 md:px-6 pb-6 pt-0">
              <p className="text-klo-muted text-sm leading-relaxed mb-4 pl-[60px]">
                {topic.description}
              </p>
              <ul className="space-y-2 pl-[60px]">
                {topic.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5 text-sm text-klo-muted">
                    <span className={`w-1.5 h-1.5 rounded-full ${topic.dotColor} mt-1.5 shrink-0`} />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function ConsultPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen">
      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden py-24 md:py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-[#C8A84E]/5 via-transparent to-transparent pointer-events-none" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 max-w-4xl mx-auto text-center"
        >
          <motion.div variants={fadeUp} custom={0}>
            <Badge variant="gold" className="mb-6">
              Expert Consultation
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="font-display text-4xl md:text-6xl font-bold text-klo-text leading-tight"
          >
            Consult with Keith
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-6 text-lg md:text-xl text-klo-muted max-w-2xl mx-auto leading-relaxed"
          >
            One-on-one strategic guidance across technology, leadership, and
            ministry. Book a 30-minute session to tackle your most pressing
            challenges.
          </motion.p>
        </motion.div>
      </section>


      {/* ====== Consultation Topics Accordion ====== */}
      <FadeInOnScroll delay={0.05}>
        <section className="px-6 py-16 md:py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto"
          >
            <motion.div variants={fadeUp} custom={0} className="mb-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-klo-text mb-4">
                Consultation Topics
              </h2>
              <p className="text-klo-muted max-w-xl">
                Explore the areas where Keith provides expert guidance. Click any
                topic to learn more about what a consultation covers.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={1} className="space-y-3">
              {topics.map((topic, i) => (
                <AccordionItem
                  key={topic.title}
                  topic={topic}
                  isOpen={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                />
              ))}
            </motion.div>
          </motion.div>
        </section>
      </FadeInOnScroll>

      {/* ====== Consultation Intake Form ====== */}
      <FadeInOnScroll delay={0.05}>
        <section className="px-6 py-16 md:py-24 bg-klo-dark/40">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto"
          >
            <motion.div variants={fadeUp} custom={0} className="mb-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-klo-text mb-4">
                Request a Consultation
              </h2>
              <p className="text-klo-muted">
                Fill out the form below and our team will follow up with
                availability and next steps.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={1}>
              <ConsultIntakeForm />
            </motion.div>
          </motion.div>
        </section>
      </FadeInOnScroll>

    </div>
  );
}
