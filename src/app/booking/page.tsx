"use client";

import { motion } from "framer-motion";
import {
  Mic2,
  Award,
  Building2,
  Timer,
} from "lucide-react";
import Card from "@/components/shared/Card";
import Badge from "@/components/shared/Badge";
import InquiryForm from "@/components/booking/InquiryForm";
import Testimonials from "@/components/booking/Testimonials";
import FadeInOnScroll from "@/components/shared/FadeInOnScroll";
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
      <FadeInOnScroll>
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
      </FadeInOnScroll>

      {/* ====== Inquiry Form ====== */}
      <FadeInOnScroll delay={0.1}>
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
      </FadeInOnScroll>

      {/* ====== Testimonials ====== */}
      <FadeInOnScroll delay={0.1}>
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
      </FadeInOnScroll>

    </div>
  );
}
