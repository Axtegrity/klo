"use client";

import { ShieldAlert } from "lucide-react";
import AssessmentPageWrapper from "@/components/assessments/AssessmentPageWrapper";
import SubscriptionGate from "@/components/shared/SubscriptionGate";
import { cyberRiskQuestions } from "@/lib/assessment-questions";

export default function CyberRiskPage() {
  return (
    <SubscriptionGate requiredTier="pro" feature="Cyber Risk Assessment">
      <AssessmentPageWrapper
        assessmentId="cyber-risk"
        title="Cyber Risk"
        description="Identify vulnerabilities and measure your organization's cyber risk posture across people, process, and technology dimensions."
        icon={ShieldAlert}
        category="Security"
        questions={cyberRiskQuestions}
        estimatedMinutes={5}
      />
    </SubscriptionGate>
  );
}
