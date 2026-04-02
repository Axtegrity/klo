"use client";

import { useState } from "react";
import { Search, Plus, Pencil, Lock, Clock } from "lucide-react";
import Badge from "@/components/shared/Badge";
import Button from "@/components/shared/Button";
import EditModal, { type EditField } from "./EditModal";

interface FeedPost {
  id: string;
  title: string;
  category: string;
  premium: boolean;
  published: string;
  readTime: string;
  excerpt: string;
}

const FEED_POSTS: FeedPost[] = [
  {
    id: "f1",
    title: "Why the EU AI Act Matters for Every Church Leader",
    category: "Regulatory Shifts",
    premium: false,
    published: "Mar 20, 2026",
    readTime: "6 min",
    excerpt: "The EU AI Act isn't just for tech companies. Here's why church leaders need to understand its implications for ministry technology.",
  },
  {
    id: "f2",
    title: "5 AI Tools Every Pastor Should Know in 2026",
    category: "AI Breakthroughs",
    premium: false,
    published: "Mar 15, 2026",
    readTime: "8 min",
    excerpt: "From sermon prep to community engagement, these five AI tools are transforming how pastors work and connect.",
  },
  {
    id: "f3",
    title: "The Ethics of AI-Generated Sermons",
    category: "Tech Ethics",
    premium: true,
    published: "Mar 10, 2026",
    readTime: "10 min",
    excerpt: "As AI gets better at writing, where do we draw the line? A framework for ethical AI use in sermon preparation.",
  },
  {
    id: "f4",
    title: "Digital Giving Trends: What the Data Says",
    category: "Church Implications",
    premium: false,
    published: "Mar 5, 2026",
    readTime: "5 min",
    excerpt: "New data reveals how digital giving is reshaping church finances, and what leaders should do about it.",
  },
  {
    id: "f5",
    title: "Building a Technology-First Culture in Your Organization",
    category: "Leadership",
    premium: true,
    published: "Feb 28, 2026",
    readTime: "7 min",
    excerpt: "Culture change starts at the top. Here's how to build an organization that embraces technology as a ministry multiplier.",
  },
  {
    id: "f6",
    title: "Cybersecurity Incident Response for Churches",
    category: "Church Implications",
    premium: false,
    published: "Feb 22, 2026",
    readTime: "9 min",
    excerpt: "When a breach happens — and it will — here's your step-by-step playbook for responding effectively.",
  },
  {
    id: "f7",
    title: "The Hidden Cost of Free AI Tools",
    category: "Tech Ethics",
    premium: false,
    published: "Feb 15, 2026",
    readTime: "6 min",
    excerpt: "Free AI tools come with a price. Understanding data privacy, model training, and the true cost of 'free' technology.",
  },
  {
    id: "f8",
    title: "Leading Through Digital Disruption",
    category: "Leadership",
    premium: true,
    published: "Feb 10, 2026",
    readTime: "12 min",
    excerpt: "How the best leaders navigate rapid technological change while keeping their teams aligned and their mission clear.",
  },
];

const CATEGORIES = ["All", "AI Breakthroughs", "Regulatory Shifts", "Tech Ethics", "Church Implications", "Leadership"];

function getPostFields(post: FeedPost): EditField[] {
  return [
    { key: "title", label: "Title", value: post.title, type: "text", maxLength: 120, required: true },
    { key: "category", label: "Category", value: post.category, type: "select", options: CATEGORIES.filter((c) => c !== "All") },
    { key: "excerpt", label: "Excerpt / Summary", value: post.excerpt, type: "textarea", maxLength: 300 },
    { key: "content", label: "Full Post Content", value: "Full markdown content would load here...", type: "textarea", maxLength: 10000, hint: "Supports plain text. Full formatting editor coming soon." },
    { key: "readTime", label: "Read Time", value: post.readTime, type: "text", maxLength: 20 },
    { key: "published", label: "Published Date", value: post.published, type: "text", maxLength: 40 },
    { key: "premium", label: "Access", value: post.premium ? "Premium" : "Free", type: "select", options: ["Free", "Premium"] },
  ];
}

