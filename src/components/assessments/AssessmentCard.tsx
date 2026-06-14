"use client";

import { motion } from "framer-motion";
import { Clock, HelpCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Card from "@/components/shared/Card";
import Badge from "@/components/shared/Badge";
import Button from "@/components/shared/Button";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

interface AssessmentCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  questionCount: number;
  estimatedMinutes: number;
  category: string;
  completed?: boolean;
  requiredTier?: "pro" | "executive";
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function AssessmentCard({
  title,
  description,
  icon: Icon,
  href,
  questionCount,
  estimatedMinutes,
  category,
  completed = false,
  requiredTier,
}: AssessmentCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card
        hoverable
        className="h-full flex flex-col justify-between relative overflow-hidden"
      >
        <div className="space-y-4">
          {/* Header row */}
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-lg bg-[#68E9FA]/10 flex items-center justify-center">
              <Icon size={22} className="text-[#68E9FA]" />
            </div>
            <div className="flex items-center gap-2">
              {requiredTier === "pro" && (
                <Badge variant="gold">Pro</Badge>
              )}
              {completed && (
                <Badge variant="green">Completed</Badge>
              )}
              <Badge variant="muted">{category}</Badge>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-display text-lg font-semibold text-klo-text">
            {title}
          </h3>

          {/* Description */}
          <p className="text-klo-muted text-sm leading-relaxed">
            {description}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-klo-muted">
            <span className="flex items-center gap-1.5">
              <HelpCircle size={14} />
              {questionCount} questions
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              ~{estimatedMinutes} min
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-5 mt-5 border-t border-klo-slate">
          <Button variant="primary" size="sm" href={href} className="w-full">
            {completed ? "Retake Assessment" : "Start Assessment"}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
