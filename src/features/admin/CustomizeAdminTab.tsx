"use client";

import { useState } from "react";
import { Palette, LayoutGrid } from "lucide-react";
import BrandColorsPanel from "./customize/BrandColorsPanel";
import PagesFeaturesPanel from "./customize/PagesFeaturesPanel";

type Panel = "colors" | "pages";

const panels: { id: Panel; label: string; icon: React.ElementType }[] = [
  { id: "colors", label: "Brand Colors", icon: Palette },
  { id: "pages", label: "Pages & Features", icon: LayoutGrid },
];

export default function CustomizeAdminTab() {
  const [activePanel, setActivePanel] = useState<Panel>("colors");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-xl font-semibold text-klo-text">
          Customize Your App
        </h2>
        <p className="text-sm text-klo-muted mt-1">
          Change brand colors and control which features are active.
        </p>
      </div>

      {/* Segmented Control */}
      <div className="inline-flex p-1 rounded-xl bg-klo-dark/50 border border-white/5">
        {panels.map((panel) => {
          const Icon = panel.icon;
          return (
            <button
              key={panel.id}
              onClick={() => setActivePanel(panel.id)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer min-h-[44px] ${
                activePanel === panel.id
                  ? "bg-klo-slate text-klo-text shadow-md"
                  : "text-klo-muted hover:text-klo-text"
              }`}
            >
              <Icon size={16} />
              {panel.label}
            </button>
          );
        })}
      </div>

      {/* Panel Content */}
      {activePanel === "colors" && <BrandColorsPanel />}
      {activePanel === "pages" && <PagesFeaturesPanel />}
    </div>
  );
}
