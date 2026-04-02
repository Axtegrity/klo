"use client";

import { useState } from "react";
import {
  Check,
  GripVertical,
  Eye,
  EyeOff,
  Lock,
  AlertTriangle,
} from "lucide-react";
import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import ConfirmModal from "./ConfirmModal";

interface Feature {
  key: string;
  label: string;
  enabled: boolean;
  description: string;
}

interface Section {
  id: string;
  label: string;
  visible: boolean;
  canHide: boolean;
}

const DEFAULT_FEATURES: Feature[] = [
  { key: "assessments", label: "Assessments", enabled: true, description: "Leadership readiness assessments" },
  { key: "vault", label: "Resource Vault", enabled: true, description: "Frameworks, templates, and resources" },
  { key: "advisor", label: "AI Advisor", enabled: true, description: "AI-powered strategic advisor chat" },
  { key: "booking", label: "Booking", enabled: true, description: "Invite Keith to speak" },
  { key: "events", label: "Events", enabled: true, description: "Upcoming events and conferences" },
  { key: "conference", label: "Conference", enabled: true, description: "Live conference engagement tools" },
  { key: "strategy_rooms", label: "Strategy Rooms", enabled: true, description: "Collaborative strategy sessions" },
  { key: "feed", label: "Community Feed", enabled: true, description: "Content feed and updates" },
  { key: "marketplace", label: "Marketplace", enabled: false, description: "Resource marketplace" },
];

const DEFAULT_SECTIONS: Section[] = [
  { id: "HeroBanner", label: "Hero Banner", visible: true, canHide: false },
  { id: "UpcomingKeynote", label: "Upcoming Keynote", visible: true, canHide: true },
  { id: "LatestBrief", label: "Latest Brief", visible: true, canHide: true },
  { id: "TrendingTopics", label: "Trending Topics", visible: true, canHide: true },
  { id: "FeaturedInsight", label: "Featured Insight", visible: true, canHide: true },
  { id: "AIToolOfTheWeek", label: "AI Tool of the Week", visible: true, canHide: true },
  { id: "QuickAssessmentCTA", label: "Assessment CTA", visible: true, canHide: true },
];

