"use client";

import { useState } from "react";
import { Home, BookOpen, Rss } from "lucide-react";
import HomeContentManager from "./content-manager/HomeContentManager";
import VaultContentManager from "./content-manager/VaultContentManager";
import FeedContentManager from "./content-manager/FeedContentManager";

type Section = "home" | "vault" | "feed";

const sections: { id: Section; label: string; icon: React.ElementType; count: number }[] = [
  { id: "home", label: "Home Page", icon: Home, count: 7 },
  { id: "vault", label: "Vault Library", icon: BookOpen, count: 12 },
  { id: "feed", label: "Feed Posts", icon: Rss, count: 8 },
];

export default function ContentManagerTab() {
  const [activeSection, setActiveSection] = useState<Section>("home");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-xl font-semibold text-klo-text">
          Content Manager
        </h2>
        <p className="text-sm text-klo-muted mt-1">
          Add, edit, and organize all content across your app. Upload files and manage what visitors see.
        </p>
      </div>

      {/* Section Selector */}
      <div className="flex gap-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex-1 flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                activeSection === section.id
                  ? "bg-[#2764FF]/10 border-[#2764FF]/30 text-klo-text"
                  : "bg-klo-dark/30 border-white/5 text-klo-muted hover:text-klo-text hover:border-white/10"
              }`}
            >
              <Icon size={20} />
              <div className="text-left">
                <p className="text-sm font-medium">{section.label}</p>
                <p className="text-xs text-klo-muted">{section.count} items</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeSection === "home" && <HomeContentManager />}
      {activeSection === "vault" && <VaultContentManager />}
      {activeSection === "feed" && <FeedContentManager />}
    </div>
  );
}
