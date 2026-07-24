"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  Search,
  X,
  Download,
  FileText,
  CalendarDays,
  LibraryBig,
  Lock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import CategoryTabs from "@/components/vault/CategoryTabs";
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

// Featured is always the 6 most recently *created* items (createdAt desc),
// never filtered by search/category. Library is everything else, and is
// where the search/category controls (relocated from the old single-grid
// page top) now live. See vault-featured-library-split spec, 2026-07-23.
const FEATURED_COUNT = 6;
const LIBRARY_PAGE_SIZE = 12;

export default function VaultPage() {
  const searchParams = useSearchParams();

  const [librarySearch, setLibrarySearch] = useState("");
  // Lazy-init from the URL ?tab= param so we don't need a useEffect that
  // calls setState on mount (which trips react-hooks/set-state-in-effect).
  const [libraryCategory, setLibraryCategory] = useState(() => {
    const tab = searchParams.get("tab");
    if (tab && [...VAULT_CATEGORIES, "All"].includes(tab)) return tab;
    return "All";
  });
  const [libraryPage, setLibraryPage] = useState(1);
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

  // Single sort, shared by both sections: createdAt desc (falling back to
  // publishedAt for any item missing createdAt — e.g. legacy rows). Featured
  // takes the first 6; Library gets the rest. Sorting once and slicing keeps
  // the two sections mutually exclusive without a separate dedupe pass.
  const sortedItems = useMemo(() => {
    return [...vaultItems].sort((a, b) => {
      const aTime = new Date(a.createdAt ?? a.publishedAt).getTime();
      const bTime = new Date(b.createdAt ?? b.publishedAt).getTime();
      return bTime - aTime;
    });
  }, [vaultItems]);

  const featuredItems = useMemo(
    () => sortedItems.slice(0, FEATURED_COUNT),
    [sortedItems],
  );

  const libraryAllItems = useMemo(
    () => sortedItems.slice(FEATURED_COUNT),
    [sortedItems],
  );

  const libraryCategories = useMemo(() => {
    const present = new Set(libraryAllItems.map((item) => item.category));
    return ["All", ...VAULT_CATEGORIES.filter((c) => present.has(c))];
  }, [libraryAllItems]);

  const filteredLibraryItems = useMemo(() => {
    return libraryAllItems.filter((item) => {
      if (librarySearch) {
        const q = librarySearch.toLowerCase();
        const matchesSearch =
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      if (libraryCategory !== "All" && item.category !== libraryCategory) {
        return false;
      }
      return true;
    });
  }, [librarySearch, libraryCategory, libraryAllItems]);

  const libraryTotalPages = Math.max(
    1,
    Math.ceil(filteredLibraryItems.length / LIBRARY_PAGE_SIZE),
  );
  // Clamp defensively — filteredLibraryItems can shrink out from under an
  // existing page number (e.g. the initial fetch resolving after a user
  // has already interacted), not just from the explicit reset-on-change
  // handlers below.
  const libraryCurrentPage = Math.min(libraryPage, libraryTotalPages);
  const paginatedLibraryItems = filteredLibraryItems.slice(
    (libraryCurrentPage - 1) * LIBRARY_PAGE_SIZE,
    libraryCurrentPage * LIBRARY_PAGE_SIZE,
  );

  const handleLibrarySearchChange = (value: string) => {
    setLibrarySearch(value);
    setLibraryPage(1);
  };

  const handleLibraryCategoryChange = (value: string) => {
    setLibraryCategory(value);
    setLibraryPage(1);
  };

  const clearLibraryFilters = () => {
    setLibrarySearch("");
    setLibraryCategory("All");
    setLibraryPage(1);
  };

  const hasActiveLibraryFilters = librarySearch !== "" || libraryCategory !== "All";

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

        {/* Featured — fixed 6 most recent items, never filtered.
            Eyebrow label only (not a full section header, that's Library's
            treatment) — keeps this from competing visually with Library. */}
        {featuredItems.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" as const }}
              className="flex items-center gap-2 mb-4"
            >
              <Sparkles size={14} className="text-[#8BA3D4]" />
              <span className="text-xs font-semibold uppercase tracking-wide text-[#8BA3D4]">
                Featured
              </span>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredItems.map((item, i) => (
                <ContentCard key={item.id} item={item} index={i} />
              ))}
            </div>
          </>
        )}

        {/* Library — full archive, search + category scoped here only */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" as const }}
          className="mt-16 pt-10 border-t border-white/5"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#2764FF]/10 flex items-center justify-center">
              <LibraryBig size={20} className="text-[#2764FF]" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-klo-text">Library</h2>
              <p className="text-sm text-klo-muted">The full archive — every resource, searchable.</p>
            </div>
          </div>

          {/* Toolbar: search + category (level/type/free-only dropped for this section) */}
          <div className="mb-6">
            <div className="relative max-w-xl mb-4">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-klo-muted"
              />
              <input
                type="text"
                placeholder="Search resources..."
                value={librarySearch}
                onChange={(e) => handleLibrarySearchChange(e.target.value)}
                className="w-full bg-[#161B22] border border-[#21262D] rounded-xl pl-11 pr-10 py-3 text-sm text-klo-text placeholder:text-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#2764FF]/50 focus:border-[#2764FF]/50 transition-all duration-200"
              />
              {librarySearch && (
                <button
                  onClick={() => handleLibrarySearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-klo-muted hover:text-klo-text transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <CategoryTabs
              categories={libraryCategories}
              activeCategory={libraryCategory}
              onCategoryChange={handleLibraryCategoryChange}
            />
          </div>

          {/* List */}
          {paginatedLibraryItems.length > 0 ? (
            <>
              <div className="glass rounded-2xl border border-white/5 divide-y divide-white/5 overflow-hidden">
                {paginatedLibraryItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/vault/${item.slug}`}
                    className="group flex items-center gap-4 px-4 py-3.5 md:px-5 md:py-4 min-h-[64px] hover:bg-white/[0.03] transition-colors duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8BA3D4] mb-0.5">
                        {item.category}
                      </p>
                      <p className="text-sm font-medium text-klo-text truncate group-hover:text-[#68E9FA] transition-colors duration-200">
                        {item.title}
                      </p>
                    </div>
                    <div className="hidden sm:block text-xs text-klo-muted tabular-nums shrink-0 whitespace-nowrap">
                      {new Date(item.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {" · "}
                      {item.duration}
                    </div>
                    {item.isPremium && (
                      <span className="shrink-0 inline-flex items-center">
                        <Lock size={12} className="text-klo-gold shrink-0" />
                        <span className="sr-only">Premium</span>
                      </span>
                    )}
                    <ChevronRight
                      size={16}
                      className="shrink-0 text-klo-muted group-hover:text-[#68E9FA] group-hover:translate-x-0.5 transition-colors duration-200"
                    />
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-6 mt-10">
                <button
                  onClick={() => setLibraryPage((p) => Math.max(1, p - 1))}
                  disabled={libraryCurrentPage <= 1}
                  className="inline-flex items-center gap-1 text-sm font-medium text-klo-muted hover:text-klo-text hover:bg-white/5 px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  Prev
                </button>
                <span className="text-sm text-klo-muted tabular-nums">
                  Page {libraryCurrentPage} of {libraryTotalPages}
                </span>
                <button
                  onClick={() => setLibraryPage((p) => Math.min(libraryTotalPages, p + 1))}
                  disabled={libraryCurrentPage >= libraryTotalPages}
                  className="inline-flex items-center gap-1 text-sm font-medium text-klo-muted hover:text-klo-text hover:bg-white/5 px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
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
              {hasActiveLibraryFilters && (
                <button
                  onClick={clearLibraryFilters}
                  className="text-sm text-klo-gold hover:text-klo-gold/80 transition-colors cursor-pointer font-medium"
                >
                  Clear all filters
                </button>
              )}
            </motion.div>
          )}
        </motion.div>

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
