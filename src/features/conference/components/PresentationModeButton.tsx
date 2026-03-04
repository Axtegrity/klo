"use client";

import { Monitor } from "lucide-react";

export default function PresentationModeButton() {
  const openMonitor = () => {
    window.open("/conference/monitor", "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={openMonitor}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-klo-slate border border-white/10 text-klo-muted hover:text-klo-text transition-colors text-sm"
    >
      <Monitor size={16} />
      Monitor View
    </button>
  );
}