export default function PagesFeaturesPanel() {
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [saved, setSaved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const enabledCount = features.filter((f) => f.enabled).length;
  const minFeatures = 3;

  const toggleFeature = (key: string) => {
    const feature = features.find((f) => f.key === key);
    if (!feature) return;

    // Prevent disabling if it would drop below minimum
    if (feature.enabled && enabledCount <= minFeatures) return;

    setFeatures((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f))
    );
    setSaved(false);
  };

  const toggleSection = (id: string) => {
    const section = sections.find((s) => s.id === id);
    if (!section || !section.canHide) return;

    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
    setSaved(false);
  };

  // Simple drag-and-drop via mouse/touch events
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    setSections((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(index, 0, moved);
      return updated;
    });
    setDragIndex(index);
    setSaved(false);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const getChanges = (): string[] => {
    const changes: string[] = [];
    features.forEach((f, i) => {
      if (f.enabled !== DEFAULT_FEATURES[i].enabled) {
        changes.push(`${f.label}: ${f.enabled ? "Enabled" : "Disabled"}`);
      }
    });
    sections.forEach((s, i) => {
      const orig = DEFAULT_SECTIONS[i];
      if (!orig) return;
      if (s.id !== orig.id) changes.push(`Reordered: ${s.label}`);
      if (s.visible !== orig.visible) {
        changes.push(`${s.label}: ${s.visible ? "Shown" : "Hidden"}`);
      }
    });
    return changes;
  };

  const hasChanges = getChanges().length > 0;

  const handleSaveClick = () => {
    if (!hasChanges) return;
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Feature Toggles */}
      <Card>
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-klo-text">
              Feature Toggles
            </h3>
            <p className="text-sm text-klo-muted mt-1">
              Turn features on or off. This also affects navigation links.
            </p>
          </div>

          <div className="space-y-1">
            {features.map((feature) => {
              const wouldBreak = feature.enabled && enabledCount <= minFeatures;
              return (
                <div
                  key={feature.key}
                  className={`flex items-center justify-between gap-4 p-3 rounded-lg transition-colors ${
                    feature.enabled
                      ? "bg-klo-dark/30"
                      : "bg-klo-dark/10 opacity-60"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-klo-text">
                      {feature.label}
                    </p>
                    <p className="text-xs text-klo-muted">
                      {feature.description}
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={feature.enabled}
                    aria-label={feature.label}
                    onClick={() => toggleFeature(feature.key)}
                    disabled={wouldBreak}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer shrink-0 ${
                      wouldBreak ? "opacity-50 cursor-not-allowed" : ""
                    } ${feature.enabled ? "bg-[#2764FF]" : "bg-klo-slate"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                        feature.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>

          {enabledCount <= minFeatures && (
            <div className="flex items-center gap-2 text-amber-400 text-xs p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle size={14} />
              At least {minFeatures} features must stay active.
            </div>
          )}
        </div>
      </Card>

      {/* Page Section Order */}
      <Card>
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-klo-text">
              Home Page Sections
            </h3>
            <p className="text-sm text-klo-muted mt-1">
              Drag to reorder. Click the eye icon to show or hide sections.
            </p>
          </div>

          <div className="space-y-1">
            {sections.map((section, index) => (
              <div
                key={section.id}
                draggable={section.canHide}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  dragIndex === index
                    ? "bg-[#2764FF]/10 border border-[#2764FF]/30"
                    : "bg-klo-dark/30 border border-transparent"
                } ${!section.visible ? "opacity-50" : ""}`}
              >
                {/* Drag handle */}
                <div
                  className={`shrink-0 ${
                    section.canHide
                      ? "cursor-grab active:cursor-grabbing text-klo-muted"
                      : "text-klo-muted/30"
                  }`}
                >
                  <GripVertical size={18} />
                </div>

                {/* Visibility toggle */}
                <button
                  onClick={() => toggleSection(section.id)}
                  disabled={!section.canHide}
                  className={`shrink-0 p-1 rounded transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center ${
                    section.canHide
                      ? "cursor-pointer hover:bg-white/5"
                      : "cursor-not-allowed"
                  }`}
                  aria-label={
                    section.canHide
                      ? section.visible
                        ? `Hide ${section.label}`
                        : `Show ${section.label}`
                      : `${section.label} is always visible`
                  }
                >
                  {!section.canHide ? (
                    <Lock size={16} className="text-klo-muted/40" />
                  ) : section.visible ? (
                    <Eye size={16} className="text-[#2764FF]" />
                  ) : (
                    <EyeOff size={16} className="text-klo-muted" />
                  )}
                </button>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-klo-text">
                    {section.label}
                  </p>
                </div>

                {/* Status */}
                {!section.canHide && (
                  <span className="text-[10px] text-klo-muted/60 uppercase tracking-wider shrink-0">
                    Always visible
                  </span>
                )}
                {section.canHide && !section.visible && (
                  <span className="text-[10px] text-klo-muted uppercase tracking-wider shrink-0">
                    Hidden
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <Button
          variant="ghost"
          onClick={() => {
            setFeatures(DEFAULT_FEATURES);
            setSections(DEFAULT_SECTIONS);
          }}
          disabled={!hasChanges}
        >
          Reset to Defaults
        </Button>
        <Button variant="primary" onClick={handleSaveClick} disabled={!hasChanges}>
          {saved ? (
            <span className="inline-flex items-center gap-1.5">
              <Check size={16} /> Saved!
            </span>
          ) : (
            "Save Pages & Features"
          )}
        </Button>
      </div>

      <ConfirmModal
        open={showConfirm}
        title="Confirm Page & Feature Changes"
        description="Feature toggles affect navigation and access. Section changes affect the home page layout."
        changes={getChanges()}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
