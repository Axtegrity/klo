"use client";

import { useState, useEffect } from "react";
import { Pencil, GripVertical, Eye, EyeOff, Lock } from "lucide-react";
import EditModal, { type EditField } from "./EditModal";

interface HomeSection {
  id: string;
  label: string;
  description: string;
  visible: boolean;
  canHide: boolean;
  lastEdited: string;
  fields: EditField[];
  files?: { name: string; type: string; size: string }[];
}

const DEFAULT_SECTIONS: HomeSection[] = [
  {
    id: "hero",
    label: "Hero Banner",
    description: "Main banner with heading, tagline, and CTA buttons",
    visible: true,
    canHide: false,
    lastEdited: "Mar 28, 2026",
    fields: [
      { key: "label", label: "Label", value: "Technology Innovator \u2022 Strategic Advisor \u2022 Speaker", type: "text", maxLength: 100 },
      { key: "heading", label: "Main Heading", value: "Keith L. Odom", type: "text", maxLength: 60, required: true },
      { key: "tagline", label: "Tagline", value: "Empowering organizations with AI-driven strategy and digital transformation", type: "textarea", maxLength: 200 },
      { key: "cta1_label", label: "Primary Button Label", value: "KLO Intelligence", type: "text", maxLength: 40 },
      { key: "cta1_link", label: "Primary Button Link", value: "/advisor", type: "url", maxLength: 200 },
      { key: "cta2_label", label: "Secondary Button Label", value: "Book a Consultation", type: "text", maxLength: 40 },
      { key: "cta2_link", label: "Secondary Button Link", value: "/consult", type: "url", maxLength: 200 },
    ],
  },
  {
    id: "brief",
    label: "Latest Intelligence Brief",
    description: "Featured article card with title, excerpt, and link",
    visible: true,
    canHide: true,
    lastEdited: "\u2014",
    fields: [
      { key: "title", label: "Brief Title", value: "The AI Executive Order: What Leaders Need to Know in 2026", type: "text", maxLength: 120, required: true },
      { key: "date", label: "Date", value: "February 24, 2026", type: "text", maxLength: 40 },
      { key: "excerpt", label: "Excerpt", value: "A concise breakdown of the latest federal guidance on AI governance, what it means for church leaders, and the three action steps every organization should take now.", type: "textarea", maxLength: 400 },
      { key: "link", label: "Read More Link", value: "/vault/executives-ai-briefing-q1-2026", type: "url", maxLength: 200 },
      { key: "cta", label: "Button Label", value: "Read More", type: "text", maxLength: 30 },
    ],
  },
  {
    id: "trending",
    label: "Trending Topics",
    description: "Topic tags and section heading",
    visible: true,
    canHide: true,
    lastEdited: "Mar 20, 2026",
    fields: [
      { key: "heading", label: "Section Heading", value: "Trending in Tech & Faith", type: "text", maxLength: 60 },
      { key: "topic1", label: "Topic 1", value: "AI Regulation", type: "text", maxLength: 30 },
      { key: "topic2", label: "Topic 2", value: "Church Tech", type: "text", maxLength: 30 },
      { key: "topic3", label: "Topic 3", value: "Cybersecurity", type: "text", maxLength: 30 },
      { key: "topic4", label: "Topic 4", value: "Digital Ethics", type: "text", maxLength: 30 },
      { key: "topic5", label: "Topic 5", value: "AI in Education", type: "text", maxLength: 30 },
    ],
  },
  {
    id: "insight",
    label: "Featured Insight",
    description: "Highlighted article with category, description, and vault link",
    visible: true,
    canHide: true,
    lastEdited: "Mar 18, 2026",
    fields: [
      { key: "category", label: "Category", value: "AI & Ethics", type: "text", maxLength: 30 },
      { key: "title", label: "Title", value: "Navigating the Moral Frontier of Generative AI in Ministry", type: "text", maxLength: 120, required: true },
      { key: "description", label: "Description", value: "An exploration of the ethical considerations faith leaders must address when adopting generative AI tools in their organizations.", type: "textarea", maxLength: 400 },
      { key: "link", label: "Link", value: "/vault/moral-frontier-gen-ai-ministry", type: "url", maxLength: 200 },
      { key: "cta", label: "Button Label", value: "Read in the Vault", type: "text", maxLength: 40 },
    ],
  },
  {
    id: "tool",
    label: "AI Tool of the Week",
    description: "Featured AI tool recommendation with external link",
    visible: true,
    canHide: true,
    lastEdited: "Mar 15, 2026",
    fields: [
      { key: "name", label: "Tool Name", value: "NotebookLM by Google", type: "text", maxLength: 60, required: true },
      { key: "category", label: "Category", value: "Productivity", type: "select", options: ["Productivity", "Writing", "Research", "Design", "Ministry", "Communication", "Analytics"] },
      { key: "description", label: "Description", value: "An AI-powered notebook that can analyze documents, generate summaries, and answer questions about your uploaded content.", type: "textarea", maxLength: 300 },
      { key: "why", label: "Why It Matters", value: "For pastors preparing sermons, leaders reviewing reports, or teams synthesizing research \u2014 this tool saves hours.", type: "textarea", maxLength: 300 },
      { key: "link", label: "External Link", value: "https://notebooklm.google.com", type: "url", maxLength: 300 },
      { key: "cta", label: "Button Label", value: "Learn More", type: "text", maxLength: 30 },
    ],
  },
  {
    id: "assessment_cta",
    label: "Assessment CTA",
    description: "Assessment cards section with heading",
    visible: true,
    canHide: true,
    lastEdited: "Mar 10, 2026",
    fields: [
      { key: "heading", label: "Section Heading", value: "Assess Your Readiness", type: "text", maxLength: 60 },
      { key: "subheading", label: "Subheading", value: "Quick, targeted assessments to benchmark where you stand.", type: "text", maxLength: 120 },
    ],
  },
  {
    id: "strategy_room",
    label: "Upcoming Strategy Room",
    description: "Next strategy room session preview",
    visible: true,
    canHide: true,
    lastEdited: "Mar 8, 2026",
    fields: [
      { key: "heading", label: "Section Heading", value: "Next Strategy Room", type: "text", maxLength: 60 },
      { key: "title", label: "Session Title", value: "AI Governance for Faith Organizations", type: "text", maxLength: 80, required: true },
      { key: "date", label: "Date", value: "April 15, 2026", type: "text", maxLength: 40 },
      { key: "description", label: "Description", value: "Join a focused strategy session on developing AI governance frameworks tailored for faith-based organizations.", type: "textarea", maxLength: 300 },
      { key: "seats", label: "Seats Info", value: "8 of 20", type: "text", maxLength: 20 },
      { key: "cta", label: "Button Label", value: "Register", type: "text", maxLength: 30 },
      { key: "link", label: "Link", value: "/strategy-rooms", type: "url", maxLength: 200 },
    ],
  },
];

