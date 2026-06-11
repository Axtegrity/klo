"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Search, X, Download, FileText, CalendarDays } from "lucide-react";
import CategoryTabs from "@/components/vault/CategoryTabs";
import FilterBar from "@/components/vault/FilterBar";
import ContentCard from "@/components/vault/ContentCard";
import { VAULT_CATEGORIES } from "@/lib/vault-data";
import type { VaultItem } from "@/lib/vault-data";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const allCategories = ["All", ...VAULT_CATEGORIES];

export default function VaultPage() {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  // Lazy-init from the URL ?tab= param so we don't need a useEffect that
  // calls setState on mount (which trips react-hooks/set-state-in-effect).
  const [activeCategory, setActiveCategory] = useState(() => {
    const tab = searchParams.get("tab");
    if (tab && [...VAULT_CATEGORIES, "All"].includes(tab)) return tab;
    return "All";
  });
  const [level, setLevel] = useState("");
  const [type, setType] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [eventPresentations, setEventPresentations] = useState<{
    id: string;
    title: string;
    conference_name: string;
    conference_location: string;
    event_date: string;
    slug: string;
    event_files: { id: string; file_name: string; file_type: string; file_url: string; file_size: string | null }[];
  }[]>([]);

  // Fetch published vault items from Supabase (via /api/content/vault).
  // vault_content is the sole source of truth — event presentations are
  // NOT merged in here. They live on /events and are controlled by
  // is_published in the Events admin tab. Merging them here meant the
  // Vault Content Manager's Hide toggle had no effect on them, which
  // broke the admin's mental model (ghost CMS, fixed 2026-04-11).
  useEffect(() => {
    fetch("/api/content/vault")
      .then((res) => res.json())
      .then((json) => setVaultItems(json.data ?? []))
      .catch((err) => console.error("Failed to fetch vault:", err));
    fetch("/api/vault/event-presentations")
      .then((res) => res.json())
      .then((json) => Array.isArray(json) && setEventPresentations(json))
      .catch(() => {});
  }, []);

  const allItems = useMemo(() => vaultItems, [vaultItems]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Search filter
      if (search) {
        const q = search.toLowerCase();
        const matchesSearch =
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (activeCategory !== "All" && item.category !== activeCategory) {
        return false;
      }

      // Level filter
      if (level && item.level !== level) return false;

      // Type filter
      if (type && item.type !== type) return false;

      // Premium filter
      if (freeOnly && item.isPremium) return false;

      return true;
    });
  }, [search, activeCategory, level, type, freeOnly, allItems]);

  const clearFilters = () => {
    setSearch("");
    setActiveCategory("All");
    setLevel("");
    setType("");
    setFreeOnly(false);
  };

  const hasActiveFilters =
    search || activeCategory !== "All" || level || type || freeOnly;

  return (
    <div className="min-h-screen px-6 py-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mb-10"
        >
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#2764FF]/10 flex items-center justify-center">
              <BookOpen size={24} className="text-[#2764FF]" />
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-klo-text">
                Insight Vault
              </h1>
            </div>
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={1}
            className="text-klo-muted text-base leading-relaxed max-w-2xl"
          >
            A curated library of exclusive articles, whitepapers, frameworks,
            and video content from Keith L. Odom. Premium resources for leaders
            who demand depth, clarity, and actionable intelligence.
          </motion.p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" as const }}
          className="mb-6"
        >
          <div className="relative max-w-xl">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-klo-muted"
            />
            <input
              type="text"
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#161B22] border border-[#21262D] rounded-xl pl-11 pr-10 py-3 text-sm text-klo-text placeholder:text-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#2764FF]/50 focus:border-[#2764FF]/50 transition-all duration-200"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-klo-muted hover:text-klo-text transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Category tabs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4, ease: "easeOut" as const }}
          className="mb-5"
        >
          <CategoryTabs
            categories={allCategories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </motion.div>

        {/* Filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" as const }}
          className="mb-8"
        >
          <FilterBar
            level={level}
            type={type}
            freeOnly={freeOnly}
            onLevelChange={setLevel}
            onTypeChange={setType}
            onFreeOnlyChange={setFreeOnly}
          />
        </motion.div>

        {/* Results count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.3, ease: "easeOut" as const }}
          className="flex items-center justify-between mb-6"
        >
          <p className="text-sm text-klo-muted">
            Showing{" "}
            <span className="text-klo-text font-medium">
              {filteredItems.length}
            </span>{" "}
            of{" "}
            <span className="text-klo-text font-medium">
              {allItems.length}
            </span>{" "}
            resources
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-[#2764FF] hover:text-[#2764FF]/80 transition-colors cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </motion.div>

        {/* Content grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, i) => (
              <ContentCard key={item.id} item={item} index={i} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" as const }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
              <Search size={28} className="text-klo-muted" />
            </div>
            <h3 className="font-display text-lg font-semibold text-klo-text mb-2">
              No resources found
            </h3>
            <p className="text-sm text-klo-muted mb-6 max-w-md mx-auto">
              Try adjusting your search terms or filters to find what you are
              looking for.
            </p>
            <button
              onClick={clearFilters}
              className="text-sm text-klo-gold hover:text-klo-gold/80 transition-colors cursor-pointer font-medium"
            >
              Clear all filters
            </button>
          </motion.div>
        )}
        {/* Past Event Presentations — free, separate from vault_content */}
        {eventPresentations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" as const }}
            className="mt-16 pt-10 border-t border-white/5"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#2764FF]/10 flex items-center justify-center">
                <FileText size={20} className="text-[#2764FF]" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-klo-text">Past Event Presentations</h2>
                <p className="text-sm text-klo-muted">Slides and materials from previous sessions — free to download</p>
              </div>
            </div>
            <div className="space-y-4">
              {eventPresentations.map((ev) => (
                <div key={ev.id} className="glass rounded-2xl border border-white/5 overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/5">
                    <p className="font-semibold text-klo-text">{ev.conference_name || ev.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-klo-muted">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={11} />
                        {new Date(ev.event_date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </span>
                      <span>{ev.conference_location}</span>
                    </div>
                  </div>
                  <div className="divide-y divide-white/5">
                    {ev.event_files.map((file) => (
                      <div key={file.id} className="flex items-center gap-3 px-5 py-3">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#2764FF]/10 text-[#2764FF] shrink-0">
                          {file.file_type}
                        </span>
                        <span className="text-sm text-klo-text truncate flex-1">{file.file_name}</span>
                        {file.file_size && <span className="text-xs text-klo-muted shrink-0">{file.file_size}</span>}
                        <a
                          href={file.file_url}
                          download
                          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#2764FF] hover:bg-[#2764FF]/80 text-white text-xs font-semibold transition-colors"
                        >
                          <Download size={12} />
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
