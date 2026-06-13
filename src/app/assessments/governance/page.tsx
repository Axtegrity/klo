"use client";

import { ShieldCheck } from "lucide-react";
import AssessmentPageWrapper from "@/components/assessments/AssessmentPageWrapper";
import SubscriptionGate from "@/components/shared/SubscriptionGate";
import { governanceQuestions } from "@/lib/assessment-questions";

export default function GovernancePage() {
  return (
    <SubscriptionGate requiredTier="pro" feature="Technology Governance Assessment">
      <AssessmentPageWrapper
        assessmentId="governance"
        title="Technology Governance"
        description="Assess the strength of your IT governance framework including policies, compliance, change management, and strategic alignment."
        icon={ShieldCheck}
        category="Governance"
        questions={governanceQuestions}
        estimatedMinutes={5}
      />
    </SubscriptionGate>
  );
}
