"use client";

import { useState } from "react";
import { Search, Plus, Pencil, Star, Lock, Filter } from "lucide-react";
import Badge from "@/components/shared/Badge";
import Button from "@/components/shared/Button";
import EditModal, { type EditField } from "./EditModal";

interface VaultItem {
  id: string;
  title: string;
  category: string;
  type: string;
  level: string;
  premium: boolean;
  published: string;
  description: string;
  slug: string;
  duration: string;
  author: string;
  files?: { name: string; type: string; size: string }[];
}

const VAULT_ITEMS: VaultItem[] = [
  {
    id: "v1",
    title: "The Pastor's Guide to AI Adoption",
    category: "AI Strategy",
    type: "framework",
    level: "Beginner",
    premium: false,
    published: "Mar 1, 2026",
    description: "A step-by-step framework for pastors and ministry leaders looking to responsibly adopt AI tools in their organizations.",
    slug: "pastors-guide-ai-adoption",
    duration: "15 min read",
    author: "Keith L. Odom",
    files: [
      { name: "Pastors-Guide-AI-Adoption.pdf", type: "application/pdf", size: "2.4 MB" },
    ],
  },
  {
    id: "v2",
    title: "Enterprise AI Governance Framework",
    category: "Governance",
    type: "framework",
    level: "Executive",
    premium: true,
    published: "Feb 28, 2026",
    description: "Comprehensive governance framework for organizations implementing AI at scale, covering ethics, compliance, and risk management.",
    slug: "enterprise-ai-governance-framework",
    duration: "25 min read",
    author: "Keith L. Odom",
    files: [
      { name: "AI-Governance-Framework-v2.pdf", type: "application/pdf", size: "3.8 MB" },
      { name: "Governance-Checklist.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: "156 KB" },
    ],
  },
  {
    id: "v3",
    title: "Digital Ministry Playbook 2026",
    category: "Digital Transformation",
    type: "playbook",
    level: "Intermediate",
    premium: true,
    published: "Feb 20, 2026",
    description: "Your comprehensive guide to leveraging digital tools for ministry growth, engagement, and community building.",
    slug: "digital-ministry-playbook-2026",
    duration: "30 min read",
    author: "Keith L. Odom",
  },
  {
    id: "v4",
    title: "Cybersecurity Essentials for Churches",
    category: "Cybersecurity",
    type: "briefing",
    level: "Beginner",
    premium: false,
    published: "Feb 15, 2026",
    description: "Essential cybersecurity practices every church needs, from protecting member data to securing online giving.",
    slug: "cybersecurity-essentials-churches",
    duration: "12 min read",
    author: "Keith L. Odom",
  },
  {
    id: "v5",
    title: "Board-Level Technology Reporting Template",
    category: "Governance",
    type: "template",
    level: "Executive",
    premium: true,
    published: "Feb 10, 2026",
    description: "Ready-to-use reporting template for presenting technology initiatives, ROI, and risk to board members.",
    slug: "board-level-tech-reporting",
    duration: "10 min read",
    author: "Keith L. Odom",
    files: [
      { name: "Board-Tech-Report-Template.pptx", type: "application/vnd.openxmlformats-officedocument.presentationml.presentation", size: "1.1 MB" },
      { name: "Board-Tech-Report-Template.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: "245 KB" },
    ],
  },
  {
    id: "v6",
    title: "AI Ethics Policy Template for Nonprofits",
    category: "AI Strategy",
    type: "policy",
    level: "Intermediate",
    premium: false,
    published: "Feb 5, 2026",
    description: "A customizable AI ethics policy template designed specifically for nonprofit and faith-based organizations.",
    slug: "ai-ethics-policy-nonprofits",
    duration: "8 min read",
    author: "Keith L. Odom",
    files: [
      { name: "AI-Ethics-Policy-Template.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: "189 KB" },
    ],
  },
  {
    id: "v7",
    title: "The Executive AI Briefing Q1 2026",
    category: "AI Strategy",
    type: "briefing",
    level: "Executive",
    premium: true,
    published: "Jan 30, 2026",
    description: "Quarterly executive briefing covering the latest AI developments, regulatory changes, and strategic implications.",
    slug: "executives-ai-briefing-q1-2026",
    duration: "20 min read",
    author: "Keith L. Odom",
    files: [
      { name: "Executive-AI-Briefing-Q1-2026.pdf", type: "application/pdf", size: "4.2 MB" },
    ],
  },
  {
    id: "v8",
    title: "Data Privacy Compliance Checklist",
    category: "Governance",
    type: "template",
    level: "Intermediate",
    premium: false,
    published: "Jan 25, 2026",
    description: "Comprehensive checklist for ensuring your organization meets data privacy requirements across major regulatory frameworks.",
    slug: "data-privacy-compliance-checklist",
    duration: "6 min read",
    author: "Keith L. Odom",
    files: [
      { name: "Data-Privacy-Checklist.pdf", type: "application/pdf", size: "890 KB" },
    ],
  },
  {
    id: "v9",
    title: "Church Digital Transformation Roadmap",
    category: "Digital Transformation",
    type: "framework",
    level: "Beginner",
    premium: false,
    published: "Jan 20, 2026",
    description: "A 12-month roadmap for churches beginning their digital transformation journey, from assessment to implementation.",
    slug: "church-digital-transformation-roadmap",
    duration: "18 min read",
    author: "Keith L. Odom",
  },
  {
    id: "v10",
    title: "AI Vendor Evaluation Rubric",
    category: "AI Strategy",
    type: "template",
    level: "Executive",
    premium: true,
    published: "Jan 15, 2026",
    description: "Structured rubric for evaluating AI vendor proposals, comparing capabilities, pricing, and alignment with organizational values.",
    slug: "ai-vendor-evaluation-rubric",
    duration: "10 min read",
    author: "Keith L. Odom",
    files: [
      { name: "AI-Vendor-Rubric.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: "312 KB" },
    ],
  },
  {
    id: "v11",
    title: "Leadership in the Age of AI",
    category: "Leadership",
    type: "briefing",
    level: "Intermediate",
    premium: false,
    published: "Jan 10, 2026",
    description: "How leaders must evolve their management style, decision-making, and strategic thinking in an AI-augmented world.",
    slug: "leadership-age-of-ai",
    duration: "14 min read",
    author: "Keith L. Odom",
  },
  {
    id: "v12",
    title: "Ministry Technology Budget Template",
    category: "Digital Transformation",
    type: "template",
    level: "Beginner",
    premium: false,
    published: "Jan 5, 2026",
    description: "A practical budget template for ministry technology initiatives, including ROI tracking and stakeholder reporting.",
    slug: "ministry-tech-budget-template",
    duration: "5 min read",
    author: "Keith L. Odom",
    files: [
      { name: "Ministry-Tech-Budget-2026.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: "178 KB" },
    ],
  },
];

const CATEGORIES = ["All", "AI Strategy", "Governance", "Digital Transformation", "Cybersecurity", "Leadership"];
const TYPES = ["All", "framework", "briefing", "template", "policy", "playbook"];

function getItemFields(item: VaultItem): EditField[] {
  return [
    { key: "title", label: "Title", value: item.title, type: "text", maxLength: 120, required: true },
    { key: "slug", label: "URL Slug", value: item.slug, type: "text", maxLength: 100, hint: "Used in the URL: /vault/your-slug-here" },
    { key: "category", label: "Category", value: item.category, type: "select", options: CATEGORIES.filter((c) => c !== "All") },
    { key: "type", label: "Content Type", value: item.type, type: "select", options: TYPES.filter((t) => t !== "All") },
    { key: "level", label: "Level", value: item.level, type: "select", options: ["Beginner", "Intermediate", "Executive"] },
    { key: "description", label: "Description", value: item.description, type: "textarea", maxLength: 500 },
    { key: "duration", label: "Duration / Read Time", value: item.duration, type: "text", maxLength: 30 },
    { key: "author", label: "Author", value: item.author, type: "text", maxLength: 60 },
    { key: "premium", label: "Access", value: item.premium ? "Premium" : "Free", type: "select", options: ["Free", "Premium"] },
  ];
}

function newItemFields(): EditField[] {
  return [
    { key: "title", label: "Title", value: "", type: "text", maxLength: 120, required: true },
    { key: "slug", label: "URL Slug", value: "", type: "text", maxLength: 100, hint: "Used in the URL: /vault/your-slug-here" },
    { key: "category", label: "Category", value: "AI Strategy", type: "select", options: CATEGORIES.filter((c) => c !== "All") },
    { key: "type", label: "Content Type", value: "briefing", type: "select", options: TYPES.filter((t) => t !== "All") },
    { key: "level", label: "Level", value: "Beginner", type: "select", options: ["Beginner", "Intermediate", "Executive"] },
    { key: "description", label: "Description", value: "", type: "textarea", maxLength: 500 },
    { key: "duration", label: "Duration / Read Time", value: "", type: "text", maxLength: 30 },
    { key: "author", label: "Author", value: "Keith L. Odom", type: "text", maxLength: 60 },
    { key: "premium", label: "Access", value: "Free", type: "select", options: ["Free", "Premium"] },
  ];
}

export default function VaultContentManager() {
  const [items] = useState(VAULT_ITEMS);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);

  const filtered = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
    const matchesType = typeFilter === "All" || item.type === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  const editingItem = items.find((i) => i.id === editingId);

  return (
    <div className="space-y-4">
      {/* Search + Filters + Add */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-klo-muted" />
          <input
            type="text"
            placeholder="Search vault content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0D1117] border border-[#21262D] rounded-lg pl-10 pr-4 py-2.5 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:ring-2 focus:ring-[#2764FF]/50"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#0D1117] border border-[#21262D] rounded-lg px-3 py-2.5 text-sm text-klo-text min-h-[44px]"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#0D1117] border border-[#21262D] rounded-lg px-3 py-2.5 text-sm text-klo-text min-h-[44px]"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{t === "All" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
        <Button variant="primary" size="sm" onClick={() => setCreatingNew(true)}>
          <Plus size={16} />
          Add New
        </Button>
      </div>

      {/* Results count */}
      <p className="text-xs text-klo-muted">
        Showing {filtered.length} of {items.length} items
      </p>

      {/* Item List */}
      <div className="space-y-2">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 p-4 rounded-xl bg-klo-dark/30 border border-white/5 hover:border-white/10 transition-all"
          >
            {/* Content type icon */}
            <div className="w-10 h-10 rounded-lg bg-[#2764FF]/10 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-[#2764FF] uppercase">
                {item.type.slice(0, 4)}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-medium text-klo-text truncate">
                  {item.title}
                </p>
                {item.premium && (
                  <Lock size={12} className="text-klo-gold shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="blue">{item.category}</Badge>
                <Badge variant="muted">{item.level}</Badge>
                {item.files && item.files.length > 0 && (
                  <span className="text-[10px] text-klo-muted">
                    {item.files.length} file{item.files.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Date */}
            <span className="text-xs text-klo-muted/50 shrink-0 hidden sm:block">
              {item.published}
            </span>

            {/* Edit */}
            <button
              onClick={() => setEditingId(item.id)}
              className="shrink-0 p-2 rounded-lg hover:bg-white/5 text-klo-muted hover:text-klo-text transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              <Pencil size={16} />
            </button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-klo-muted text-sm">No items match your search.</p>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <EditModal
          open={true}
          title={`Edit: ${editingItem.title}`}
          subtitle={`/vault/${editingItem.slug}`}
          fields={getItemFields(editingItem)}
          files={editingItem.files}
          onSave={(values) => {
            console.log("Save vault item:", editingItem.id, values);
            setEditingId(null);
          }}
          onClose={() => setEditingId(null)}
          onDelete={() => {
            console.log("Delete vault item:", editingItem.id);
            setEditingId(null);
          }}
        />
      )}

      {/* New Item Modal */}
      {creatingNew && (
        <EditModal
          open={true}
          title="Add New Vault Item"
          subtitle="This will be published immediately after confirmation"
          fields={newItemFields()}
          isNew
          onSave={(values) => {
            console.log("Create vault item:", values);
            setCreatingNew(false);
          }}
          onClose={() => setCreatingNew(false)}
        />
      )}
    </div>
  );
}
