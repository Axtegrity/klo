"use client";

import { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, RotateCcw, Calendar, FileText, Presentation } from "lucide-react";
import Button from "@/components/shared/Button";
import Badge from "@/components/shared/Badge";
import Card from "@/components/shared/Card";
import type { AssessmentAnswerRecord } from "@/hooks/useAssessment";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

interface ScoreReportProps {
  assessmentTitle: string;
  score: number;
  maxScore: number;
  answers: AssessmentAnswerRecord[];
  onRetake: () => void;
}

interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function getScoreLabel(
  percentage: number,
): { label: string; variant: "gold" | "blue" | "green" | "muted" } {
  if (percentage >= 86) return { label: "Leading", variant: "green" };
  if (percentage >= 71) return { label: "Advanced", variant: "green" };
  if (percentage >= 51) return { label: "Established", variant: "blue" };
  if (percentage >= 31) return { label: "Developing", variant: "gold" };
  return { label: "Emerging", variant: "muted" };
}

function getCategoryScores(answers: AssessmentAnswerRecord[]): CategoryScore[] {
  const grouped: Record<string, { total: number; count: number }> = {};

  for (const answer of answers) {
    if (!grouped[answer.category]) {
      grouped[answer.category] = { total: 0, count: 0 };
    }
    grouped[answer.category].total += answer.value;
    grouped[answer.category].count += 1;
  }

  return Object.entries(grouped).map(([category, data]) => ({
    category,
    score: data.total,
    maxScore: data.count * 5,
    percentage: Math.round((data.total / (data.count * 5)) * 100),
  }));
}

function getRecommendations(
  categoryScores: CategoryScore[],
  assessmentTitle: string,
): string[] {
  const sorted = [...categoryScores].sort(
    (a, b) => a.percentage - b.percentage,
  );
  const weakest = sorted.slice(0, Math.min(3, sorted.length));

  const recommendationMap: Record<string, string[]> = {
    Infrastructure: [
      "Invest in modernizing your core technology infrastructure — consider cloud-based solutions for reliability and scalability.",
      "Conduct a formal infrastructure audit to identify critical gaps in your technology foundation.",
    ],
    Communication: [
      "Develop a comprehensive digital communication strategy that includes social media, email, and live-streaming.",
      "Establish a content calendar and assign dedicated volunteers or staff to manage your digital communications.",
    ],
    Engagement: [
      "Prioritize digital engagement tools such as a mobile app, online groups, and interactive content to strengthen community connection.",
      "Create digital pathways for member engagement — from first-time visitors to active participants.",
    ],
    Data: [
      "Implement a centralized data management system and establish regular backup procedures for all critical information.",
      "Develop data governance practices to ensure member data is accurate, secure, and properly utilized.",
    ],
    "Data Foundation": [
      "Begin consolidating your data into a centralized, well-structured repository to prepare for AI initiatives.",
      "Invest in data quality tools and processes — clean, accessible data is the foundation of any successful AI strategy.",
    ],
    Culture: [
      "Launch an AI literacy program for your team — understanding AI capabilities and limitations is essential for successful adoption.",
      "Engage leadership in AI strategy discussions and build champions who can drive cultural acceptance of AI tools.",
    ],
    Governance: [
      "Establish clear AI governance policies including ethical guidelines, data usage standards, and accountability frameworks.",
      "Create a cross-functional AI governance committee to oversee responsible AI implementation.",
    ],
    "Use Cases": [
      "Conduct a structured AI opportunity assessment to identify high-impact use cases aligned with your strategic goals.",
      "Start with a focused AI pilot project that can demonstrate quick wins and build organizational confidence.",
    ],
    Policy: [
      "Develop and document comprehensive IT policies covering acceptable use, data handling, and technology procurement.",
      "Schedule regular policy reviews (at least annually) and ensure all staff are trained on current IT policies.",
    ],
    Compliance: [
      "Conduct a regulatory compliance gap analysis to identify which requirements apply and where you fall short.",
      "Implement a compliance monitoring program with regular audits and clear remediation workflows.",
    ],
    Risk: [
      "Develop a formal risk management framework that includes risk identification, assessment, and mitigation strategies.",
      "Create and test a disaster recovery plan — don't wait for an incident to discover your recovery gaps.",
    ],
    Strategy: [
      "Align your technology strategy with organizational goals through a formal IT strategic planning process.",
      "Establish regular technology governance reporting to leadership to ensure visibility into investments and risks.",
    ],
    People: [
      "Implement a comprehensive security awareness training program with regular phishing simulations and assessments.",
      "Strengthen access management with role-based controls, multi-factor authentication, and regular access reviews.",
    ],
    Process: [
      "Document and formalize your security processes including incident response, patch management, and vendor risk assessment.",
      "Establish defined SLAs and procedures for critical security operations to reduce response times and improve consistency.",
    ],
    Technology: [
      "Invest in modern security tooling — endpoint detection, network monitoring, and encryption should be baseline capabilities.",
      "Adopt a defense-in-depth approach with layered security controls across your infrastructure.",
    ],
  };

  const recommendations: string[] = [];

  for (const cat of weakest) {
    const pool = recommendationMap[cat.category];
    if (pool) {
      recommendations.push(pool[0]);
    } else {
      recommendations.push(
        `Focus on improving your ${cat.category.toLowerCase()} capabilities — this area scored ${cat.percentage}% and represents your greatest opportunity for growth.`,
      );
    }
  }

  // Add a general recommendation
  recommendations.push(
    `Schedule a strategy session with Keith to create a personalized ${assessmentTitle.toLowerCase()} improvement roadmap for your organization.`,
  );

  return recommendations;
}

