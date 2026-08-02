"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import Button from "@/components/shared/Button";
import { useToast } from "@/contexts/ToastContext";

interface BackfillStatus {
  published_count: number;
  embedded_count: number;
  needs_backfill: boolean;
}

interface BackfillResult {
  processed: number;
  skipped: number;
  errors: number;
}

// Sits at the bottom of the Content Automation admin page (below all four
// sub-sections, not inside any one of them — see ContentAutomationTab.tsx)
// since it's a one-time/occasional maintenance action, not part of the
// regular Draft/Lanes/Sources/Tool review workflow. Only renders once the
// status check confirms embedded_count < published_count — otherwise a
// permanently-visible button would just be a no-op most of the time.
export default function EmbeddingsBackfillButton() {
  const { toast } = useToast();
  const [status, setStatus] = useState<BackfillStatus | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BackfillResult | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/content-automation/embeddings/backfill");
      if (!res.ok) return;
      setStatus((await res.json()) as BackfillStatus);
    } catch {
      // Silent — a failed status check just means the button doesn't show,
      // not an error worth surfacing on an otherwise-working admin page.
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleBackfill = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/content-automation/embeddings/backfill", {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Backfill failed");

      setResult(json as BackfillResult);
      toast("success", "Embeddings backfill complete.");
      await fetchStatus(); // re-check — button hides itself once caught up
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Backfill failed");
    } finally {
      setRunning(false);
    }
  };

  if (!status?.needs_backfill) return null;

  const totalAttempted = result ? result.processed + result.skipped + result.errors : 0;

  return (
    <div className="pt-8 mt-8 border-t border-white/5 flex flex-col items-start gap-2">
      <Button variant="secondary" size="sm" onClick={handleBackfill} disabled={running}>
        {running ? <RefreshCw size={14} className="animate-spin" /> : null}
        {running ? "Backfilling..." : "Backfill Embeddings"}
      </Button>
      {result && (
        <p className="text-xs text-klo-muted">
          Processed {totalAttempted} of {status.published_count} articles
          {result.errors > 0 ? ` (${result.errors} error${result.errors === 1 ? "" : "s"})` : ""}.
        </p>
      )}
    </div>
  );
}
