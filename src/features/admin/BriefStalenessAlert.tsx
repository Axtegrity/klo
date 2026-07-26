"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, X } from "lucide-react";

// Per-tab-session dismiss only (not permanent) — reappears on a fresh
// session if the brief is still stale next time. Deliberately not
// localStorage: this is a low-friction nudge, not something an admin should
// be able to silence forever by accident. (Vera design brief, 2026-07-26.)
const DISMISS_KEY = "klo-brief-staleness-dismissed";

interface BriefStatus {
  days_since_update: number | null;
  is_stale: boolean;
  last_updated: string | null;
}

// Amber, never red — this is a reminder ("consider publishing a new one"),
// not an error. Container/icon/text treatment matches the existing
// Insufficient Sources warning precedent in DraftReviewQueue.tsx exactly,
// but uses Clock (time-elapsed) rather than AlertCircle (already this
// codebase's "something's missing/wrong" signal) so the nudge/error
// distinction stays visible at a glance. (Vera design brief, 2026-07-26.)
export default function BriefStalenessAlert() {
  const router = useRouter();
  const [status, setStatus] = useState<BriefStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Deferred to a microtask so react-hooks/set-state-in-effect doesn't
    // flag a synchronous setState in the effect body — same workaround as
    // the first-visit tooltip in HomeEditor.tsx. Visual result is identical.
    if (typeof window !== "undefined" && sessionStorage.getItem(DISMISS_KEY)) {
      Promise.resolve().then(() => setDismissed(true));
    }

    fetch("/api/admin/content-automation/brief-status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStatus(data as BriefStatus);
      })
      .catch(() => {
        // Silent — a failed staleness check just means no banner, not an
        // error worth surfacing on the dashboard.
      });
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(DISMISS_KEY, "1");
    }
  };

  if (!status?.is_stale || dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-amber-500/5 border-amber-500/20"
    >
      <Clock size={16} className="text-amber-400 shrink-0" />
      <p className="text-sm font-medium text-amber-300 flex-1">
        The Latest Intelligence Brief was last updated {status.days_since_update} day
        {status.days_since_update === 1 ? "" : "s"} ago. Consider publishing a new one.
      </p>
      <button
        onClick={() => router.push("/admin?tab=content-manager")}
        className="text-sm font-semibold text-amber-300 underline underline-offset-2 hover:text-amber-200 shrink-0"
      >
        Open Content tab
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="text-amber-400/60 hover:text-amber-400 shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
