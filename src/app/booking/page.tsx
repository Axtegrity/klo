"use client";

import { motion } from "framer-motion";
import {
  Mic2,
  Lightbulb,
  Church,
  ShieldCheck,
  Award,
  Building2,
  Timer,
} from "lucide-react";
import Card from "@/components/shared/Card";
import Badge from "@/components/shared/Badge";
import InquiryForm from "@/components/booking/InquiryForm";
import SpeakerKit from "@/components/booking/SpeakerKit";
import Testimonials from "@/components/booking/Testimonials";
import CalendarEmbed from "@/components/booking/CalendarEmbed";
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
/*  Keynote topics data                                                 */
/* ------------------------------------------------------------------ */

interface Keynote {
  icon: LucideIcon;
  title: string;
  description: string;
  audiences: string[];
  accent: string;
  accentBg: string;
}

const keynotes: Keynote[] = [
  {
    icon: Lightbulb,
    title: "AI and the Future of Leadership",
    description:
      "How artificial intelligence is redefining executive decision-making, organizational strategy, and what it means to lead in the age of intelligent systems.",
    audiences: ["C-Suite", "Conferences", "Corporate"],
    accent: "text-[#2764FF]",
    accentBg: "bg-[#2764FF]/10",
  },
  {
    icon: Church,
    title: "Faith Meets Innovation",
    description:
      "A transformative keynote exploring how faith-based organizations can harness technology to deepen community engagement, expand reach, and steward resources effectively.",
    audiences: ["Churches", "Ministries", "Nonprofits"],
    accent: "text-[#8840FF]",
    accentBg: "bg-[#8840FF]/10",
  },
  {
    icon: ShieldCheck,
    title: "Digital Governance & Cyber Resilience",
    description:
      "Practical frameworks for building robust digital governance structures and cybersecurity strategies that protect organizations and build stakeholder trust.",
    audiences: ["Boards", "IT Leaders", "Enterprises"],
    accent: "text-[#C8A84E]",
    accentBg: "bg-[#C8A84E]/10",
  },
  {
    icon: Mic2,
    title: "The TechChurch Blueprint",
    description:
      "A deep-dive into the TechChurch model — equipping ministry leaders with actionable steps to integrate technology into every dimension of church operations and outreach.",
    audiences: ["Pastors", "Church Leaders", "Denominations"],
    accent: "text-[#6ECF55]",
    accentBg: "bg-[#6ECF55]/10",
  },
];

/* ------------------------------------------------------------------ */
/*  Quick stats data                                                    */
/* ------------------------------------------------------------------ */

interface QuickStat {
  icon: LucideIcon;
  value: string;
  label: string;
}

const quickStats: QuickStat[] = [
  {
    icon: Mic2,
    value: "Speaker",
    label: "& Advisor",
  },
  {
    icon: Building2,
    value: "50+",
    label: "Organizations Served",
  },
  {
    icon: Timer,
    value: "20+",
    label: "Years of Technology Leadership",
  },
  {
    icon: Award,
    value: "25+",
    label: "Years of Ministry Experience",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function BookingPage() {
  return (
    <div className="min-h-screen">
      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden py-24 md:py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2764FF]/5 via-transparent to-transparent pointer-events-none" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 max-w-4xl mx-auto text-center"
        >
          <motion.div variants={fadeUp} custom={0}>
            <Badge variant="cyan" className="mb-6">
              Speaking &amp; Engagements
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="font-display text-4xl md:text-6xl font-bold text-klo-text leading-tight"
          >
            Book Keith L. Odom
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-6 text-lg md:text-xl text-klo-muted max-w-2xl mx-auto leading-relaxed"
          >
            Keynotes, workshops, and executive sessions at the intersection of
            technology, leadership, and faith.
          </motion.p>
        </motion.div>
      </section>

      {/* ====== Quick Stats ====== */}
      <section className="px-6 pb-16 md:pb-20 -mt-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={staggerContainer}
          className="max-w-5xl mx-auto"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {quickStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} variants={fadeUp} custom={i}>
                  <Card className="text-center py-6 md:py-8">
                    <div className="w-10 h-10 rounded-lg bg-[#2764FF]/10 flex items-center justify-center mx-auto mb-3">
                      <Icon size={20} className="text-[#2764FF]" />
                    </div>
                    <p className="font-display text-2xl md:text-3xl font-bold text-[#2764FF]">
                      {stat.value}
                    </p>
                    <p className="text-klo-muted text-xs md:text-sm mt-1">
                      {stat.label}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ====== Signature Keynotes ====== */}
      <section className="px-6 py-16 md:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="max-w-6xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-klo-text mb-4">
              Signature Keynotes
            </h2>
            <p className="text-klo-muted max-w-xl">
              Each keynote is crafted to inform, inspire, and activate. Topics
              can be customized for your audience and event format.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {keynotes.map((keynote, i) => {
              const Icon = keynote.icon;
              return (
                <motion.div key={keynote.title} variants={fadeUp} custom={i + 1}>
                  <Card hoverable className="h-full">
                    <div className="space-y-4">
                      <div className={`w-12 h-12 rounded-lg ${keynote.accentBg} flex items-center justify-center`}>
                        <Icon size={22} className={keynote.accent} />
                      </div>
                      <h3 className="text-lg font-semibold text-klo-text">
                        {keynote.title}
                      </h3>
                      <p className="text-klo-muted text-sm leading-relaxed">
                        {keynote.description}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {keynote.audiences.map((audience) => (
                          <Badge key={audience} variant="muted">
                            {audience}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ====== Inquiry Form ====== */}
      <section id="inquiry-form" className="px-6 py-16 md:py-24 bg-klo-dark/40">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="max-w-3xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-klo-text mb-4">
              Submit a Booking Inquiry
            </h2>
            <p className="text-klo-muted">
              Fill out the form below and our team will follow up with
              availability, pricing, and next steps.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={1}>
            <InquiryForm />
          </motion.div>
        </motion.div>
      </section>

      {/* ====== Calendar Embed ====== */}
      <section className="px-6 py-16 md:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="max-w-3xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0}>
            <CalendarEmbed />
          </motion.div>
        </motion.div>
      </section>

      {/* ====== Testimonials ====== */}
      <section className="px-6 py-16 md:py-24 bg-klo-dark/40">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="max-w-6xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-klo-text mb-4">
              What Organizers Say
            </h2>
          </motion.div>

          <motion.div variants={fadeUp} custom={1}>
            <Testimonials />
          </motion.div>
        </motion.div>
      </section>

      {/* ====== Speaker Kit ====== */}
      <section className="px-6 py-16 md:py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="max-w-3xl mx-auto"
        >
          <SpeakerKit />
        </motion.div>
      </section>
    </div>
  );
}
