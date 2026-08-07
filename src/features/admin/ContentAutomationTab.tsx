"use client";

import { useState } from "react";
import { FileText, Layers, ShieldCheck, Wrench, Newspaper } from "lucide-react";
import DraftReviewQueue from "./content-automation/DraftReviewQueue";
import TopicLanes from "./content-automation/TopicLanes";
import TrustedSources from "./content-automation/TrustedSources";
import ToolOfTheWeek from "./content-automation/ToolOfTheWeek";
import IntelligenceBrief from "./content-automation/IntelligenceBrief";
import EmbeddingsBackfillButton from "./content-automation/EmbeddingsBackfillButton";

type Section = "drafts" | "lanes" | "trusted-sources" | "tool-updates" | "brief-updates";

const sections: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "drafts", label: "Draft Review Queue", icon: FileText },
  { id: "lanes", label: "Topic Lanes", icon: Layers },
  { id: "trusted-sources", label: "Trusted Sources", icon: ShieldCheck },
  { id: "tool-updates", label: "Tool of the Week", icon: Wrench },
  { id: "brief-updates", label: "Intelligence Brief", icon: Newspaper },
];

export default function ContentAutomationTab() {
  const [activeSection, setActiveSection] = useState<Section>("drafts");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-xl font-semibold text-klo-text">
          Content Automation
        </h2>
        <p className="text-sm text-klo-muted mt-1">
          A weekly batch generates draft Vault articles across your topic lanes. Nothing goes live until you review and publish it here.
        </p>
      </div>

      {/* Section Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer min-h-[44px] ${
                activeSection === section.id
                  ? "bg-[#2764FF]/10 border-[#2764FF]/30 text-klo-text"
                  : "bg-klo-dark/30 border-white/5 text-klo-muted hover:text-klo-text hover:border-white/10"
              }`}
            >
              <Icon size={20} />
              <p className="text-sm font-medium">{section.label}</p>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeSection === "drafts" && <DraftReviewQueue />}
      {activeSection === "lanes" && <TopicLanes />}
      {activeSection === "trusted-sources" && <TrustedSources />}
      {activeSection === "tool-updates" && <ToolOfTheWeek />}
      {activeSection === "brief-updates" && <IntelligenceBrief />}

      {/* Backfill Embeddings — sits below all sub-sections regardless of
          which one is active; only renders itself once a status check
          confirms it's actually needed (see EmbeddingsBackfillButton.tsx) */}
      <EmbeddingsBackfillButton />
    </div>
  );
}
