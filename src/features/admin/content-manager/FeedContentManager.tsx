"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Pencil, Trash2, RefreshCw, X, AlertTriangle, Pin } from "lucide-react";
import VisibilityToggle from "./VisibilityToggle";
import { useContent, type BaseContentItem, type Visibility } from "./useContent";

interface FeedPost extends BaseContentItem {
  title: string | null;
  body: string;
  post_type: string;
  tags: string[];
  is_pinned: boolean;
  published_at: string | null;
}

const POST_TYPES = ["discussion", "insight", "announcement", "poll"];

export default function FeedContentManager() {
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
  } = useContent<FeedPost>({ type: "feed", initialVisibility: "all" });

  const [editingItem, setEditingItem] = useState<FeedPost | null>(null);
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
            placeholder="Search feed posts..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm placeholder:text-klo-muted focus:outline-none focus:border-klo-accent/50 min-h-[44px]"
          />
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-klo-dark/30 border border-white/5">
          {(["all", "published", "hidden", "archived"] as const).map((v) => (
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
          <Plus size={16} /> New Post
        </button>

        <button
          onClick={refetch}
          className="p-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-muted hover:text-klo-text min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="text-sm text-klo-muted">
        {totalCount} feed post{totalCount !== 1 ? "s" : ""}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <RefreshCw size={24} className="animate-spin text-klo-muted" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-klo-muted text-sm glass rounded-2xl border border-white/5">
          No feed posts match the current filter.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <FeedCard
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

      <AnimatePresence>
        {editingItem && (
          <EditPostModal
            post={editingItem}
            onClose={() => setEditingItem(null)}
            onSave={async (updates) => {
              try {
                await updateItem(editingItem.id, updates as Partial<FeedPost>);
                setEditingItem(null);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Save failed");
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreate && (
          <CreatePostModal
            onClose={() => setShowCreate(false)}
            onCreate={async (data) => {
              try {
                await createItem(data as Partial<FeedPost>);
                setShowCreate(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Create failed");
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <DeleteConfirm
            onConfirm={() => handleDelete(deleteConfirm)}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function FeedCard({
  item,
  onEdit,
  onDelete,
  onVisibilityChange,
}: {
  item: FeedPost;
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
          <h4 className="text-sm font-medium text-klo-text truncate flex-1">
            {item.title ?? <span className="text-klo-muted italic">(no title)</span>}
          </h4>
          {item.is_pinned && <Pin size={12} className="text-klo-gold shrink-0" />}
        </div>
        <p className="text-xs text-klo-muted mt-1 line-clamp-2">{item.body.slice(0, 160)}</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-klo-accent/10 text-klo-accent">{tag}</span>
          ))}
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-klo-dark text-klo-muted capitalize">{item.post_type}</span>
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

function EditPostModal({
  post,
  onClose,
  onSave,
}: {
  post: FeedPost;
  onClose: () => void;
  onSave: (updates: Partial<FeedPost>) => Promise<void>;
}) {
  const [title, setTitle] = useState(post.title ?? "");
  const [body, setBody] = useState(post.body);
  const [postType, setPostType] = useState(post.post_type);
  const [tags, setTags] = useState(post.tags.join(", "));
  const [category, setCategory] = useState(
    (post.metadata?.category as string) ?? ""
  );
  const [isPinned, setIsPinned] = useState(post.is_pinned);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        title: title || null,
        body,
        post_type: postType,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        is_pinned: isPinned,
        metadata: { ...post.metadata, category: category || null },
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
          <h3 className="text-lg font-semibold text-klo-text">Edit Feed Post</h3>
          <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-klo-muted hover:text-klo-text"><X size={18} /></button>
        </div>

        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Title (optional)</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Type</span>
            <select value={postType} onChange={(e) => setPostType(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]">
              {POST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Category</span>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. AI Breakthroughs" className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]" />
          </label>
        </div>

        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Tags (comma-separated)</span>
          <input value={tags} onChange={(e) => setTags(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]" />
        </label>

        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Body</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm resize-none" />
        </label>

        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="w-4 h-4" />
          <span className="text-sm text-klo-text">Pin this post</span>
        </label>

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

function CreatePostModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: Partial<FeedPost>) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [postType, setPostType] = useState("insight");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!body.trim()) return;
    setSaving(true);
    try {
      await onCreate({
        title: title.trim() || null,
        body,
        post_type: postType,
        tags: [],
        visibility: "published",
        metadata: { category: category || null },
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
          <h3 className="text-lg font-semibold text-klo-text">New Feed Post</h3>
          <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-klo-muted hover:text-klo-text"><X size={18} /></button>
        </div>

        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Title (optional)</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Type</span>
            <select value={postType} onChange={(e) => setPostType(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]">
              {POST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Category</span>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. AI Breakthroughs" className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]" />
          </label>
        </div>

        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Body</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm resize-none" />
        </label>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-muted text-sm min-h-[44px]">Cancel</button>
          <button onClick={handleCreate} disabled={saving || !body.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-klo-accent text-white text-sm font-medium min-h-[44px] disabled:opacity-50">
            {saving ? "Creating..." : "Create"}
          </button>
        </div>
      </motion.div>
    </motion.div>
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
          This action cannot be undone. If you just want to hide this post, use the Hidden or Archived toggle instead.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-muted text-sm min-h-[44px]">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-medium min-h-[44px]">Delete</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
