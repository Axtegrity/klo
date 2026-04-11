"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Upload,
  Trash2,
  FileText,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

interface PresentationFile {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: string;
}

interface Presentation {
  id: string;
  title: string;
  description: string | null;
  category: string;
  is_published: boolean;
  created_at: string;
  conference_presentation_files: PresentationFile[];
}

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: "bg-red-500/20 text-red-400",
  doc: "bg-blue-500/20 text-blue-400",
  docx: "bg-blue-500/20 text-blue-400",
  ppt: "bg-orange-500/20 text-orange-400",
  pptx: "bg-orange-500/20 text-orange-400",
  xls: "bg-green-500/20 text-green-400",
  xlsx: "bg-green-500/20 text-green-400",
  txt: "bg-zinc-500/20 text-zinc-400",
};

export default function PresentationsAdminTab() {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "", category: "General" });

  const fetchPresentations = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/presentations");
      if (res.ok) setPresentations(await res.json());
    } catch { /* keep current */ }
    setLoading(false);
  }, []);

  // Defer to a microtask so the setState inside fetchPresentations doesn't
  // run synchronously in the effect body (react-hooks/set-state-in-effect).
  useEffect(() => {
    Promise.resolve().then(fetchPresentations);
  }, [fetchPresentations]);

  const handleCreate = async () => {
    if (!formData.title.trim()) return;
    const res = await fetch("/api/admin/presentations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setFormData({ title: "", description: "", category: "General" });
      setShowForm(false);
      fetchPresentations();
    }
  };

  const handleTogglePublished = async (p: Presentation) => {
    await fetch(`/api/admin/presentations/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !p.is_published }),
    });
    fetchPresentations();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this presentation and all its files?")) return;
    await fetch(`/api/admin/presentations/${id}`, { method: "DELETE" });
    fetchPresentations();
  };

  const handleUploadFile = async (presentationId: string, file: File) => {
    setUploading(presentationId);
    const fd = new FormData();
    fd.append("file", file);
    await fetch(`/api/admin/presentations/${presentationId}/files`, {
      method: "POST",
      body: fd,
    });
    setUploading(null);
    fetchPresentations();
  };

  const handleDeleteFile = async (presentationId: string, fileId: string) => {
    await fetch(`/api/admin/presentations/${presentationId}/files?fileId=${fileId}`, {
      method: "DELETE",
    });
    fetchPresentations();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#2764FF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div variants={fadeUp} custom={0}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-klo-text">Conference Presentations</h2>
            <p className="text-sm text-klo-muted mt-1">
              Upload seminar materials for attendees. Registered users can download; others can view only.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2764FF] text-white text-sm font-medium rounded-lg hover:brightness-110 transition"
          >
            <Plus size={16} />
            Add Presentation
          </button>
        </div>
      </motion.div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-2xl p-6 border border-klo-slate space-y-4">
              <h3 className="text-lg font-semibold text-klo-text">New Presentation</h3>
              <div>
                <label className="block text-sm text-klo-muted mb-1">Title / Seminar Name *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. AI & Leadership Workshop — March 2026"
                  className="w-full bg-klo-navy/50 border border-klo-slate rounded-lg px-4 py-2.5 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:border-[#2764FF]/50"
                />
              </div>
              <div>
                <label className="block text-sm text-klo-muted mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the materials..."
                  rows={2}
                  className="w-full bg-klo-navy/50 border border-klo-slate rounded-lg px-4 py-2.5 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:border-[#2764FF]/50 resize-y"
                />
              </div>
              <div>
                <label className="block text-sm text-klo-muted mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-klo-navy/50 border border-klo-slate rounded-lg px-4 py-2.5 text-sm text-klo-text focus:outline-none focus:border-[#2764FF]/50"
                >
                  <option value="General">General</option>
                  <option value="AI & Leadership">AI & Leadership</option>
                  <option value="Digital Governance">Digital Governance</option>
                  <option value="Faith & Technology">Faith & Technology</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Workshop">Workshop</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleCreate}
                  disabled={!formData.title.trim()}
                  className="px-5 py-2 bg-[#2764FF] text-white text-sm font-medium rounded-lg hover:brightness-110 transition disabled:opacity-50"
                >
                  Create Presentation
                </button>
                <button
                  onClick={() => { setShowForm(false); setFormData({ title: "", description: "", category: "General" }); }}
                  className="px-5 py-2 border border-klo-slate text-klo-muted text-sm rounded-lg hover:text-klo-text transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Presentations List */}
      {presentations.length === 0 ? (
        <div className="glass rounded-2xl p-8 border border-klo-slate text-center">
          <FileText className="w-10 h-10 text-klo-muted mx-auto mb-3" />
          <p className="text-klo-muted text-sm">No presentations yet. Click &quot;Add Presentation&quot; to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {presentations.map((p, i) => {
            const isExpanded = expandedId === p.id;
            const files = p.conference_presentation_files || [];
            return (
              <motion.div key={p.id} variants={fadeUp} custom={i + 1}>
                <div className="glass rounded-2xl border border-klo-slate overflow-hidden">
                  {/* Header row */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.02] transition"
                    onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold text-klo-text truncate">{p.title}</h3>
                        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-[#2764FF]/10 text-[#2764FF]">
                          {p.category}
                        </span>
                        {!p.is_published && (
                          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">
                            Draft
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-klo-muted mt-1">
                        {files.length} file{files.length !== 1 ? "s" : ""} · {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleTogglePublished(p); }}
                        className="p-2 rounded-lg hover:bg-white/5 transition text-klo-muted hover:text-klo-text"
                        title={p.is_published ? "Unpublish" : "Publish"}
                      >
                        {p.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                        className="p-2 rounded-lg hover:bg-red-500/10 transition text-klo-muted hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                      {isExpanded ? <ChevronUp size={16} className="text-klo-muted" /> : <ChevronDown size={16} className="text-klo-muted" />}
                    </div>
                  </div>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-klo-slate p-4 space-y-4">
                          {p.description && (
                            <p className="text-sm text-klo-muted">{p.description}</p>
                          )}

                          {/* Files list */}
                          {files.length > 0 && (
                            <div className="space-y-2">
                              {files.map((f) => (
                                <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg bg-klo-navy/30">
                                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${FILE_TYPE_COLORS[f.file_type] || "bg-zinc-500/20 text-zinc-400"}`}>
                                    {f.file_type.toUpperCase()}
                                  </span>
                                  <a
                                    href={f.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 text-sm text-klo-text hover:text-[#2764FF] transition truncate"
                                  >
                                    {f.file_name}
                                  </a>
                                  <span className="text-xs text-klo-muted shrink-0">{f.file_size}</span>
                                  <button
                                    onClick={() => handleDeleteFile(p.id, f.id)}
                                    className="p-1 rounded hover:bg-red-500/10 text-klo-muted hover:text-red-400 transition"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Upload button */}
                          <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-klo-slate rounded-lg cursor-pointer hover:border-[#2764FF]/40 hover:bg-[#2764FF]/5 transition text-sm text-klo-muted hover:text-klo-text">
                            {uploading === p.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Upload size={16} />
                            )}
                            {uploading === p.id ? "Uploading..." : "Upload File"}
                            <span className="text-xs text-klo-muted ml-auto">PDF, PPTX, DOCX, etc. (50MB max)</span>
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.ppt,.pptx"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadFile(p.id, file);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
