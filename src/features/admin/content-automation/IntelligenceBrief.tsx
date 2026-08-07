"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  RefreshCw,
  FileText,
  Sparkles,
  AlertCircle,
  ChevronDown,
  Eye,
  Pencil,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/contexts/ToastContext";
import type { VaultPendingBriefUpdate } from "@/lib/supabase";
import Modal from "@/components/shared/Modal";

type ReviewAction = "publish" | "discard" | "edit";

// Client-side-only cooldown between Generate runs — same safeguard and same
// duration as DraftReviewQueue.tsx's / ToolOfTheWeek.tsx's GENERATE_COOLDOWN_MS
// (a UX guard against accidental repeat-clicking on a cost-incurring
// external LLM call, not a security boundary). Not shared/imported for the
// same reason those two don't share a copy either — each feature's cooldown
// stays independently tunable.
const GENERATE_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

function formatCooldown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatGeneratedAt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Client-side mirror of extractCitedSourceUrls() in src/lib/claude.ts / the
// identical helper in DraftReviewQueue.tsx — same `## Sources` heading +
// `- [Label](URL)` link shape the backend validates against, but also
// captures the label text for rendering.
function parseBriefSources(body: string): { label: string; url: string }[] {
  const sectionMatch = body.match(/##\s*Sources\s*\n([\s\S]*)$/i);
  if (!sectionMatch) return [];

  const linkRegex = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  const sources: { label: string; url: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(sectionMatch[1])) !== null) {
    sources.push({ label: match[1] || match[2], url: match[2] });
  }
  return sources;
}

