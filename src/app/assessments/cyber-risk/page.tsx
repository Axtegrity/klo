"use client";

import { ShieldAlert } from "lucide-react";
import AssessmentPageWrapper from "@/components/assessments/AssessmentPageWrapper";
import { cyberRiskQuestions } from "@/lib/assessment-questions";

export default function CyberRiskPage() {
  return (
    <AssessmentPageWrapper
      assessmentId="cyber-risk"
      title="Cyber Risk"
      description="Identify vulnerabilities and measure your organization's cyber risk posture across people, process, and technology dimensions."
      icon={ShieldAlert}
      category="Security"
      questions={cyberRiskQuestions}
      estimatedMinutes={5}
    />
  );
}
