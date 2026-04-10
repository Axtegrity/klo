"use client";

import { useState } from "react";
import {
  ImageIcon,
  Sparkles,
  LayoutGrid,
  Music,
  Palette,
  FileStack,
} from "lucide-react";
import type { StudioPanel } from "@/types/creative-studio";
import MediaLibraryPanel from "./media-library/MediaLibraryPanel";
import AnimationBuilderPanel from "./animation-builder/AnimationBuilderPanel";
import ThemeDesignerPanel from "./theme-designer/ThemeDesignerPanel";
import MusicManagerPanel from "./music-manager/MusicManagerPanel";
import LayoutEditorPanel from "./layout-editor/LayoutEditorPanel";
import PageComposerPanel from "./page-composer/PageComposerPanel";

const panels: { id: StudioPanel; label: string; icon: React.ElementType }[] = [
  { id: "media-library", label: "Media", icon: ImageIcon },
  { id: "animation-builder", label: "Animations", icon: Sparkles },
  { id: "layout-editor", label: "Layout", icon: LayoutGrid },
  { id: "music-manager", label: "Music", icon: Music },
  { id: "theme-designer", label: "Theme", icon: Palette },
  { id: "page-composer", label: "Pages", icon: FileStack },
];

export default function CreativeStudioTab() {
  const [activePanel, setActivePanel] = useState<StudioPanel>("media-library");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-xl font-semibold text-klo-text">
          Creative Studio
        </h2>
        <p className="text-sm text-klo-muted mt-1">
          Design your app visually — media, animations, layout, music, and
          themes.
        </p>
      </div>

      {/* Segmented Control */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-klo-dark/50 border border-white/5">
        {panels.map((panel) => {
          const Icon = panel.icon;
          return (
            <button
              key={panel.id}
              onClick={() => setActivePanel(panel.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer min-h-[44px] ${
                activePanel === panel.id
                  ? "bg-klo-slate text-klo-text shadow-md"
                  : "text-klo-muted hover:text-klo-text"
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{panel.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel Content */}
      {activePanel === "media-library" && <MediaLibraryPanel />}
      {activePanel === "animation-builder" && <AnimationBuilderPanel />}
      {activePanel === "layout-editor" && <LayoutEditorPanel />}
      {activePanel === "music-manager" && <MusicManagerPanel />}
      {activePanel === "theme-designer" && <ThemeDesignerPanel />}
      {activePanel === "page-composer" && <PageComposerPanel />}
    </div>
  );
}
