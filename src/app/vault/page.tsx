"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Search, X } from "lucide-react";
import CategoryTabs from "@/components/vault/CategoryTabs";
import FilterBar from "@/components/vault/FilterBar";
import ContentCard from "@/components/vault/ContentCard";
import { VAULT_CATEGORIES } from "@/lib/vault-data";
import type { VaultItem } from "@/lib/vault-data";
import { fetchEventItems } from "@/lib/vault-events";

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
  const [eventItems, setEventItems] = useState<VaultItem[]>([]);

  // Fetch published vault items from Supabase (via /api/content/vault)
  useEffect(() => {
    fetch("/api/content/vault")
      .then((res) => res.json())
      .then((json) => setVaultItems(json.data ?? []))
      .catch((err) => console.error("Failed to fetch vault:", err));
  }, []);

  // Fetch dynamic event items
  useEffect(() => {
    fetchEventItems().then(setEventItems);
  }, []);

  const allItems = useMemo(
    () => [...vaultItems, ...eventItems],
    [vaultItems, eventItems]
  );

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
      </div>
    </div>
  );
}