// ------------------------------------------------------------
// Score Ring SVG Component
// ------------------------------------------------------------

function ScoreRing({
  percentage,
  size = 200,
}: {
  percentage: number;
  size?: number;
}) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-klo-slate"
        />
        {/* Score ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-[#68E9FA]"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-display text-4xl font-bold text-klo-text"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          {percentage}%
        </motion.span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Category Bar Component
// ------------------------------------------------------------

function CategoryBar({ category }: { category: CategoryScore }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-klo-text font-medium">{category.category}</span>
        <span className="text-klo-muted">
          {category.score}/{category.maxScore}
        </span>
      </div>
      <div className="w-full h-2.5 bg-klo-slate rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#68E9FA] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${category.percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
        />
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Main Component
// ------------------------------------------------------------

export default function ScoreReport({
  assessmentTitle,
  score,
  maxScore,
  answers,
  onRetake,
}: ScoreReportProps) {
  const percentage = Math.round((score / maxScore) * 100);
  const { label, variant } = getScoreLabel(percentage);
  const categoryScores = useMemo(() => getCategoryScores(answers), [answers]);
  const recommendations = useMemo(
    () => getRecommendations(categoryScores, assessmentTitle),
    [categoryScores, assessmentTitle],
  );
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = useCallback(async (format: "pdf" | "docx" | "pptx") => {
    setDownloading(format);
    try {
      const res = await fetch(`/api/assessments/download/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${assessmentTitle} Assessment`,
          score,
          maxScore,
          percentage,
          recommendations,
        }),
      });
      if (res.status === 401) {
        alert("Please sign in to download reports. Create a free account to unlock downloads.");
        return;
      }
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${assessmentTitle.toLowerCase().replace(/\s+/g, "-")}-assessment.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(null);
    }
  }, [assessmentTitle, score, maxScore, percentage, recommendations]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-3xl mx-auto space-y-10"
    >
      {/* Score Overview */}
      <div className="text-center space-y-6">
        <motion.h2
          className="font-display text-3xl md:text-4xl font-bold text-klo-text"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Your {assessmentTitle} Score
        </motion.h2>

        <div className="flex justify-center">
          <ScoreRing percentage={percentage} />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="space-y-2"
        >
          <Badge variant={variant} className="text-sm px-4 py-1.5">
            {label}
          </Badge>
          <p className="text-klo-muted text-sm">
            {score} out of {maxScore} points
          </p>
        </motion.div>
      </div>

      {/* Category Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <h3 className="font-display text-xl font-semibold text-klo-text mb-6">
            Category Breakdown
          </h3>
          <div className="space-y-4">
            {categoryScores.map((cat) => (
              <CategoryBar key={cat.category} category={cat} />
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card>
          <h3 className="font-display text-xl font-semibold text-klo-text mb-6">
            Recommendations
          </h3>
          <div className="space-y-4">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-[#68E9FA] shrink-0" />
                <p className="text-klo-muted text-sm leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="primary" size="lg" href="/booking">
            <Calendar size={18} />
            Book a Strategy Session with Keith
          </Button>
          <Button variant="secondary" size="md" onClick={onRetake}>
            <RotateCcw size={16} />
            Retake Assessment
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload("pdf")}
            disabled={downloading !== null}
          >
            <Download size={14} />
            {downloading === "pdf" ? "Generating..." : "PDF"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload("docx")}
            disabled={downloading !== null}
          >
            <FileText size={14} />
            {downloading === "docx" ? "Generating..." : "Word"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload("pptx")}
            disabled={downloading !== null}
          >
            <Presentation size={14} />
            {downloading === "pptx" ? "Generating..." : "PowerPoint"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
