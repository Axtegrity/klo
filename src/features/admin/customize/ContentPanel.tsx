"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import ConfirmModal from "./ConfirmModal";

interface ContentField {
  key: string;
  label: string;
  value: string;
  originalValue: string;
  maxLength: number;
  type: "text" | "textarea" | "url";
  hint?: string;
}

interface ContentGroup {
  id: string;
  label: string;
  description: string;
  fields: ContentField[];
}

interface PageContent {
  id: string;
  label: string;
  groups: ContentGroup[];
}

function makeField(
  key: string,
  label: string,
  value: string,
  maxLength: number,
  type: "text" | "textarea" | "url" = "text",
  hint?: string
): ContentField {
  return { key, label, value, originalValue: value, maxLength, type, hint };
}

const PAGES: PageContent[] = [
  {
    id: "home",
    label: "Home Page",
    groups: [
      {
        id: "hero",
        label: "Hero Banner",
        description: "The main banner at the top of the home page",
        fields: [
          makeField("hero.label", "Label", "Technology Innovator \u2022 Strategic Advisor \u2022 Speaker", 100),
          makeField("hero.heading", "Main Heading", "Keith L. Odom", 60),
          makeField("hero.tagline", "Tagline", "Empowering organizations with AI-driven strategy and digital transformation", 200, "textarea"),
          makeField("hero.cta1_label", "Primary Button Label", "KLO Intelligence", 40),
          makeField("hero.cta1_link", "Primary Button Link", "/advisor", 200, "url"),
          makeField("hero.cta2_label", "Secondary Button Label", "Book a Consultation", 40),
          makeField("hero.cta2_link", "Secondary Button Link", "/consult", 200, "url"),
        ],
      },
      {
        id: "latest_brief",
        label: "Latest Intelligence Brief",
        description: "Featured article/brief card on the home page",
        fields: [
          makeField("brief.title", "Brief Title", "The AI Executive Order: What Leaders Need to Know in 2026", 120),
          makeField("brief.date", "Date", "February 24, 2026", 40),
          makeField("brief.excerpt", "Excerpt", "A concise breakdown of the latest federal guidance on AI governance...", 300, "textarea"),
          makeField("brief.link", "Read More Link", "/vault/executives-ai-briefing-q1-2026", 200, "url"),
        ],
      },
      {
        id: "trending",
        label: "Trending Topics",
        description: "Topic tags displayed on the home page",
        fields: [
          makeField("trending.topic1", "Topic 1", "AI Regulation", 30),
          makeField("trending.topic2", "Topic 2", "Church Tech", 30),
          makeField("trending.topic3", "Topic 3", "Cybersecurity", 30),
          makeField("trending.topic4", "Topic 4", "Digital Ethics", 30),
          makeField("trending.topic5", "Topic 5", "AI in Education", 30),
          makeField("trending.heading", "Section Heading", "Trending in Tech & Faith", 60),
        ],
      },
      {
        id: "featured_insight",
        label: "Featured Insight",
        description: "Highlighted article card",
        fields: [
          makeField("insight.category", "Category", "AI & Ethics", 30),
          makeField("insight.title", "Title", "Navigating the Moral Frontier of Generative AI in Ministry", 120),
          makeField("insight.description", "Description", "An exploration of the ethical considerations faith leaders must address when adopting generative AI tools in their organizations.", 400, "textarea"),
          makeField("insight.link", "Link", "/vault/moral-frontier-gen-ai-ministry", 200, "url"),
          makeField("insight.cta", "Button Label", "Read in the Vault", 40),
        ],
      },
      {
        id: "ai_tool",
        label: "AI Tool of the Week",
        description: "Featured AI tool recommendation",
        fields: [
          makeField("tool.name", "Tool Name", "NotebookLM by Google", 60),
          makeField("tool.category", "Category", "Productivity", 30),
          makeField("tool.description", "Description", "An AI-powered notebook that can analyze documents, generate summaries, and answer questions about your uploaded content.", 300, "textarea"),
          makeField("tool.why", "Why It Matters", "For pastors preparing sermons, leaders reviewing reports, or teams synthesizing research \u2014 this tool saves hours.", 300, "textarea"),
          makeField("tool.link", "External Link", "https://notebooklm.google.com", 300, "url"),
          makeField("tool.cta", "Button Label", "Learn More", 30),
        ],
      },
      {
        id: "assessment_cta",
        label: "Assessment CTA Section",
        description: "Assessment cards at the bottom of the home page",
        fields: [
          makeField("assess_cta.heading", "Section Heading", "Assess Your Readiness", 60),
          makeField("assess_cta.subheading", "Subheading", "Quick, targeted assessments to benchmark where you stand.", 120),
        ],
      },
    ],
  },
  {
    id: "advisor",
    label: "AI Advisor",
    groups: [
      {
        id: "advisor_header",
        label: "Header & Disclaimer",
        description: "Title, subtitle, and legal disclaimer",
        fields: [
          makeField("advisor.title", "Title", "Ask Keith", 40),
          makeField("advisor.subtitle", "Subtitle", "AI Strategic Advisor", 60),
          makeField("advisor.disclaimer", "Disclaimer", "AI-generated guidance based on Keith L. Odom's frameworks. Not a substitute for professional advice.", 300, "textarea"),
          makeField("advisor.placeholder", "Input Placeholder", "Type your own question...", 80),
          makeField("advisor.policy_link_label", "Policy Builder Link Label", "AI Policy Builder", 40),
          makeField("advisor.policy_link", "Policy Builder Link", "/advisor/policy-builder", 200, "url"),
        ],
      },
      {
        id: "advisor_prompts",
        label: "Suggested Prompts",
        description: "Pre-written questions users can click to get started",
        fields: [
          makeField("prompt.1", "Prompt 1", "Build an AI policy for a church", 100),
          makeField("prompt.2", "Prompt 2", "Evaluate our digital readiness", 100),
          makeField("prompt.3", "Prompt 3", "What are the risks of AI in business?", 100),
          makeField("prompt.4", "Prompt 4", "What are the key components of a digital transformation strategy?", 100),
          makeField("prompt.5", "Prompt 5", "How can we use technology to improve ministry engagement?", 100),
          makeField("prompt.6", "Prompt 6", "What should our AI ethics policy include?", 100),
        ],
      },
    ],
  },
  {
    id: "assessments",
    label: "Assessments",
    groups: [
      {
        id: "assessments_header",
        label: "Page Header",
        description: "Top of the assessments page",
        fields: [
          makeField("assessments.badge", "Badge Text", "Assessments", 30),
          makeField("assessments.heading", "Page Heading", "Digital Readiness Assessments", 80),
          makeField("assessments.description", "Description", "Comprehensive diagnostic tools designed to help organizations evaluate their digital maturity, AI readiness, and technology governance.", 300, "textarea"),
        ],
      },
    ],
  },
  {
    id: "vault",
    label: "Vault",
    groups: [
      {
        id: "vault_header",
        label: "Page Header",
        description: "Top of the Vault page",
        fields: [
          makeField("vault.heading", "Page Heading", "Insight Vault", 60),
          makeField("vault.description", "Description", "A curated library of exclusive articles, whitepapers, frameworks, and templates to accelerate your digital transformation.", 300, "textarea"),
          makeField("vault.search_placeholder", "Search Placeholder", "Search resources...", 60),
        ],
      },
    ],
  },
  {
    id: "consult",
    label: "Consultation",
    groups: [
      {
        id: "consult_header",
        label: "Page Header",
        description: "Top of the consultation page",
        fields: [
          makeField("consult.badge", "Badge Text", "Expert Consultation", 40),
          makeField("consult.heading", "Page Heading", "Consult with Keith", 60),
          makeField("consult.description", "Description", "One-on-one strategic guidance across technology, leadership, and ministry innovation.", 300, "textarea"),
          makeField("consult.topics_heading", "Topics Section Heading", "Consultation Topics", 60),
          makeField("consult.form_heading", "Form Section Heading", "Request a Consultation", 60),
        ],
      },
      {
        id: "consult_topics",
        label: "Consultation Topics",
        description: "The six service areas displayed on the page",
        fields: [
          makeField("consult.topic1", "Topic 1 Title", "IT Consulting", 40),
          makeField("consult.topic2", "Topic 2 Title", "CTO Services", 40),
          makeField("consult.topic3", "Topic 3 Title", "Project Management", 40),
          makeField("consult.topic4", "Topic 4 Title", "Church & Ministry Technology", 50),
          makeField("consult.topic5", "Topic 5 Title", "Digital Transformation", 40),
          makeField("consult.topic6", "Topic 6 Title", "AI & Leadership Strategy", 50),
        ],
      },
    ],
  },
  {
    id: "booking",
    label: "Booking",
    groups: [
      {
        id: "booking_header",
        label: "Page Header",
        description: "Speaking & engagements page",
        fields: [
          makeField("booking.badge", "Badge Text", "Speaking & Engagements", 40),
          makeField("booking.heading", "Page Heading", "Book Keith L. Odom", 60),
          makeField("booking.description", "Description", "Keynotes, workshops, and executive sessions that inspire transformation at the intersection of technology, leadership, and faith.", 300, "textarea"),
          makeField("booking.cta", "CTA Button Label", "Submit an Inquiry", 40),
          makeField("booking.form_heading", "Form Heading", "Submit a Booking Inquiry", 60),
        ],
      },
      {
        id: "booking_stats",
        label: "Quick Stats",
        description: "The stats shown at the top of the page",
        fields: [
          makeField("booking.stat1_value", "Stat 1 Value", "Speaker", 20),
          makeField("booking.stat1_label", "Stat 1 Label", "Keynote & Workshop", 40),
          makeField("booking.stat2_value", "Stat 2 Value", "50+", 10),
          makeField("booking.stat2_label", "Stat 2 Label", "Organizations Served", 40),
          makeField("booking.stat3_value", "Stat 3 Value", "20+", 10),
          makeField("booking.stat3_label", "Stat 3 Label", "Years of Technology Leadership", 50),
          makeField("booking.stat4_value", "Stat 4 Value", "25+", 10),
          makeField("booking.stat4_label", "Stat 4 Label", "Years of Ministry Experience", 50),
        ],
      },
    ],
  },
  {
    id: "feed",
    label: "Intelligence Feed",
    groups: [
      {
        id: "feed_header",
        label: "Page Header",
        description: "Executive Intelligence Feed page",
        fields: [
          makeField("feed.heading", "Page Heading", "Executive Intelligence Feed", 60),
          makeField("feed.subtitle", "Subtitle", "Keith's Perspective on What Matters", 80),
          makeField("feed.empty", "Empty State Message", "No posts in this category yet.", 80),
        ],
      },
      {
        id: "feed_categories",
        label: "Category Filters",
        description: "The filter tabs at the top of the feed",
        fields: [
          makeField("feed.cat1", "Category 1", "AI Breakthroughs", 30),
          makeField("feed.cat2", "Category 2", "Regulatory Shifts", 30),
          makeField("feed.cat3", "Category 3", "Tech Ethics", 30),
          makeField("feed.cat4", "Category 4", "Church Implications", 30),
          makeField("feed.cat5", "Category 5", "Leadership", 30),
        ],
      },
    ],
  },
];

