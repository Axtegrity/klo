"use client";

import { motion } from "framer-motion";
import { Church, Globe, Building2, Cpu, CalendarDays } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Affiliation {
  name: string;
  icon: LucideIcon;
}

const affiliations: Affiliation[] = [
  { name: "The Place of Grace Church", icon: Church },
  { name: "Church of God in Christ, Inc.", icon: Globe },
  { name: "Axtegrity Consulting", icon: Building2 },
  { name: "TechChurch", icon: Cpu },
  { name: "Church & Technology Summit", icon: CalendarDays },
];

export default function AffiliationStrip() {
  // Duplicate for seamless loop
  const doubled = [...affiliations, ...affiliations];

  return (
    <section className="w-full overflow-hidden bg-[#161B22]/60 border-y border-[#21262D] py-6">
      <p className="text-center text-xs uppercase tracking-widest text-klo-muted mb-5">
        Affiliations & Organizations
      </p>
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#161B22]/60 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#161B22]/60 to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex items-center gap-12 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            x: {
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            },
          }}
        >
          {doubled.map((aff, index) => {
            const Icon = aff.icon;
            return (
              <div
                key={`${aff.name}-${index}`}
                className="flex items-center gap-3 shrink-0 px-4"
              >
                <Icon size={18} className="text-[#2764FF]" />
                <span className="text-[#21B8CD] text-sm font-medium whitespace-nowrap">
                  {aff.name}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
