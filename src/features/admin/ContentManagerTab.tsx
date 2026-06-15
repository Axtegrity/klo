"use client";

import { useState } from "react";
import { Home, BookOpen, Rss, Archive, User } from "lucide-react";
import HomeContentManager from "./content-manager/HomeContentManager";
import VaultContentManager from "./content-manager/VaultContentManager";
import FeedContentManager from "./content-manager/FeedContentManager";
import ContentRepository from "./content-manager/ContentRepository";
import AboutContentManager from "./AboutContentManager";

type Section = "home" | "about" | "vault" | "feed" | "repository";

const sections: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "home", label: "Home Page", icon: Home },
  { id: "about", label: "About Page", icon: User },
  { id: "vault", label: "Vault Library", icon: BookOpen },
  { id: "feed", label: "Feed Posts", icon: Rss },
  { id: "repository", label: "Repository", icon: Archive },
];

export default function ContentManagerTab() {
  const [activeSection, setActiveSection] = useState<Section>("vault");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-xl font-semibold text-klo-text">
          Content Manager
        </h2>
        <p className="text-sm text-klo-muted mt-1">
          Add, edit, hide, or archive content. Archived items move to the Repository and remain available as reference for KLO Intelligence.
        </p>
      </div>

      {/* Section Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer min-h-[44px] ${
                activeSection === section.id
                  ? "bg-[#2764FF]/10 border-[#2764FF]/30 text-klo-text"
                  : "bg-klo-dark/30 border-white/5 text-klo-muted hover:text-klo-text hover:border-white/10"
              }`}
            >
              <Icon size={20} />
              <p className="text-sm font-medium">{section.label}</p>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeSection === "home" && <HomeContentManager />}
      {activeSection === "about" && <AboutContentManager />}
      {activeSection === "vault" && <VaultContentManager />}
      {activeSection === "feed" && <FeedContentManager />}
      {activeSection === "repository" && <ContentRepository />}
    </div>
  );
}