export default function ContentPanel() {
  const [pages] = useState(PAGES);
  const [activePage, setActivePage] = useState("home");
  const [content, setContent] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const page of PAGES) {
      for (const group of page.groups) {
        for (const field of group.fields) {
          map[field.key] = field.value;
        }
      }
    }
    return map;
  });
  const [originals] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const page of PAGES) {
      for (const group of page.groups) {
        for (const field of group.fields) {
          map[field.key] = field.value;
        }
      }
    }
    return map;
  });
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const currentPage = pages.find((p) => p.id === activePage);

  const updateField = (key: string, value: string) => {
    setContent((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: prev[groupId] === undefined ? false : !prev[groupId],
    }));
  };

  const isGroupExpanded = (groupId: string) => {
    return expandedGroups[groupId] ?? true; // default expanded
  };

  // Compute what changed
  const getChanges = (): string[] => {
    const changes: string[] = [];
    for (const page of pages) {
      for (const group of page.groups) {
        for (const field of group.fields) {
          if (content[field.key] !== originals[field.key]) {
            changes.push(
              `${page.label} > ${group.label} > ${field.label}`
            );
          }
        }
      }
    }
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

  const inputClasses =
    "w-full bg-[#0D1117] border border-[#21262D] rounded-lg px-4 py-3 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:ring-2 focus:ring-[#2764FF]/50 focus:border-[#2764FF]/50 transition-all";

  return (
    <div className="space-y-6">
      {/* Page Selector */}
      <div>
        <h3 className="text-base font-semibold text-klo-text mb-3">
          Page Content
        </h3>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide scroll-touch pb-1">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => setActivePage(page.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer shrink-0 min-h-[40px] ${
                activePage === page.id
                  ? "bg-[#2764FF] text-white"
                  : "bg-klo-dark/50 text-klo-muted hover:text-klo-text border border-white/5"
              }`}
            >
              {page.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Groups */}
      {currentPage?.groups.map((group) => (
        <Card key={group.id}>
          <button
            onClick={() => toggleGroup(group.id)}
            className="w-full flex items-center justify-between cursor-pointer"
          >
            <div>
              <h4 className="text-sm font-semibold text-klo-text">
                {group.label}
              </h4>
              <p className="text-xs text-klo-muted mt-0.5">
                {group.description}
              </p>
            </div>
            {isGroupExpanded(group.id) ? (
              <ChevronUp size={18} className="text-klo-muted shrink-0" />
            ) : (
              <ChevronDown size={18} className="text-klo-muted shrink-0" />
            )}
          </button>

          {isGroupExpanded(group.id) && (
            <div className="mt-5 space-y-4">
              {group.fields.map((field) => {
                const val = content[field.key] ?? field.value;
                const changed = val !== originals[field.key];
                return (
                  <div key={field.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor={field.key}
                        className="text-sm text-klo-muted flex items-center gap-1.5"
                      >
                        {field.label}
                        {field.type === "url" && (
                          <ExternalLink size={12} className="text-klo-muted/50" />
                        )}
                      </label>
                      <div className="flex items-center gap-2">
                        {changed && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
                            Modified
                          </span>
                        )}
                        {field.type !== "url" && (
                          <span
                            className={`text-xs font-mono ${
                              val.length > field.maxLength
                                ? "text-red-400"
                                : "text-klo-muted/50"
                            }`}
                          >
                            {val.length}/{field.maxLength}
                          </span>
                        )}
                      </div>
                    </div>
                    {field.type === "textarea" ? (
                      <textarea
                        id={field.key}
                        value={val}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        maxLength={field.maxLength}
                        rows={3}
                        className={`${inputClasses} resize-none ${
                          changed ? "border-amber-500/30" : ""
                        }`}
                      />
                    ) : (
                      <input
                        id={field.key}
                        type={field.type === "url" ? "url" : "text"}
                        value={val}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        maxLength={field.maxLength}
                        className={`${inputClasses} ${
                          changed ? "border-amber-500/30" : ""
                        } ${
                          field.type === "url" ? "font-mono text-xs" : ""
                        }`}
                      />
                    )}
                    {field.hint && (
                      <p className="text-xs text-klo-muted/50 mt-1">
                        {field.hint}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ))}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          {hasChanges && (
            <p className="text-xs text-amber-400">
              {getChanges().length} unsaved change{getChanges().length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              setContent({ ...originals });
              setSaved(false);
            }}
            disabled={!hasChanges}
          >
            Discard Changes
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveClick}
            disabled={!hasChanges}
          >
            {saved ? (
              <span className="inline-flex items-center gap-1.5">
                <Check size={16} /> Saved!
              </span>
            ) : (
              "Save Content"
            )}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={showConfirm}
        title="Confirm Content Changes"
        description="These changes will go live on the website immediately."
        changes={getChanges()}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
