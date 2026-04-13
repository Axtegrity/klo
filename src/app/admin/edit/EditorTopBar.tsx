"use client";

// EditorTopBar — sticky bar rendered at the top of /admin/edit.
// Sits above the site nav (z-[100]). Contains:
//   Left:   page title + unsaved-changes indicator
//   Center: viewport size toggle (Mobile/Tablet/Desktop)
//   Right:  Advanced link | Discard | Publish | Exit

import { useRouter } from "next/navigation";
import { Monitor, Tablet, Smartphone, ChevronDown, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useEditMode } from "@/contexts/EditModeContext";
import type { ViewportSize } from "@/types/creative-studio";

interface EditorTopBarProps {
  viewport: ViewportSize;
  onViewportChange: (v: ViewportSize) => void;
}

const VIEWPORTS: { size: ViewportSize; label: string; Icon: React.ElementType }[] = [
  { size: 390, label: "Mobile", Icon: Smartphone },
  { size: 768, label: "Tablet", Icon: Tablet },
  { size: 1440, label: "Desktop", Icon: Monitor },
];

export default function EditorTopBar({
  viewport,
  onViewportChange,
}: EditorTopBarProps) {
  const router = useRouter();
  const { isDirty, isSaving, publish, discard } = useEditMode();
  const [publishing, setPublishing] = useState(false);
  const [justPublished, setJustPublished] = useState(false);
  const [viewportDropdownOpen, setViewportDropdownOpen] = useState(false);

  const activeVp = VIEWPORTS.find((v) => v.size === viewport) ?? VIEWPORTS[2];

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await publish();
      setJustPublished(true);
    } finally {
      setPublishing(false);
    }
  };

  // Auto-clear the justPublished flag after 2s.
  useEffect(() => {
    if (!justPublished) return;
    const t = setTimeout(() => setJustPublished(false), 2000);
    return () => clearTimeout(t);
  }, [justPublished]);

  const handleExit = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        "You have unsaved changes. Exit without publishing?"
      );
      if (!confirmed) return;
    }
    router.push("/admin");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-14 flex items-center px-3 sm:px-4 gap-2 bg-[#0D1117]/95 backdrop-blur border-b border-white/10">
      {/* ── Left: title + dirty indicator ── */}
      <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-none">
        <span className="text-sm font-semibold text-[#E6EDF3] truncate">
          Editing Home Page
        </span>
        {isDirty && (
          <span className="flex items-center gap-1 text-[10px] text-[#C8A84E] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8A84E] animate-pulse" />
            {isSaving ? "Saving…" : "Unsaved"}
          </span>
        )}
        {!isDirty && !isSaving && (
          <span className="text-[10px] text-[#8B949E] shrink-0">Saved</span>
        )}
      </div>

      {/* ── Center: viewport toggle (full row on sm+, dropdown on xs) ── */}
      <div className="flex-1 flex justify-center">
        {/* Full toggle — hidden below 600px */}
        <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-lg bg-[#161B22] border border-white/5">
          {VIEWPORTS.map(({ size, label, Icon }) => (
            <button
              key={size}
              type="button"
              onClick={() => onViewportChange(size)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium min-h-[32px] transition-colors ${
                viewport === size
                  ? "bg-[#21262D] text-[#E6EDF3] shadow-sm"
                  : "text-[#8B949E] hover:text-[#E6EDF3]"
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Dropdown — shown below 600px */}
        <div className="sm:hidden relative">
          <button
            type="button"
            onClick={() => setViewportDropdownOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161B22] border border-white/5 text-xs font-medium text-[#E6EDF3] min-h-[32px]"
          >
            <activeVp.Icon size={13} />
            {activeVp.label}
            <ChevronDown size={12} />
          </button>

          {viewportDropdownOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-36 rounded-xl bg-[#161B22] border border-white/10 overflow-hidden shadow-xl z-10">
              {VIEWPORTS.map(({ size, label, Icon }) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    onViewportChange(size);
                    setViewportDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                    viewport === size
                      ? "text-[#2764FF] bg-[#2764FF]/10"
                      : "text-[#8B949E] hover:text-[#E6EDF3] hover:bg-white/5"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Advanced | Discard | Publish ── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Advanced link — deep-links to Pages panel in Creative Studio */}
        <a
          href="/admin?tab=creative-studio&page=home"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#8B949E] hover:text-[#E6EDF3] transition-colors min-h-[32px]"
        >
          Advanced
        </a>

        <button
          type="button"
          onClick={() => {
            discard();
            router.refresh();
          }}
          disabled={!isDirty}
          className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-[#8B949E] hover:text-[#E6EDF3] hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[32px]"
        >
          Discard
        </button>

        <button
          type="button"
          onClick={handlePublish}
          disabled={publishing || isSaving}
          className={`px-4 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-all min-h-[32px] ${
            justPublished
              ? "bg-[#1a7f4b] hover:bg-[#1a7f4b]"
              : "bg-[#2764FF] hover:bg-[#1d50d4]"
          }`}
        >
          {publishing ? "Saving…" : justPublished ? "Published ✓" : "Publish"}
        </button>

        {/* Exit — collapses to icon-only below 600px */}
        <button
          type="button"
          onClick={handleExit}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all min-h-[32px] ${
            justPublished
              ? "border-[#1a7f4b]/60 text-[#1a7f4b] ring-1 ring-[#1a7f4b]/40 animate-pulse-once"
              : "border-white/10 text-[#8B949E] hover:text-[#E6EDF3] hover:border-white/20"
          }`}
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Exit</span>
        </button>
      </div>
    </div>
  );
}
