"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  RefreshCw,
  FileText,
  Sparkles,
  Paperclip,
  Loader2,
  AlertCircle,
  ChevronDown,
  Eye,
  CalendarClock,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/contexts/ToastContext";
import { getSupabase } from "@/lib/supabase";
import type { VaultDraft } from "@/lib/supabase";
import Modal from "@/components/shared/Modal";

const MAX_REFERENCE_FILE_SIZE = 10 * 1024 * 1024; // 10MB — matches contentAutomationSignUploadSchema
const ALLOWED_REFERENCE_EXTENSIONS = ["pdf", "docx"];

// Client-side-only cooldown between Generate runs — a UX safeguard against
// accidental repeat-clicking, not a security boundary (a single research
// call has been measured at 137K-193K input tokens, so repeat clicks have a
// real cost). Applies after both success AND failure — a failed run still
// spent tokens if it got partway through.
const GENERATE_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

function formatCooldown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

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

function formatScheduledFor(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type ReviewAction = "publish" | "discard" | "schedule" | "cancel_schedule";

// Client-side mirror of extractCitedSourceUrls() in src/lib/claude.ts — same
// `## Sources` heading + `- [Label](URL)` link shape the backend validates
// against, but also captures the label text (the server-side helper only
// needs URLs for validation; the UI needs the label to render a link).
function parseDraftSources(body: string): { label: string; url: string }[] {
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

function validateReferenceFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_REFERENCE_EXTENSIONS.includes(ext)) {
    return "Only .pdf and .docx files are allowed.";
  }
  if (file.size > MAX_REFERENCE_FILE_SIZE) {
    return `File exceeds 10MB limit. (${(file.size / 1024 / 1024).toFixed(1)}MB)`;
  }
  return null;
}

