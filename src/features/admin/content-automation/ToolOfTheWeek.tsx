"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RefreshCw, Wrench, ExternalLink, Sparkles, AlertCircle, Pencil } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import type { VaultPendingToolUpdate } from "@/lib/supabase";

type ReviewAction = "publish" | "discard" | "edit";

// Client-side-only cooldown between Generate runs — same safeguard and same
// duration as DraftReviewQueue.tsx's GENERATE_COOLDOWN_MS (a UX guard against
// accidental repeat-clicking on a cost-incurring external LLM call, not a
// security boundary). Not shared/imported because DraftReviewQueue's copy has
// its own module-local reasoning comment tied to vault-draft token costs —
// duplicating the constant here keeps each feature's cooldown independently
// tunable without coupling the two files together.
const GENERATE_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

function formatCooldown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Defense-in-depth alongside the server-side vaultPendingToolSchema check
// (src/lib/content-automation.ts) — this card renders a suggestion's link
// before it has ever been published, so it gets its own render-time guard
// too rather than trusting the server validation alone. (Avery review, PR
// #234 follow-up.)
function isSafeHttpUrl(val: string): boolean {
  try {
    const parsed = new URL(val);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function formatGeneratedAt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ToolOfTheWeek() {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<VaultPendingToolUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<{ id: string; action: ReviewAction } | null>(null);

  // Generate run controls — mirrors DraftReviewQueue.tsx's generate state
  // (see GENERATE_COOLDOWN_MS above for why the cooldown constant itself
  // isn't shared).
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

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/content-automation/tool-updates?status=pending");
      if (!res.ok) throw new Error("Failed to load tool suggestions");
      const json = await res.json();
      setSuggestions((json.data ?? []) as VaultPendingToolUpdate[]);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Failed to load tool suggestions");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const reviewMessages: Record<ReviewAction, string> = {
    publish: "Published — the homepage AI Tool of the Week updates immediately.",
    discard: "Suggestion discarded.",
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
      const res = await fetch("/api/admin/content-automation/tool-updates/generate", {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Generation run failed");

      if (json.generated) {
        toast("success", "Generated a new tool suggestion — check the queue below.");
        await fetchSuggestions();
      } else {
        setWarning(json.warning ?? "No suggestion was generated.");
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

  // Saves an in-place edit (tool_name/description/why_it_matters/category)
  // to a still-pending suggestion — distinct from handleReview below, which
  // only ever transitions status. Returns a boolean so the card knows
  // whether to exit edit mode (stays open on failure so the admin doesn't
  // lose their typed changes).
  const handleEditSave = async (
    suggestion: VaultPendingToolUpdate,
    fields: { tool_name?: string; description?: string; why_it_matters?: string; category?: string }
  ): Promise<boolean> => {
    setActingOn({ id: suggestion.id, action: "edit" });
    try {
      const res = await fetch(`/api/admin/content-automation/tool-updates/${suggestion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit", ...fields }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed to save changes");

      setSuggestions((prev) =>
        prev.map((s) => (s.id === suggestion.id ? (json.data as VaultPendingToolUpdate) : s))
      );
      toast("success", "Changes saved.");
      return true;
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Failed to save changes");
      return false;
    } finally {
      setActingOn(null);
    }
  };

  const handleReview = async (suggestion: VaultPendingToolUpdate, action: ReviewAction) => {
    setActingOn({ id: suggestion.id, action });
    try {
      const res = await fetch(`/api/admin/content-automation/tool-updates/${suggestion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 404 || res.status === 409) {
          setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
        }
        throw new Error(json.error ?? `Failed to ${action} suggestion`);
      }
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
      toast("success", reviewMessages[action]);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : `Failed to ${action} suggestion`);
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-klo-muted">
          {suggestions.length} pending suggestion{suggestions.length !== 1 ? "s" : ""}
        </p>
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
            : "Generate Suggestion"}
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
      ) : suggestions.length === 0 ? (
        <div className="text-center py-12 text-klo-muted text-sm glass rounded-2xl border border-white/5">
          No pending tool suggestions. The next suggestion generates Monday at 9am.
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {suggestions.map((suggestion) => (
              <ToolSuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                isPublishing={actingOn?.id === suggestion.id && actingOn.action === "publish"}
                isDiscarding={actingOn?.id === suggestion.id && actingOn.action === "discard"}
                isSavingEdit={actingOn?.id === suggestion.id && actingOn.action === "edit"}
                disabled={actingOn !== null && actingOn.id !== suggestion.id}
                onPublish={() => handleReview(suggestion, "publish")}
                onDiscard={() => handleReview(suggestion, "discard")}
                onSaveEdit={(fields) => handleEditSave(suggestion, fields)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function ToolSuggestionCard({
  suggestion,
  isPublishing,
  isDiscarding,
  isSavingEdit,
  disabled,
  onPublish,
  onDiscard,
  onSaveEdit,
}: {
  suggestion: VaultPendingToolUpdate;
  isPublishing: boolean;
  isDiscarding: boolean;
  isSavingEdit: boolean;
  disabled: boolean;
  onPublish: () => void;
  onDiscard: () => void;
  onSaveEdit: (fields: {
    tool_name?: string;
    description?: string;
    why_it_matters?: string;
    category?: string;
  }) => Promise<boolean>;
}) {
  const busy = isPublishing || isDiscarding || isSavingEdit;

  // No Preview modal exists for this card type (unlike Draft Review Queue/
  // Intelligence Brief) — every field already renders in full on the card,
  // nothing is truncated, so there's nothing a preview would add. Edit is a
  // single inline toggle on the card itself instead.
  const [editing, setEditing] = useState(false);
  const [editToolName, setEditToolName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editWhyItMatters, setEditWhyItMatters] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const handleEditStart = () => {
    setEditToolName(suggestion.tool_name);
    setEditDescription(suggestion.description);
    setEditWhyItMatters(suggestion.why_it_matters);
    setEditCategory(suggestion.category);
    setEditing(true);
  };
  const handleEditCancel = () => setEditing(false);
  const handleEditSaveClick = async () => {
    const fields: {
      tool_name?: string;
      description?: string;
      why_it_matters?: string;
      category?: string;
    } = {};
    if (editToolName !== suggestion.tool_name) fields.tool_name = editToolName;
    if (editDescription !== suggestion.description) fields.description = editDescription;
    if (editWhyItMatters !== suggestion.why_it_matters) fields.why_it_matters = editWhyItMatters;
    if (editCategory !== suggestion.category) fields.category = editCategory;
    if (Object.keys(fields).length === 0) {
      setEditing(false);
      return;
    }
    const ok = await onSaveEdit(fields);
    if (ok) setEditing(false);
  };

  if (editing) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        className="p-4 rounded-xl bg-klo-dark/30 border border-klo-accent/30 space-y-3"
      >
        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Tool Name</span>
          <input
            type="text"
            value={editToolName}
            onChange={(e) => setEditToolName(e.target.value)}
            disabled={busy}
            className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm disabled:opacity-50 focus:outline-none focus:border-klo-accent/50"
          />
        </label>
        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Category</span>
          <input
            type="text"
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            disabled={busy}
            className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm disabled:opacity-50 focus:outline-none focus:border-klo-accent/50"
          />
        </label>
        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Description</span>
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={3}
            disabled={busy}
            className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm resize-none disabled:opacity-50 focus:outline-none focus:border-klo-accent/50"
          />
        </label>
        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Why It Matters</span>
          <textarea
            value={editWhyItMatters}
            onChange={(e) => setEditWhyItMatters(e.target.value)}
            rows={3}
            disabled={busy}
            className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm resize-none disabled:opacity-50 focus:outline-none focus:border-klo-accent/50"
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
            <Wrench size={14} className="text-klo-muted shrink-0 mt-0.5" />
            <h4 className="text-sm font-medium text-klo-text truncate flex-1">{suggestion.tool_name}</h4>
          </div>
          <p className="text-xs text-klo-muted mt-2 leading-relaxed">{suggestion.description}</p>

          {/* Why It Matters — the one deliberate typographic break in this
              card (italic + full text color, not klo-muted, with an accent
              left border) so Keith's editorial voice reads as distinct from
              the metadata around it, per Vera's design brief. */}
          <div className="mt-2 space-y-2 border-l-2 border-klo-accent/40 pl-3">
            <p className="text-xs text-klo-text italic leading-relaxed">{suggestion.why_it_matters}</p>
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-klo-accent/10 text-klo-accent">
              {suggestion.category}
            </span>
            <span className="text-[10px] text-klo-muted">{formatGeneratedAt(suggestion.generated_at)}</span>
            {isSafeHttpUrl(suggestion.link) ? (
              <a
                href={suggestion.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-klo-muted hover:text-klo-text transition-colors"
              >
                <ExternalLink size={10} />
                {suggestion.link}
              </a>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
                Invalid link — do not publish
              </span>
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
            <button
              onClick={handleEditStart}
              disabled={disabled || busy}
              className="inline-flex items-center gap-1.5 text-klo-muted hover:text-klo-text hover:bg-white/5 rounded-lg px-3 py-1.5 text-xs font-medium min-h-[36px] disabled:opacity-50"
            >
              <Pencil size={14} />
              Edit
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
