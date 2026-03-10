"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, HelpCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Badge from "@/components/shared/Badge";
import Button from "@/components/shared/Button";
import Questionnaire from "./Questionnaire";
import ScoreReport from "./ScoreReport";
import type { AssessmentQuestion } from "@/lib/assessment-questions";
import type { AssessmentSavedResult } from "@/hooks/useAssessment";
import { haptics } from "@/lib/haptics";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

interface AssessmentPageWrapperProps {
  assessmentId: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: string;
  questions: AssessmentQuestion[];
  estimatedMinutes: number;
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function AssessmentPageWrapper({
  assessmentId,
  title,
  description,
  icon: Icon,
  category,
  questions,
  estimatedMinutes,
}: AssessmentPageWrapperProps) {
  const [result, setResult] = useState<AssessmentSavedResult | null>(null);
  const [started, setStarted] = useState(false);

  const handleComplete = useCallback((res: AssessmentSavedResult) => {
    setResult(res);
    haptics.success();
  }, []);

  const handleRetake = useCallback(() => {
    setResult(null);
    setStarted(false);
  }, []);

  // Show score report if completed
  if (result) {
    return (
      <div className="min-h-screen px-6 py-24 md:py-32">
        <div className="max-w-4xl mx-auto">
          <ScoreReport
            assessmentTitle={title}
            score={result.score}
            maxScore={result.maxScore}
            answers={result.answers}
            onRetake={handleRetake}
          />
        </div>
      </div>
    );
  }

  // Show questionnaire if started
  if (started) {
    return (
      <div className="min-h-screen px-6 py-24 md:py-32">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStarted(false)}
            >
              <ArrowLeft size={16} />
              Back to overview
            </Button>
          </div>

          <Questionnaire
            assessmentId={assessmentId}
            questions={questions}
            onComplete={handleComplete}
          />
        </div>
      </div>
    );
  }

  // Show intro / overview
  return (
    <div className="min-h-screen px-6 py-24 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto text-center space-y-8"
      >
        {/* Back to assessments */}
        <div className="text-left">
          <Button variant="ghost" size="sm" href="/assessments">
            <ArrowLeft size={16} />
            All Assessments
          </Button>
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-klo-gold/10 flex items-center justify-center">
            <Icon size={36} className="text-klo-gold" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-4">
          <Badge variant="muted">{category}</Badge>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-klo-text">
            {title} Assessment
          </h1>
          <p className="text-klo-muted text-lg leading-relaxed max-w-xl mx-auto">
            {description}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-center gap-6 text-sm text-klo-muted">
          <span className="flex items-center gap-2">
            <HelpCircle size={16} />
            {questions.length} questions
          </span>
          <span className="flex items-center gap-2">
            <Clock size={16} />
            ~{estimatedMinutes} minutes
          </span>
        </div>

        {/* Start Button */}
        <Button
          variant="primary"
          size="lg"
          onClick={() => setStarted(true)}
        >
          Begin Assessment
        </Button>
      </motion.div>
    </div>
  );
}
