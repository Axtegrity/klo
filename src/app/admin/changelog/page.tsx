"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Tag, Calendar, ChevronUp } from "lucide-react";

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  type: "feature" | "fix" | "improvement" | "breaking";
  created_at: string;
}

const typeStyles: Record<string, { bg: string; text: string; label: string }> = {
  feature: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Feature" },
  fix: { bg: "bg-red-500/20", text: "text-red-400", label: "Fix" },
  improvement: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Improvement" },
  breaking: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Breaking" },
};

export default function ChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    version: "",
    title: "",
    description: "",
    type: "feature" as ChangelogEntry["type"],
  });

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/changelog");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.version.trim() || !form.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/changelog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ version: "", title: "", description: "", type: "feature" });
        setShowForm(false);
        fetchEntries();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this changelog entry?")) return;
    const res = await fetch("/api/admin/changelog", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchEntries();
  }

  // Group entries by version
  const grouped = entries.reduce<Record<string, ChangelogEntry[]>>((acc, entry) => {
    if (!acc[entry.version]) acc[entry.version] = [];
    acc[entry.version].push(entry);
    return acc;
  }, {});

  const versions = Object.keys(grouped).sort((a, b) => {
    const dateA = grouped[a][0]?.created_at ?? "";
    const dateB = grouped[b][0]?.created_at ?? "";
    return dateB.localeCompare(dateA);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Changelog</h1>
          <p className="text-sm text-white/50 mt-1">
            Track features, fixes, and improvements
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-sm font-medium text-white hover:bg-white/15 transition-colors"
        >
          {showForm ? <ChevronUp size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "Add Entry"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Version
              </label>
              <input
                type="text"
                placeholder="e.g., 1.2.0"
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as ChangelogEntry["type"] })
                }
                className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-white/30 focus:outline-none cursor-pointer"
              >
                <option value="feature">Feature</option>
                <option value="fix">Fix</option>
                <option value="improvement">Improvement</option>
                <option value="breaking">Breaking Change</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">
              Title
            </label>
            <input
              type="text"
              placeholder="What changed?"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">
              Description (optional)
            </label>
            <textarea
              placeholder="More details about the change..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-white text-zinc-900 text-sm font-medium hover:bg-white/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Add Entry"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-white/40 animate-pulse">
          Loading changelog...
        </div>
      ) : versions.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
          <Tag size={32} className="mx-auto text-white/20 mb-3" />
          <p className="text-white/50">No changelog entries yet</p>
          <p className="text-xs text-white/30 mt-1">
            Add your first entry to start tracking changes
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {versions.map((version) => (
            <div key={version} className="relative">
              {/* Version header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-sm font-mono font-medium text-white">
                  <Tag size={14} />
                  v{version}
                </span>
                <span className="text-xs text-white/40 flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(grouped[version][0].created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Entries */}
              <div className="space-y-2 ml-2 border-l border-white/10 pl-5">
                {grouped[version].map((entry) => {
                  const style = typeStyles[entry.type] ?? typeStyles.feature;
                  return (
                    <div
                      key={entry.id}
                      className="group flex items-start gap-3 py-2"
                    >
                      <span
                        className={`shrink-0 mt-0.5 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${style.bg} ${style.text}`}
                      >
                        {style.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">
                          {entry.title}
                        </p>
                        {entry.description && (
                          <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                            {entry.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="opacity-0 group-hover:opacity-100 text-xs text-white/30 hover:text-red-400 transition-all cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