function newPostFields(): EditField[] {
  return [
    { key: "title", label: "Title", value: "", type: "text", maxLength: 120, required: true },
    { key: "category", label: "Category", value: "AI Breakthroughs", type: "select", options: CATEGORIES.filter((c) => c !== "All") },
    { key: "excerpt", label: "Excerpt / Summary", value: "", type: "textarea", maxLength: 300 },
    { key: "content", label: "Full Post Content", value: "", type: "textarea", maxLength: 10000, hint: "Supports plain text. Full formatting editor coming soon." },
    { key: "readTime", label: "Read Time", value: "", type: "text", maxLength: 20 },
    { key: "published", label: "Published Date", value: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), type: "text", maxLength: 40 },
    { key: "premium", label: "Access", value: "Free", type: "select", options: ["Free", "Premium"] },
  ];
}

export default function FeedContentManager() {
  const [posts] = useState(FEED_POSTS);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);

  const filtered = posts.filter((post) => {
    const matchesSearch =
      !search ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All" || post.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const editingPost = posts.find((p) => p.id === editingId);

  return (
    <div className="space-y-4">
      {/* Search + Filter + Add */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-klo-muted" />
          <input
            type="text"
            placeholder="Search feed posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0D1117] border border-[#21262D] rounded-lg pl-10 pr-4 py-2.5 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:ring-2 focus:ring-[#2764FF]/50"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[#0D1117] border border-[#21262D] rounded-lg px-3 py-2.5 text-sm text-klo-text min-h-[44px]"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
          ))}
        </select>
        <Button variant="primary" size="sm" onClick={() => setCreatingNew(true)}>
          <Plus size={16} />
          New Post
        </Button>
      </div>

      <p className="text-xs text-klo-muted">
        Showing {filtered.length} of {posts.length} posts
      </p>

      {/* Post List */}
      <div className="space-y-2">
        {filtered.map((post) => (
          <div
            key={post.id}
            className="flex items-center gap-4 p-4 rounded-xl bg-klo-dark/30 border border-white/5 hover:border-white/10 transition-all"
          >
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-klo-text truncate">
                  {post.title}
                </p>
                {post.premium && (
                  <Lock size={12} className="text-klo-gold shrink-0" />
                )}
              </div>
              <p className="text-xs text-klo-muted truncate mb-1.5">
                {post.excerpt}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="blue">{post.category}</Badge>
                <span className="text-xs text-klo-muted flex items-center gap-1">
                  <Clock size={10} />
                  {post.readTime}
                </span>
              </div>
            </div>

            {/* Date */}
            <span className="text-xs text-klo-muted/50 shrink-0 hidden sm:block">
              {post.published}
            </span>

            {/* Edit */}
            <button
              onClick={() => setEditingId(post.id)}
              className="shrink-0 p-2 rounded-lg hover:bg-white/5 text-klo-muted hover:text-klo-text transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              <Pencil size={16} />
            </button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-klo-muted text-sm">No posts match your search.</p>
        </div>
      )}

      {/* Edit Modal */}
      {editingPost && (
        <EditModal
          open={true}
          title={`Edit: ${editingPost.title}`}
          fields={getPostFields(editingPost)}
          onSave={(values) => {
            console.log("Save post:", editingPost.id, values);
            setEditingId(null);
          }}
          onClose={() => setEditingId(null)}
          onDelete={() => {
            console.log("Delete post:", editingPost.id);
            setEditingId(null);
          }}
        />
      )}

      {/* New Post Modal */}
      {creatingNew && (
        <EditModal
          open={true}
          title="Create New Post"
          subtitle="This will be published to the feed immediately after confirmation"
          fields={newPostFields()}
          isNew
          onSave={(values) => {
            console.log("Create post:", values);
            setCreatingNew(false);
          }}
          onClose={() => setCreatingNew(false)}
        />
      )}
    </div>
  );
}