export default function DraftReviewQueue() {
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<VaultDraft[]>([]);
  const [loading, setLoading] = useState(true);
  // Tracks which draft id currently has a review request in flight, and
  // which action, so the correct button shows its own loading state.
  const [actingOn, setActingOn] = useState<{ id: string; action: ReviewAction } | null>(null);

  // Generate run controls — guidance/reference-file are optional inputs on
  // an on-demand run only; the weekly cron path is unaffected by any of
  // this state (see generate/route.ts).
  const [guidance, setGuidance] = useState("");
  const [referenceFilePath, setReferenceFilePath] = useState<string | null>(null);
  const [referenceFileName, setReferenceFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate cooldown — set to a future timestamp when a run completes
  // (success or failure); ticks down every second and clears itself once
  // expired. See GENERATE_COOLDOWN_MS above.
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

  // The queue shows both pending and scheduled drafts (scheduled ones with
  // a badge + Cancel Schedule instead of Publish/Discard) — two requests
  // merged client-side rather than widening the GET route to accept
  // multiple statuses in one call.
  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, scheduledRes] = await Promise.all([
        fetch("/api/admin/content-automation/drafts?status=pending"),
        fetch("/api/admin/content-automation/drafts?status=scheduled"),
      ]);
      if (!pendingRes.ok || !scheduledRes.ok) throw new Error("Failed to load drafts");
      const [pendingJson, scheduledJson] = await Promise.all([
        pendingRes.json(),
        scheduledRes.json(),
      ]);
      const merged = [
        ...((pendingJson.data ?? []) as VaultDraft[]),
        ...((scheduledJson.data ?? []) as VaultDraft[]),
      ].sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime());
      setDrafts(merged);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Failed to load drafts");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const reviewMessages: Record<ReviewAction, string> = {
    publish: "Draft published — now live in the Vault.",
    discard: "Draft discarded.",
    schedule: "Draft scheduled.",
    cancel_schedule: "Schedule cancelled — draft is pending again.",
  };

  const handleReview = async (
    draft: VaultDraft,
    action: ReviewAction,
    scheduledPublishAt?: string
  ) => {
    setActingOn({ id: draft.id, action });
    try {
      const res = await fetch(`/api/admin/content-automation/drafts/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "schedule" ? { action, scheduled_publish_at: scheduledPublishAt } : { action }
        ),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // 404 (not found) or 409 (already reviewed by someone else) both mean
        // this draft no longer belongs in the queue as shown — drop it from
        // the list either way so the UI doesn't show a stale actionable card.
        if (res.status === 404 || res.status === 409) {
          setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
        }
        const fieldError = json.details?.fieldErrors?.scheduled_publish_at?.[0];
        throw new Error(fieldError ?? json.error ?? `Failed to ${action} draft`);
      }

      if (action === "schedule" || action === "cancel_schedule") {
        // Status changed but the draft stays in this queue — update it in
        // place instead of removing it.
        setDrafts((prev) => prev.map((d) => (d.id === draft.id ? (json.data as VaultDraft) : d)));
      } else {
        setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
      }
      toast("success", reviewMessages[action]);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : `Failed to ${action} draft`);
    } finally {
      setActingOn(null);
    }
  };

  const handleFileSelect = async (file: File) => {
    const validationError = validateReferenceFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const signRes = await fetch("/api/admin/content-automation/sign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileSize: file.size }),
      });
      const signData = await signRes.json().catch(() => ({}));
      if (!signRes.ok) {
        setUploadError(signData.error ?? "Upload failed");
        return;
      }

      const { error: uploadErr } = await getSupabase()
        .storage.from("documents")
        .uploadToSignedUrl(signData.path, signData.token, file);
      if (uploadErr) {
        setUploadError(uploadErr.message || "Upload failed");
        return;
      }

      setReferenceFilePath(signData.path as string);
      setReferenceFileName(file.name);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setReferenceFilePath(null);
    setReferenceFileName(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setWarnings([]);
    try {
      const res = await fetch("/api/admin/content-automation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guidance: guidance.trim() || undefined,
          referenceFilePath: referenceFilePath ?? undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Generation run failed");

      setWarnings((json.warnings ?? []) as string[]);
      toast(
        "success",
        json.generated > 0
          ? `Generated ${json.generated} new draft${json.generated !== 1 ? "s" : ""}.`
          : "Generation run finished — no new drafts (see warnings below)."
      );

      // Guidance/reference-file apply to a single Generate click only — clear
      // them after a successful run so stale direction/attachments don't get
      // silently resent on the next click (spec: "Clear the textarea and
      // file after a successful generation run"). Do NOT clear on failure —
      // a failed run should let the admin retry as-is without re-entering
      // everything.
      setGuidance("");
      setReferenceFilePath(null);
      setReferenceFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      await fetchDrafts();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Generation run failed");
    } finally {
      setGenerating(false);
      // Start the cooldown regardless of outcome — a failed run still cost
      // tokens if it got partway through the research call.
      setCooldownUntil(Date.now() + GENERATE_COOLDOWN_MS);
    }
  };

  const pendingCount = drafts.filter((d) => d.status === "pending").length;
  const scheduledCount = drafts.filter((d) => d.status === "scheduled").length;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-klo-muted">
          {pendingCount} pending draft{pendingCount !== 1 ? "s" : ""}
          {scheduledCount > 0 &&
            ` · ${scheduledCount} scheduled draft${scheduledCount !== 1 ? "s" : ""}`}
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

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
          {referenceFileName ? (
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-klo-dark/50 border border-white/5 text-xs">
              <FileText size={14} className="text-klo-muted shrink-0" />
              <span className="text-klo-text truncate max-w-[200px]">{referenceFileName}</span>
              <button
                onClick={handleRemoveFile}
                className="min-h-[32px] min-w-[32px] flex items-center justify-center hover:text-red-400 text-klo-muted transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-white/10 hover:border-klo-accent/30 text-klo-muted hover:text-klo-text text-xs font-medium min-h-[36px] transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
              {uploading ? "Uploading..." : "Attach reference (PDF or Word, max 10MB)"}
            </button>
          )}
          {uploadError && <p className="text-xs text-red-400 mt-1">{uploadError}</p>}
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating || uploading || cooldownRemainingMs > 0}
        className="inline-flex items-center gap-2 bg-klo-accent text-white px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px] disabled:opacity-50"
      >
        {generating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {generating
          ? "Generating..."
          : cooldownRemainingMs > 0
            ? `Available in ${formatCooldown(cooldownRemainingMs)}`
            : "Generate Drafts"}
      </button>

      {warnings.length > 0 && (
        <div className="space-y-2 mt-3">
          {warnings.map((warning, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-amber-500/5 border-amber-500/20"
            >
              <AlertCircle size={16} className="text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-300">{warning}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <RefreshCw size={24} className="animate-spin text-klo-muted" />
        </div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-12 text-klo-muted text-sm glass rounded-2xl border border-white/5">
          No pending or scheduled drafts. The next batch generates Monday at 9am, or click Generate Drafts above to run now.
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
                isScheduling={actingOn?.id === draft.id && actingOn.action === "schedule"}
                isCancellingSchedule={actingOn?.id === draft.id && actingOn.action === "cancel_schedule"}
                disabled={actingOn !== null && actingOn.id !== draft.id}
                onPublish={() => handleReview(draft, "publish")}
                onDiscard={() => handleReview(draft, "discard")}
                onSchedule={(scheduledPublishAt) => handleReview(draft, "schedule", scheduledPublishAt)}
                onCancelSchedule={() => handleReview(draft, "cancel_schedule")}
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
  isScheduling,
  isCancellingSchedule,
  disabled,
  onPublish,
  onDiscard,
  onSchedule,
  onCancelSchedule,
}: {
  draft: VaultDraft;
  isPublishing: boolean;
  isDiscarding: boolean;
  isScheduling: boolean;
  isCancellingSchedule: boolean;
  disabled: boolean;
  onPublish: () => void;
  onDiscard: () => void;
  onSchedule: (scheduledPublishAt: string) => void;
  onCancelSchedule: () => void;
}) {
  const busy = isPublishing || isDiscarding || isScheduling || isCancellingSchedule;
  const isScheduled = draft.status === "scheduled";
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  // datetime-local input value — shared between the card and the preview
  // modal's picker so picking a date in either place carries over.
  const [scheduleInput, setScheduleInput] = useState("");
  const sources = useMemo(() => parseDraftSources(draft.body), [draft.body]);

  const handleScheduleClick = () => {
    if (!scheduleInput) return;
    onSchedule(new Date(scheduleInput).toISOString());
  };

  // The draft gets removed from (or updated in) the parent list on a
  // successful review action, which would unmount this card mid-request.
  // Close the modal synchronously here (before the async PATCH resolves)
  // rather than relying on the list re-render to make it moot — avoids a
  // "state update on unmounted component" warning from Modal's own
  // isOpen-driven effects.
  const handleModalPublish = () => {
    setPreviewOpen(false);
    onPublish();
  };
  const handleModalDiscard = () => {
    setPreviewOpen(false);
    onDiscard();
  };
  const handleModalSchedule = () => {
    if (!scheduleInput) return;
    setPreviewOpen(false);
    onSchedule(new Date(scheduleInput).toISOString());
  };
  const handleModalCancelSchedule = () => {
    setPreviewOpen(false);
    onCancelSchedule();
  };

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
          {isScheduled ? (
            <div className="flex flex-col items-end gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded bg-klo-accent/10 text-klo-accent font-medium">
                <CalendarClock size={12} />
                Scheduled for {formatScheduledFor(draft.scheduled_publish_at!)}
              </span>
              <button
                onClick={onCancelSchedule}
                disabled={disabled || busy}
                className="inline-flex items-center gap-1.5 text-klo-muted hover:text-klo-text hover:bg-white/5 rounded-lg px-3 py-1.5 text-xs font-medium min-h-[36px] disabled:opacity-50"
              >
                {isCancellingSchedule ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <X size={14} />
                )}
                Cancel Schedule
              </button>
            </div>
          ) : (
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
              {scheduleInput && (
                <button
                  onClick={handleScheduleClick}
                  disabled={disabled || busy}
                  className="inline-flex items-center gap-1.5 bg-klo-accent/10 border border-klo-accent/20 text-klo-accent hover:bg-klo-accent/20 rounded-lg px-3 py-1.5 text-xs font-medium min-h-[36px] disabled:opacity-50"
                >
                  {isScheduling ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <CalendarClock size={14} />
                  )}
                  Schedule
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {!isScheduled && (
        <label className="block mt-3">
          <span className="text-[10px] text-klo-muted mb-1 block">Schedule publish (optional)</span>
          <input
            type="datetime-local"
            value={scheduleInput}
            onChange={(e) => setScheduleInput(e.target.value)}
            disabled={disabled || busy}
            className="px-3 py-2 rounded-lg bg-klo-dark/50 border border-white/5 text-klo-text text-xs disabled:opacity-50 focus:outline-none focus:border-klo-accent/50"
          />
        </label>
      )}

      <div className="mt-3">
        <button
          onClick={() => setPreviewOpen(true)}
          disabled={disabled || busy}
          className="inline-flex items-center gap-1.5 text-klo-muted hover:text-klo-text hover:bg-white/5 rounded-lg px-3 py-1.5 text-xs font-medium min-h-[36px] disabled:opacity-50"
        >
          <Eye size={14} />
          Preview
        </button>
      </div>

      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={draft.title}
        size="lg"
      >
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
              {draft.body}
            </ReactMarkdown>
          </div>
        </div>

        {isScheduled ? (
          <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-white/5">
            <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-klo-accent/10 text-klo-accent font-medium">
              <CalendarClock size={13} />
              Scheduled for {formatScheduledFor(draft.scheduled_publish_at!)}
            </span>
            <button
              onClick={handleModalCancelSchedule}
              disabled={disabled || busy}
              className="inline-flex items-center gap-1.5 text-klo-muted hover:text-klo-text hover:bg-white/5 rounded-lg px-3 py-1.5 text-xs font-medium min-h-[36px] disabled:opacity-50"
            >
              {isCancellingSchedule ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <X size={14} />
              )}
              Cancel Schedule
            </button>
          </div>
        ) : (
          <div className="pt-4 mt-4 border-t border-white/5 space-y-3">
            <label className="block">
              <span className="text-xs text-klo-muted mb-1 block">Schedule publish (optional)</span>
              <input
                type="datetime-local"
                value={scheduleInput}
                onChange={(e) => setScheduleInput(e.target.value)}
                disabled={disabled || busy}
                className="px-3 py-2 rounded-lg bg-klo-dark/50 border border-white/5 text-klo-text text-xs disabled:opacity-50 focus:outline-none focus:border-klo-accent/50"
              />
            </label>
            <div className="flex items-center justify-end gap-2">
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
              {scheduleInput && (
                <button
                  onClick={handleModalSchedule}
                  disabled={disabled || busy}
                  className="inline-flex items-center gap-1.5 bg-klo-accent/10 border border-klo-accent/20 text-klo-accent hover:bg-klo-accent/20 rounded-lg px-3 py-1.5 text-xs font-medium min-h-[36px] disabled:opacity-50"
                >
                  {isScheduling ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <CalendarClock size={14} />
                  )}
                  Schedule
                </button>
              )}
            </div>
          </div>
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
