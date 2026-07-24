"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RefreshCw, FileText } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import type { VaultDraft } from "@/lib/supabase";

// 300-char preview, truncated in JS before render (per Vera design brief) —
// prefer the excerpt (already a short summary) and fall back to the body.
function previewText(draft: VaultDraft, max = 300): string {
  const source = draft.excerpt ?? draft.body;
  return source.length > max ? `${source.slice(0, max)}…` : source;
}

function formatGeneratedAt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DraftReviewQueue() {
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<VaultDraft[]>([]);
  const [loading, setLoading] = useState(true);
  // Tracks which draft id currently has a publish/discard request in flight,
  // and which action, so the correct button shows its own loading state.
  const [actingOn, setActingOn] = useState<{ id: string; action: "publish" | "discard" } | null>(null);

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/content-automation/drafts?status=pending");
      if (!res.ok) throw new Error("Failed to load drafts");
      const json = await res.json();
      setDrafts((json.data ?? []) as VaultDraft[]);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Failed to load drafts");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleReview = async (draft: VaultDraft, action: "publish" | "discard") => {
    setActingOn({ id: draft.id, action });
    try {
      const res = await fetch(`/api/admin/content-automation/drafts/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // 404 (not found) or 409 (already reviewed by someone else) both mean
        // this draft no longer belongs in the pending queue — drop it from
        // the list either way so the UI doesn't show a stale actionable card.
        if (res.status === 404 || res.status === 409) {
          setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
        }
        throw new Error(json.error ?? `Failed to ${action} draft`);
      }
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
      toast(
        "success",
        action === "publish" ? "Draft published — now live in the Vault." : "Draft discarded."
      );
    } catch (err) {
      toast("error", err instanceof Error ? err.message : `Failed to ${action} draft`);
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-klo-muted">
          {drafts.length} pending draft{drafts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <RefreshCw size={24} className="animate-spin text-klo-muted" />
        </div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-12 text-klo-muted text-sm glass rounded-2xl border border-white/5">
          No pending drafts. The next batch generates Monday at 9am.
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {drafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                isPublishing={actingOn?.id === draft.id && actingOn.action === "publish"}
                isDiscarding={actingOn?.id === draft.id && actingOn.action === "discard"}
                disabled={actingOn !== null && actingOn.id !== draft.id}
                onPublish={() => handleReview(draft, "publish")}
                onDiscard={() => handleReview(draft, "discard")}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function DraftCard({
  draft,
  isPublishing,
  isDiscarding,
  disabled,
  onPublish,
  onDiscard,
}: {
  draft: VaultDraft;
  isPublishing: boolean;
  isDiscarding: boolean;
  disabled: boolean;
  onPublish: () => void;
  onDiscard: () => void;
}) {
  const busy = isPublishing || isDiscarding;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-klo-dark/30 border border-white/5 hover:border-white/10 transition-all"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <FileText size={14} className="text-klo-muted shrink-0 mt-0.5" />
          <h4 className="text-sm font-medium text-klo-text truncate flex-1">{draft.title}</h4>
        </div>
        <p className="text-xs text-klo-muted mt-1 line-clamp-3">{previewText(draft)}</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-klo-accent/10 text-klo-accent">
            {draft.category}
          </span>
          <span className="text-[10px] text-klo-muted">{formatGeneratedAt(draft.generated_at)}</span>
          {draft.topic_source && (
            <span className="text-[10px] text-klo-muted">{draft.topic_source}</span>
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
    </motion.div>
  );
}
