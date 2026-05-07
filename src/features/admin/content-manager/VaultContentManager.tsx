"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Pencil, Trash2, RefreshCw, X, Star, AlertTriangle, Archive, ChevronDown, Eye } from "lucide-react";
import VisibilityToggle from "./VisibilityToggle";
import { useContent, type BaseContentItem, type Visibility } from "./useContent";

interface VaultItem extends BaseContentItem {
  title: string;
  slug: string;
  content_type: string;
  category: string;
  body: string;
  excerpt: string | null;
  thumbnail_url: string | null;
  tier_required: string;
  author_name: string | null;
  published_at: string | null;
}

const CATEGORIES = [
  "AI & Ethics",
  "Church & Tech",
  "Governance",
  "Leadership",
  "Youth & Workforce",
  "Previous Events",
  "Current Events",
];

const CONTENT_TYPES = ["article", "video", "template", "guide", "briefing", "framework", "policy", "replay", "event"];
const TIERS = ["free", "essentials", "professional", "enterprise"];

export default function VaultContentManager() {
  const {
    items,
    loading,
    totalCount,
    visibility,
    setVisibility,
    search,
    setSearch,
    updateItem,
    setItemVisibility,
    deleteItem,
    createItem,
    refetch,
  } = useContent<VaultItem>({ type: "vault", initialVisibility: "published" });

  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleDelete = async (id: string) => {
    try {
      await deleteItem(id);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300 flex-1">{error}</p>
          <button onClick={() => setError("")} className="min-h-[44px] min-w-[44px] flex items-center justify-center"><X size={14} className="text-red-400" /></button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-klo-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vault content..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm placeholder:text-klo-muted focus:outline-none focus:border-klo-accent/50 min-h-[44px]"
          />
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-klo-dark/30 border border-white/5">
          {(["published", "hidden"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVisibility(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize min-h-[36px] ${
                visibility === v ? "bg-klo-slate text-klo-text shadow" : "text-klo-muted hover:text-klo-text"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-klo-accent text-white text-sm font-medium hover:bg-klo-accent/80 min-h-[44px]"
        >
          <Plus size={16} /> New Item
        </button>

        <button
          onClick={refetch}
          className="p-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-muted hover:text-klo-text min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Count */}
      <div className="text-sm text-klo-muted">
        {totalCount} vault item{totalCount !== 1 ? "s" : ""}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <RefreshCw size={24} className="animate-spin text-klo-muted" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-klo-muted text-sm glass rounded-2xl border border-white/5">
          No vault items match the current filter.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <VaultCard
              key={item.id}
              item={item}
              onEdit={() => setEditingItem(item)}
              onDelete={() => setDeleteConfirm(item.id)}
              onVisibilityChange={async (v) => {
                try {
                  await setItemVisibility(item.id, v);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Update failed");
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <EditItemModal
            item={editingItem}
            onClose={() => setEditingItem(null)}
            onSave={async (updates) => {
              try {
                await updateItem(editingItem.id, updates as Partial<VaultItem>);
                setEditingItem(null);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Save failed");
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateItemModal
            onClose={() => setShowCreate(false)}
            onCreate={async (data) => {
              try {
                await createItem(data as Partial<VaultItem>);
                setShowCreate(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Create failed");
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <DeleteConfirm
            onConfirm={() => handleDelete(deleteConfirm)}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </AnimatePresence>

      {/* Archived folder — lives below active content, never mixed in */}
      <ArchivedSection onItemRepublished={refetch} />
    </div>
  );
}

function VaultCard({
  item,
  onEdit,
  onDelete,
  onVisibilityChange,
}: {
  item: VaultItem;
  onEdit: () => void;
  onDelete: () => void;
  onVisibilityChange: (v: Visibility) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-klo-dark/30 border border-white/5 hover:border-white/10 transition-all"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <h4 className="text-sm font-medium text-klo-text truncate flex-1">{item.title}</h4>
          {item.tier_required !== "free" && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-klo-gold/10 text-klo-gold text-[10px] shrink-0">
              <Star size={10} /> Premium
            </span>
          )}
        </div>
        <p className="text-xs text-klo-muted mt-1 line-clamp-2">{item.excerpt ?? item.body.slice(0, 120)}</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-klo-accent/10 text-klo-accent">{item.category}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-klo-dark text-klo-muted capitalize">{item.content_type}</span>
          {item.published_at && (
            <span className="text-[10px] text-klo-muted">
              {new Date(item.published_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
        <VisibilityToggle value={item.visibility} onChange={onVisibilityChange} size="sm" />
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-2 rounded-lg hover:bg-white/5 text-klo-muted hover:text-klo-text min-h-[36px] min-w-[36px] flex items-center justify-center">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg hover:bg-red-500/20 text-klo-muted hover:text-red-400 min-h-[36px] min-w-[36px] flex items-center justify-center">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function EditItemModal({
  item,
  onClose,
  onSave,
}: {
  item: VaultItem;
  onClose: () => void;
  onSave: (updates: Partial<VaultItem>) => Promise<void>;
}) {
  const [title, setTitle] = useState(item.title);
  const [category, setCategory] = useState(item.category);
  const [contentType, setContentType] = useState(item.content_type);
  const [tierRequired, setTierRequired] = useState(item.tier_required);
  const [excerpt, setExcerpt] = useState(item.excerpt ?? "");
  const [body, setBody] = useState(item.body);
  const [authorName, setAuthorName] = useState(item.author_name ?? "");
  const [publishedAt, setPublishedAt] = useState(
    item.published_at ? item.published_at.slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        title,
        category,
        content_type: contentType,
        tier_required: tierRequired,
        excerpt: excerpt || undefined,
        body,
        author_name: authorName || undefined,
        published_at: publishedAt ? new Date(publishedAt).toISOString() : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        className="w-full max-w-2xl rounded-2xl bg-klo-slate border border-white/10 p-6 space-y-4 my-8"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-klo-text">Edit Vault Item</h3>
          <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-klo-muted hover:text-klo-text"><X size={18} /></button>
        </div>

        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]" />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Type</span>
            <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]">
              {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Tier</span>
            <select value={tierRequired} onChange={(e) => setTierRequired(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]">
              {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Excerpt</span>
          <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm resize-none" />
        </label>

        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Body</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm resize-none" />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Author</span>
            <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]" />
          </label>
          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Published Date</span>
            <input type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]" />
          </label>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-muted text-sm min-h-[44px]">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-klo-accent text-white text-sm font-medium min-h-[44px] disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CreateItemModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: Partial<VaultItem>) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    try {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      await onCreate({
        title: title.trim(),
        slug,
        category,
        content_type: contentType,
        body,
        excerpt: body.slice(0, 200),
        tier_required: "free",
        visibility: "published",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        className="w-full max-w-lg rounded-2xl bg-klo-slate border border-white/10 p-6 space-y-4 my-8"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-klo-text">New Vault Item</h3>
          <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-klo-muted hover:text-klo-text"><X size={18} /></button>
        </div>

        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Type</span>
            <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]">
              {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Body</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm resize-none" />
        </label>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-muted text-sm min-h-[44px]">Cancel</button>
          <button onClick={handleCreate} disabled={saving || !title.trim() || !body.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-klo-accent text-white text-sm font-medium min-h-[44px] disabled:opacity-50">
            {saving ? "Creating..." : "Create"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ArchivedSection({ onItemRepublished }: { onItemRepublished?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [republishError, setRepublishError] = useState("");
  const { items, loading, setItemVisibility, refetch } = useContent<VaultItem>({
    type: "vault",
    initialVisibility: "archived",
  });

  const handleRepublish = async (id: string) => {
    try {
      await setItemVisibility(id, "published");
      onItemRepublished?.();
    } catch (err) {
      setRepublishError(err instanceof Error ? err.message : "Republish failed");
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-amber-500/15 overflow-hidden">
      <button
        onClick={() => { setExpanded((v) => !v); if (!expanded) refetch(); }}
        className="w-full flex items-center justify-between px-4 py-3 bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Archive size={15} className="text-amber-400" />
          <span className="text-sm font-medium text-amber-400">Archived Items</span>
          {items.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
              {items.length}
            </span>
          )}
        </div>
        <ChevronDown size={15} className={`text-amber-400/60 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-3 space-y-2 bg-klo-dark/10">
          {republishError && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle size={13} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-300 flex-1">{republishError}</p>
              <button onClick={() => setRepublishError("")} className="min-h-[32px] min-w-[32px] flex items-center justify-center"><X size={13} className="text-red-400" /></button>
            </div>
          )}
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw size={18} className="animate-spin text-klo-muted" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-klo-muted text-center py-6">No archived items.</p>
          ) : (
            items.map((item) => (
              <ArchivedCard key={item.id} item={item} onRepublish={() => handleRepublish(item.id)} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ArchivedCard({ item, onRepublish }: { item: VaultItem; onRepublish: () => Promise<void> }) {
  const [republishing, setRepublishing] = useState(false);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-klo-dark/40 border border-amber-500/10">
      <Archive size={13} className="text-amber-400/60 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-klo-text/70 truncate">{item.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-klo-accent/10 text-klo-accent">{item.category}</span>
          <span className="text-[10px] text-klo-muted capitalize">{item.content_type}</span>
        </div>
      </div>
      <button
        onClick={async () => { setRepublishing(true); try { await onRepublish(); } finally { setRepublishing(false); } }}
        disabled={republishing}
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors min-h-[36px] disabled:opacity-50"
      >
        {republishing ? <RefreshCw size={12} className="animate-spin" /> : <Eye size={12} />}
        Republish
      </button>
    </div>
  );
}

function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-sm rounded-2xl bg-klo-slate border border-white/10 p-6 text-center space-y-4"
      >
        <div className="inline-flex p-3 rounded-xl bg-red-500/10">
          <Trash2 size={24} className="text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-klo-text">Delete Permanently?</h3>
        <p className="text-sm text-klo-muted">
          This action cannot be undone. If you just want to hide this item, use the Hidden or Archived toggle instead.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-muted text-sm min-h-[44px]">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-medium min-h-[44px]">Delete</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
