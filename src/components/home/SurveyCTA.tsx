"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, ArrowRight } from "lucide-react";
import Button from "@/components/shared/Button";

interface ActiveSurvey {
  id: string;
  title: string;
  slug: string;
  description: string | null;
}

export default function SurveyCTA() {
  const [survey, setSurvey] = useState<ActiveSurvey | null>(null);

  // SurveyCTA checks show_on_homepage specifically (not the nav endpoint)
  useEffect(() => {
    fetch("/api/surveys/active")
      .then((r) => r.json())
      .then((data) => setSurvey(data.survey ?? null))
      .catch(() => {});
  }, []);

  if (!survey) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-[#2764FF]/20 bg-gradient-to-br from-[#2764FF]/10 via-[#011A5E]/50 to-[#21B8CD]/10"
    >
      {/* Decorative glow */}
      <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[#2764FF]/20 blur-[80px]" />

      <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-[#2764FF]/10 border border-[#2764FF]/20 flex items-center justify-center shrink-0">
          <ClipboardList size={28} className="text-[#2764FF]" />
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <h3 className="font-display text-xl md:text-2xl font-bold text-klo-text">
            {survey.title}
          </h3>
          {survey.description && (
            <p className="text-klo-muted text-sm leading-relaxed max-w-xl">
              {survey.description}
            </p>
          )}
        </div>

        <Button variant="primary" size="lg" href={`/survey/${survey.slug}`}>
          Take the Survey
          <ArrowRight size={18} />
        </Button>
      </div>
    </motion.div>
  );
}
