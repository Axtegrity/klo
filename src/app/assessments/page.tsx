"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Church, BrainCircuit, ShieldCheck, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Badge from "@/components/shared/Badge";
import AssessmentCard from "@/components/assessments/AssessmentCard";
import { ASSESSMENTS } from "@/lib/constants";

// ------------------------------------------------------------
// Icon map
// ------------------------------------------------------------

const iconMap: Record<string, LucideIcon> = {
  Church,
  BrainCircuit,
  ShieldCheck,
  ShieldAlert,
};

// ------------------------------------------------------------
// Animation variants
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------

export default function AssessmentsPage() {
  const [completedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set<string>();
    const ids = new Set<string>();
    for (const assessment of ASSESSMENTS) {
      const key = `klo-assessment-${assessment.id}`;
      try {
        if (localStorage.getItem(key)) {
          ids.add(assessment.id);
        }
      } catch {
        // Ignore
      }
    }
    return ids;
  });

  return (
    <div className="min-h-screen px-6 py-24 md:py-32">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
          <Badge variant="gold" className="mb-6">
            Assessments
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-klo-text leading-tight mb-6">
            Digital Readiness Assessments
          </h1>
          <p className="text-lg text-klo-muted max-w-2xl mx-auto leading-relaxed">
            Comprehensive diagnostic tools designed to help organizations
            understand where they stand and chart a clear path toward digital
            excellence.
          </p>
        </motion.div>

        {/* Assessment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ASSESSMENTS.map((assessment, i) => {
            const Icon = iconMap[assessment.icon] ?? ShieldCheck;
            return (
              <motion.div
                key={assessment.id}
                variants={fadeUp}
                custom={i + 1}
              >
                <AssessmentCard
                  title={assessment.title}
                  description={assessment.description}
                  icon={Icon}
                  href={assessment.href}
                  questionCount={assessment.questionCount ?? 10}
                  estimatedMinutes={assessment.estimatedMinutes ?? 5}
                  category={assessment.category ?? "Assessment"}
                  completed={completedIds.has(assessment.id)}
                />
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