export default function IntelligenceBrief() {
  const { toast } = useToast();
  const [briefs, setBriefs] = useState<VaultPendingBriefUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<{ id: string; action: ReviewAction } | null>(null);

  // Generate run controls — mirrors DraftReviewQueue.tsx's generate state.
  const [guidance, setGuidance] = useState("");
  const [generating, setGenerating] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownRemainingMs, setCooldownRemainingMs] = useState(0);

  useEffect(() => {
    if (cooldownUntil === null) return;
    const tick = () => {
      const remaining = cooldownUntil - Date.now();
      if (remaining <= 0) {
        setCooldownRemainingMs(0);
        setCooldownUntil(null);
      } else {
        setCooldownRemainingMs(remaining);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const fetchBriefs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/content-automation/brief-updates?status=pending");
      if (!res.ok) throw new Error("Failed to load Intelligence Briefs");
      const json = await res.json();
      setBriefs((json.data ?? []) as VaultPendingBriefUpdate[]);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Failed to load Intelligence Briefs");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBriefs();
  }, [fetchBriefs]);

  const reviewMessages: Record<ReviewAction, string> = {
    publish: "Published — the homepage Latest Intelligence Brief updates immediately.",
    discard: "Brief discarded.",
    // Never actually read — edits go through handleEditSave, which has its
    // own "Changes saved." toast, not handleReview/reviewMessages. Present
    // only so this object satisfies Record<ReviewAction, string> now that
    // "edit" is part of the action union.
    edit: "Changes saved.",
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setWarning(null);
    try {
      const res = await fetch("/api/admin/content-automation/brief-updates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guidance: guidance.trim() || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Generation run failed");

      if (json.generated) {
        toast("success", "Generated a new Intelligence Brief — check the queue below.");
        setGuidance("");
        await fetchBriefs();
      } else {
        setWarning(json.warning ?? "No brief was generated.");
      }
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Generation run failed");
    } finally {
      setGenerating(false);
      // Start the cooldown regardless of outcome — a failed run still cost
      // tokens if it got partway through the research call.
      setCooldownUntil(Date.now() + GENERATE_COOLDOWN_MS);
    }
  };

  const handleReview = async (brief: VaultPendingBriefUpdate, action: ReviewAction) => {
    setActingOn({ id: brief.id, action });
    try {
      const res = await fetch(`/api/admin/content-automation/brief-updates/${brief.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 404 || res.status === 409) {
          setBriefs((prev) => prev.filter((b) => b.id !== brief.id));
        }
        throw new Error(json.error ?? `Failed to ${action} brief`);
      }
      setBriefs((prev) => prev.filter((b) => b.id !== brief.id));
      toast("success", reviewMessages[action]);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : `Failed to ${action} brief`);
    } finally {
      setActingOn(null);
    }
  };

  // Saves an in-place edit (title/excerpt/body) to a still-pending brief —
  // distinct from handleReview above, which only ever transitions status.
  // Returns a boolean so the card knows whether to exit edit mode (stays
  // open on failure so the admin doesn't lose their typed changes).
  const handleEditSave = async (
    brief: VaultPendingBriefUpdate,
    fields: { title?: string; excerpt?: string; body?: string }
  ): Promise<boolean> => {
    setActingOn({ id: brief.id, action: "edit" });
    try {
      const res = await fetch(`/api/admin/content-automation/brief-updates/${brief.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit", ...fields }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed to save changes");

      setBriefs((prev) => prev.map((b) => (b.id === brief.id ? (json.data as VaultPendingBriefUpdate) : b)));
      toast("success", "Changes saved.");
      return true;
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Failed to save changes");
      return false;
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-klo-muted">
          {briefs.length} pending brief{briefs.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* On-demand generate controls */}
      <div className="p-4 rounded-xl bg-klo-dark/30 border border-white/5 space-y-3 mb-3">
        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Direction (optional)</span>
          <textarea
            value={guidance}
            onChange={(e) => setGuidance(e.target.value)}
            rows={2}
            placeholder="e.g. AI and the Black Church, focus on youth unemployment, highlight AI regulation in California..."
            className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm resize-none placeholder:text-klo-muted focus:outline-none focus:border-klo-accent/50"
          />
        </label>
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating || cooldownRemainingMs > 0}
        className="inline-flex items-center gap-2 bg-klo-accent text-white px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px] disabled:opacity-50"
      >
        {generating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {generating
          ? "Generating..."
          : cooldownRemainingMs > 0
            ? `Available in ${formatCooldown(cooldownRemainingMs)}`
            : "Generate Brief"}
      </button>

      {warning && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-amber-500/5 border-amber-500/20 mt-3">
          <AlertCircle size={16} className="text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-300">{warning}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <RefreshCw size={24} className="animate-spin text-klo-muted" />
        </div>
      ) : briefs.length === 0 ? (
        <div className="text-center py-12 text-klo-muted text-sm glass rounded-2xl border border-white/5">
          No pending briefs. The next brief generates Monday at 9am.
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {briefs.map((brief) => (
              <BriefCard
                key={brief.id}
                brief={brief}
                isPublishing={actingOn?.id === brief.id && actingOn.action === "publish"}
                isDiscarding={actingOn?.id === brief.id && actingOn.action === "discard"}
                isSavingEdit={actingOn?.id === brief.id && actingOn.action === "edit"}
                disabled={actingOn !== null && actingOn.id !== brief.id}
                onPublish={() => handleReview(brief, "publish")}
                onDiscard={() => handleReview(brief, "discard")}
                onSaveEdit={(fields) => handleEditSave(brief, fields)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function BriefCard({
  brief,
  isPublishing,
  isDiscarding,
  isSavingEdit,
  disabled,
  onPublish,
  onDiscard,
  onSaveEdit,
}: {
  brief: VaultPendingBriefUpdate;
  isPublishing: boolean;
  isDiscarding: boolean;
  isSavingEdit: boolean;
  disabled: boolean;
  onPublish: () => void;
  onDiscard: () => void;
  onSaveEdit: (fields: { title?: string; excerpt?: string; body?: string }) => Promise<boolean>;
}) {
  const busy = isPublishing || isDiscarding || isSavingEdit;
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const sources = useMemo(() => parseBriefSources(brief.body), [brief.body]);

  // Edit mode — shared between the inline card and the Preview modal (both
  // toggle the same `editing` flag), same pattern as DraftReviewQueue.tsx's
  // DraftCard.
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editBody, setEditBody] = useState("");

  const handleEditStart = () => {
    setEditTitle(brief.title);
    setEditExcerpt(brief.excerpt);
    setEditBody(brief.body);
    setEditing(true);
  };
  const handleEditCancel = () => setEditing(false);
  const handleEditSaveClick = async () => {
    const fields: { title?: string; excerpt?: string; body?: string } = {};
    if (editTitle !== brief.title) fields.title = editTitle;
    if (editExcerpt !== brief.excerpt) fields.excerpt = editExcerpt;
    if (editBody !== brief.body) fields.body = editBody;
    if (Object.keys(fields).length === 0) {
      setEditing(false);
      return;
    }
    const ok = await onSaveEdit(fields);
    if (ok) setEditing(false);
  };

  // The brief gets removed from the parent list on a successful review
  // action, which would unmount this card mid-request. Close the modal
  // synchronously here (before the async PATCH resolves) rather than
  // relying on the list re-render to make it moot — same reasoning as
  // DraftReviewQueue.tsx's handleModalPublish/handleModalDiscard.
  const handleModalPublish = () => {
    setPreviewOpen(false);
    onPublish();
  };
  const handleModalDiscard = () => {
    setPreviewOpen(false);
    onDiscard();
  };

  // Inline card-level edit mode — a lighter-weight surface than the Preview
  // modal's own edit mode below. Gated on `!previewOpen` so this never
  // fights with the modal: if the modal is open (editing was started from
  // its own header button instead), the modal renders the edit fields
  // further down and this card body just sits unchanged behind the backdrop.
  if (editing && !previewOpen) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        className="p-4 rounded-xl bg-klo-dark/30 border border-klo-accent/30 space-y-3"
      >
        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Title</span>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            disabled={busy}
            className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm disabled:opacity-50 focus:outline-none focus:border-klo-accent/50"
          />
        </label>
        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Excerpt</span>
          <textarea
            value={editExcerpt}
            onChange={(e) => setEditExcerpt(e.target.value)}
            rows={2}
            disabled={busy}
            className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm resize-none disabled:opacity-50 focus:outline-none focus:border-klo-accent/50"
          />
        </label>
        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Body</span>
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={10}
            disabled={busy}
            className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm font-mono disabled:opacity-50 focus:outline-none focus:border-klo-accent/50"
          />
        </label>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleEditCancel}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-klo-muted hover:text-klo-text hover:bg-white/5 rounded-lg px-3 py-1.5 text-xs font-medium min-h-[36px] disabled:opacity-50"
          >
            <X size={14} />
            Cancel
          </button>
          <button
            onClick={handleEditSaveClick}
            disabled={busy}
            className="inline-flex items-center gap-1.5 bg-klo-accent/10 border border-klo-accent/20 text-klo-accent hover:bg-klo-accent/20 rounded-lg px-3 py-1.5 text-xs font-medium min-h-[36px] disabled:opacity-50"
          >
            {isSavingEdit ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
            Save
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="p-4 rounded-xl bg-klo-dark/30 border border-white/5 hover:border-white/10 transition-all"
    >
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <FileText size={14} className="text-klo-muted shrink-0 mt-0.5" />
            <h4 className="text-sm font-medium text-klo-text truncate flex-1">{brief.title}</h4>
          </div>
          <p className="text-xs text-klo-muted mt-2 leading-relaxed line-clamp-3">{brief.excerpt}</p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-[10px] text-klo-muted">{formatGeneratedAt(brief.generated_at)}</span>
            {brief.topic_source && (
              <span className="text-[10px] text-klo-muted">{brief.topic_source}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
          <div className="flex gap-2">
            <button
              onClick={onPublish}
              disabled={disabled || busy}
              className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-lg px-3 py-1.5 text-xs font-medium min-h-[36px] disabled:opacity-50"
            >
              {isPublishing ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              Publish
            </button>
            <button
              onClick={onDiscard}
              disabled={disabled || busy}
              className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg px-3 py-1.5 text-xs font-medium min-h-[36px] disabled:opacity-50"
            >
              {isDiscarding ? <RefreshCw size={14} className="animate-spin" /> : <X size={14} />}
              Discard
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => setPreviewOpen(true)}
          disabled={disabled || busy}
          className="inline-flex items-center gap-1.5 text-klo-muted hover:text-klo-text hover:bg-white/5 rounded-lg px-3 py-1.5 text-xs font-medium min-h-[36px] disabled:opacity-50"
        >
          <Eye size={18} className="text-klo-accent" />
          Preview
        </button>
        <button
          onClick={handleEditStart}
          disabled={disabled || busy}
          className="inline-flex items-center gap-1.5 text-klo-muted hover:text-klo-text hover:bg-white/5 rounded-lg px-3 py-1.5 text-xs font-medium min-h-[36px] disabled:opacity-50"
        >
          <Pencil size={14} />
          Edit
        </button>
      </div>

      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={brief.title}
        size="lg"
        headerActions={
          !editing ? (
            <button
              onClick={handleEditStart}
              disabled={disabled || busy}
              className="p-2 rounded-lg text-klo-muted hover:text-klo-text hover:bg-white/5 transition-colors disabled:opacity-50"
              aria-label="Edit"
            >
              <Pencil size={16} />
            </button>
          ) : undefined
        }
      >
        {editing ? (
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-klo-muted mb-1 block">Title</span>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                disabled={busy}
                className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm disabled:opacity-50 focus:outline-none focus:border-klo-accent/50"
              />
            </label>
            <label className="block">
              <span className="text-xs text-klo-muted mb-1 block">Excerpt</span>
              <textarea
                value={editExcerpt}
                onChange={(e) => setEditExcerpt(e.target.value)}
                rows={2}
                disabled={busy}
                className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm resize-none disabled:opacity-50 focus:outline-none focus:border-klo-accent/50"
              />
            </label>
            <label className="block">
              <span className="text-xs text-klo-muted mb-1 block">Body</span>
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={16}
                disabled={busy}
                className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm font-mono disabled:opacity-50 focus:outline-none focus:border-klo-accent/50"
              />
            </label>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={handleEditCancel}
                disabled={busy}
                className="inline-flex items-center gap-1.5 text-klo-muted hover:text-klo-text hover:bg-white/5 rounded-lg px-3 py-1.5 text-xs font-medium min-h-[36px] disabled:opacity-50"
              >
                <X size={14} />
                Cancel
              </button>
              <button
                onClick={handleEditSaveClick}
                disabled={busy}
                className="inline-flex items-center gap-1.5 bg-klo-accent/10 border border-klo-accent/20 text-klo-accent hover:bg-klo-accent/20 rounded-lg px-3 py-1.5 text-xs font-medium min-h-[36px] disabled:opacity-50"
              >
                {isSavingEdit ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="max-h-[70vh] overflow-y-auto pr-1">
              <div className="text-sm text-klo-muted leading-relaxed prose-invert">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                    strong: ({ children }) => (
                      <strong className="text-klo-text font-semibold">{children}</strong>
                    ),
                  }}
                >
                  {brief.body}
                </ReactMarkdown>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-white/5">
              <button
                onClick={handleModalPublish}
                disabled={disabled || busy}
                className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-lg px-3 py-1.5 text-xs font-medium min-h-[36px] disabled:opacity-50"
              >
                {isPublishing ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                Publish
              </button>
              <button
                onClick={handleModalDiscard}
                disabled={disabled || busy}
                className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg px-3 py-1.5 text-xs font-medium min-h-[36px] disabled:opacity-50"
              >
                {isDiscarding ? <RefreshCw size={14} className="animate-spin" /> : <X size={14} />}
                Discard
              </button>
            </div>
          </>
        )}
      </Modal>

      <div className="border-t border-white/5 mt-3 pt-2">
        <button
          onClick={() => setSourcesOpen(!sourcesOpen)}
          className="w-full flex items-center justify-between py-2 text-left"
        >
          <span className="text-xs font-medium text-klo-muted">Sources</span>
          <ChevronDown
            size={14}
            className={`text-klo-muted transition-transform ${sourcesOpen ? "rotate-180" : ""}`}
          />
        </button>
        <AnimatePresence>
          {sourcesOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pb-2 space-y-1.5">
                {sources.length > 0 ? (
                  sources.map((src) => (
                    <a
                      key={src.url}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-klo-text truncate hover:text-[#2764FF] transition-colors"
                    >
                      {src.label}
                    </a>
                  ))
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
                    No sources listed
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