export default function HomeContentManager() {
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/creative-studio/pages/home")
      .then((r) => r.json())
      .then(({ data }) => {
        if (!data?.brief_config) return;
        const bc = data.brief_config;
        setSections((prev) =>
          prev.map((s) => {
            if (s.id !== "brief") return s;
            return {
              ...s,
              lastEdited: new Date(data.updated_at ?? Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
              fields: s.fields.map((f) => ({ ...f, value: (bc as Record<string, string>)[f.key] ?? f.value })),
            };
          })
        );
      })
      .catch(() => {});
  }, []);

  const editingSection = sections.find((s) => s.id === editingId);

  const toggleVisibility = (id: string) => {
    const section = sections.find((s) => s.id === id);
    if (!section || !section.canHide) return;
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  };

  const handleDragStart = (index: number) => setDragIndex(index);
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
  };
  const handleDragEnd = () => setDragIndex(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-klo-muted">
          Drag to reorder. Click to edit content. Eye icon to show/hide.
        </p>
      </div>

      {sections.map((section, index) => (
        <div
          key={section.id}
          draggable={section.canHide}
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
            dragIndex === index
              ? "bg-[#2764FF]/10 border-[#2764FF]/30"
              : "bg-klo-dark/30 border-white/5 hover:border-white/10"
          } ${!section.visible ? "opacity-50" : ""}`}
        >
          {/* Drag handle */}
          <div className={`shrink-0 ${section.canHide ? "cursor-grab active:cursor-grabbing text-klo-muted" : "text-klo-muted/20"}`}>
            <GripVertical size={18} />
          </div>

          {/* Visibility */}
          <button
            onClick={() => toggleVisibility(section.id)}
            disabled={!section.canHide}
            className={`shrink-0 p-1.5 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center ${
              section.canHide ? "cursor-pointer hover:bg-white/5" : "cursor-not-allowed"
            }`}
          >
            {!section.canHide ? (
              <Lock size={16} className="text-klo-muted/30" />
            ) : section.visible ? (
              <Eye size={16} className="text-[#2764FF]" />
            ) : (
              <EyeOff size={16} className="text-klo-muted" />
            )}
          </button>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-klo-text">{section.label}</p>
            <p className="text-xs text-klo-muted">{section.description}</p>
          </div>

          {/* Last edited */}
          <span className="text-xs text-klo-muted/50 shrink-0 hidden sm:block">
            {section.lastEdited}
          </span>

          {/* Edit button */}
          <button
            onClick={() => setEditingId(section.id)}
            className="shrink-0 p-2 rounded-lg hover:bg-white/5 text-klo-muted hover:text-klo-text transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <Pencil size={16} />
          </button>
        </div>
      ))}

      {/* Edit Modal */}
      {editingSection && (
        <EditModal
          open={true}
          title={`Edit: ${editingSection.label}`}
          subtitle={editingSection.description}
          fields={editingSection.fields}
          files={editingSection.files}
          onSave={async (values) => {
            if (editingSection.id !== "brief") {
              setEditingId(null);
              return;
            }
            setSaving(true);
            setSaveError(null);
            try {
              const res = await fetch("/api/admin/creative-studio/pages/home", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ brief_config: values }),
              });
              if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.error ?? "Save failed");
              }
              const now = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              setSections((prev) =>
                prev.map((s) =>
                  s.id === "brief"
                    ? { ...s, lastEdited: now, fields: s.fields.map((f) => ({ ...f, value: values[f.key] ?? f.value })) }
                    : s
                )
              );
              setEditingId(null);
            } catch (err) {
              setSaveError(err instanceof Error ? err.message : "Save failed");
            } finally {
              setSaving(false);
            }
          }}
          onClose={() => { setSaveError(null); setEditingId(null); }}
          isSaving={saving}
        />
      )}
      {saveError && (
        <p className="mt-3 text-sm text-red-400">{saveError}</p>
      )}
    </div>
  );
}
