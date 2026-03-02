"use client";

import { motion } from "framer-motion";
import {
  Download,
  FileText,
  Camera,
  ListChecks,
  Settings2,
  MessageSquareQuote,
  ArrowRight,
} from "lucide-react";
import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Animation                                                           */
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
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ------------------------------------------------------------------ */
/*  Kit items data                                                      */
/* ------------------------------------------------------------------ */

interface KitItem {
  icon: LucideIcon;
  label: string;
  description: string;
}

const kitItems: KitItem[] = [
  {
    icon: FileText,
    label: "Professional Bio",
    description: "Short and extended biography in multiple formats",
  },
  {
    icon: Camera,
    label: "Headshot Photos",
    description: "High-resolution professional headshots for print and web",
  },
  {
    icon: ListChecks,
    label: "Past Engagement List",
    description: "Notable conferences, organizations, and events",
  },
  {
    icon: Settings2,
    label: "Technical Requirements",
    description: "A/V setup, stage preferences, and travel logistics",
  },
  {
    icon: MessageSquareQuote,
    label: "Suggested Introduction",
    description: "Ready-to-use introduction text for your MC or host",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function SpeakerKit() {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={staggerContainer}
    >
      <motion.div variants={fadeUp} custom={0}>
        <Card className="border-[#2764FF]/20 overflow-hidden">
          {/* Gradient accent bar */}
          <div className="h-1 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] -mt-6 -mx-6 mb-8" />

          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-full bg-[#2764FF]/10 flex items-center justify-center mx-auto mb-5">
              <Download size={24} className="text-[#2764FF]" />
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-klo-text mb-3">
              Speaker Kit
            </h3>
            <p className="text-klo-muted max-w-lg mx-auto">
              Everything you need to promote Keith L. Odom at your event,
              packaged in one convenient download.
            </p>
          </div>

          {/* Kit items grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {kitItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  variants={fadeUp}
                  custom={i + 1}
                  className="flex items-start gap-3 bg-klo-navy/40 rounded-lg p-4 border border-klo-slate/50"
                >
                  <div className="w-9 h-9 rounded-md bg-[#2764FF]/10 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-[#2764FF]" />
                  </div>
                  <div>
                    <p className="text-klo-text text-sm font-semibold">
                      {item.label}
                    </p>
                    <p className="text-klo-muted text-xs mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="primary" size="lg" href="#">
              <Download size={16} />
              Download Speaker Kit
            </Button>
            <Button variant="secondary" size="lg" href="#inquiry-form">
              Request Custom Materials
              <ArrowRight size={16} />
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
