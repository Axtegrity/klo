"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Search,
  FolderOpen,
  Image as ImageIcon,
  Video,
  Music,
  Shapes,
  X,
  Trash2,
  Pencil,
  FolderPlus,
  RefreshCw,
  Check,
  AlertTriangle,
} from "lucide-react";
import type { MediaAsset, AssetType } from "@/types/creative-studio";
import { useMediaLibrary } from "./useMediaLibrary";

const ASSET_TYPE_FILTERS: { id: AssetType | ""; label: string; icon: React.ElementType }[] = [
  { id: "", label: "All", icon: FolderOpen },
  { id: "image", label: "Images", icon: ImageIcon },
  { id: "video", label: "Videos", icon: Video },
  { id: "audio", label: "Audio", icon: Music },
  { id: "graphic", label: "Graphics", icon: Shapes },
];

export default function MediaLibraryPanel() {
  const {
    assets,
    folders,
    loading,
    uploading,
    totalCount,
    activeFolder,
    setActiveFolder,
    activeType,
    setActiveType,
    search,
    setSearch,
    uploadFile,
    updateAsset,
    deleteAsset,
    refetch,
  } = useMediaLibrary();

  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      setError("");
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        try {
          await uploadFile(file, activeFolder || "uncategorized");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed");
        }
      }
    },
    [uploadFile, activeFolder]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setError("");
      const files = Array.from(e.target.files ?? []);
      for (const file of files) {
        try {
          await uploadFile(file, activeFolder || "uncategorized");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed");
        }
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [uploadFile, activeFolder]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteAsset(id);
        setDeleteConfirm(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed");
      }
    },
    [deleteAsset]
  );

  return (
    <div className="space-y-4">
      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
          >
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <p className="text-sm text-red-300 flex-1">{error}</p>
            <button onClick={() => setError("")} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X size={14} className="text-red-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-klo-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search media..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm placeholder:text-klo-muted focus:outline-none focus:border-klo-accent/50 min-h-[44px]"
          />
        </div>

        {/* Upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-klo-accent text-white text-sm font-medium hover:bg-klo-accent/80 transition-all min-h-[44px] disabled:opacity-50"
        >
          {uploading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? "Uploading..." : "Upload"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Refresh */}
        <button
          onClick={refetch}
          className="inline-flex items-center justify-center p-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-muted hover:text-klo-text transition-all min-h-[44px] min-w-[44px]"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Type filter */}
        <div className="flex gap-1 p-1 rounded-xl bg-klo-dark/30 border border-white/5">
          {ASSET_TYPE_FILTERS.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveType(filter.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] ${
                  activeType === filter.id
                    ? "bg-klo-slate text-klo-text shadow"
                    : "text-klo-muted hover:text-klo-text"
                }`}
              >
                <Icon size={14} />
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Count */}
        <div className="text-sm text-klo-muted self-center">
          {totalCount} asset{totalCount !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="flex gap-4">
        {/* Folder Sidebar */}
        <div className="hidden md:block w-48 shrink-0 space-y-1">
          <button
            onClick={() => setActiveFolder("")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all min-h-[40px] ${
              activeFolder === ""
                ? "bg-klo-slate text-klo-text"
                : "text-klo-muted hover:text-klo-text hover:bg-klo-dark/30"
            }`}
          >
            All Folders
          </button>
          {folders.map((folder) => (
            <button
              key={folder.name}
              onClick={() => setActiveFolder(folder.name)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all min-h-[40px] flex items-center justify-between ${
                activeFolder === folder.name
                  ? "bg-klo-slate text-klo-text"
                  : "text-klo-muted hover:text-klo-text hover:bg-klo-dark/30"
              }`}
            >
              <span className="truncate">{folder.name}</span>
              <span className="text-xs opacity-60">{folder.count}</span>
            </button>
          ))}

          {/* New folder */}
          {showNewFolder ? (
            <div className="flex gap-1">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="flex-1 px-2 py-1.5 rounded-lg bg-klo-dark/50 border border-white/10 text-klo-text text-xs min-w-0"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newFolderName.trim()) {
                    setActiveFolder(newFolderName.trim());
                    setShowNewFolder(false);
                    setNewFolderName("");
                  }
                  if (e.key === "Escape") {
                    setShowNewFolder(false);
                    setNewFolderName("");
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newFolderName.trim()) {
                    setActiveFolder(newFolderName.trim());
                    setShowNewFolder(false);
                    setNewFolderName("");
                  }
                }}
                className="p-1.5 rounded-lg bg-klo-accent/20 text-klo-accent min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <Check size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewFolder(true)}
              className="w-full text-left px-3 py-2 rounded-lg text-xs text-klo-muted hover:text-klo-text hover:bg-klo-dark/30 transition-all min-h-[40px] flex items-center gap-2"
            >
              <FolderPlus size={14} />
              New Folder
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {/* Drop Zone / Grid */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed transition-all min-h-[300px] ${
              dragOver
                ? "border-klo-accent bg-klo-accent/5"
                : "border-white/5 bg-transparent"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw size={24} className="animate-spin text-klo-muted" />
              </div>
            ) : assets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                <div className="p-4 rounded-2xl bg-klo-accent/10 mb-4">
                  <Upload size={32} className="text-klo-gold" />
                </div>
                <p className="text-klo-text font-medium mb-1">
                  Drop files here or click Upload
                </p>
                <p className="text-sm text-klo-muted">
                  Images, videos, audio — up to 50MB each
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-3">
                <AnimatePresence>
                  {assets.map((asset) => (
                    <MediaCard
                      key={asset.id}
                      asset={asset}
                      onEdit={() => setEditingAsset(asset)}
                      onDeleteClick={() => setDeleteConfirm(asset.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingAsset && (
          <EditAssetModal
            asset={editingAsset}
            onClose={() => setEditingAsset(null)}
            onSave={async (updates) => {
              await updateAsset(editingAsset.id, updates);
              setEditingAsset(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <DeleteConfirmModal
            onConfirm={() => handleDelete(deleteConfirm)}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// -------------------------------------------------------
// Media Card
// -------------------------------------------------------
function MediaCard({
  asset,
  onEdit,
  onDeleteClick,
}: {
  asset: MediaAsset;
  onEdit: () => void;
  onDeleteClick: () => void;
}) {
  const isImage = asset.asset_type === "image" || asset.asset_type === "graphic";
  const isVideo = asset.asset_type === "video";

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative rounded-xl bg-klo-dark/50 border border-white/5 overflow-hidden hover:border-klo-accent/30 transition-all"
    >
      {/* Preview */}
      <div className="aspect-square relative bg-klo-dark flex items-center justify-center overflow-hidden">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.public_url}
            alt={asset.alt_text ?? asset.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : isVideo ? (
          <Video size={32} className="text-klo-muted" />
        ) : (
          <Music size={32} className="text-klo-muted" />
        )}

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
          <button
            onClick={onEdit}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={onDeleteClick}
            className="p-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-300 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-xs font-medium text-klo-text truncate">{asset.name}</p>
        <p className="text-[10px] text-klo-muted mt-0.5">
          {formatSize(asset.size_bytes)}
          {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}
        </p>
        {asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {asset.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-klo-accent/10 text-klo-accent"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// -------------------------------------------------------
// Edit Modal
// -------------------------------------------------------
function EditAssetModal({
  asset,
  onClose,
  onSave,
}: {
  asset: MediaAsset;
  onClose: () => void;
  onSave: (updates: { name?: string; folder?: string; tags?: string[]; alt_text?: string }) => Promise<void>;
}) {
  const [name, setName] = useState(asset.name);
  const [folder, setFolder] = useState(asset.folder);
  const [tags, setTags] = useState(asset.tags.join(", "));
  const [altText, setAltText] = useState(asset.alt_text ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};
      if (name !== asset.name) updates.name = name;
      if (folder !== asset.folder) updates.folder = folder;
      const newTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
      if (JSON.stringify(newTags) !== JSON.stringify(asset.tags)) updates.tags = newTags;
      if (altText !== (asset.alt_text ?? "")) updates.alt_text = altText || undefined;

      if (Object.keys(updates).length > 0) {
        await onSave(updates as { name?: string; folder?: string; tags?: string[]; alt_text?: string });
      } else {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        className="w-full max-w-md rounded-2xl bg-klo-slate border border-white/10 p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-klo-text">Edit Asset</h3>
          <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-klo-muted hover:text-klo-text">
            <X size={18} />
          </button>
        </div>

        {/* Preview */}
        {(asset.asset_type === "image" || asset.asset_type === "graphic") && (
          <div className="rounded-xl overflow-hidden bg-klo-dark aspect-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset.public_url} alt={asset.name} className="w-full h-full object-contain" />
          </div>
        )}

        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]"
            />
          </label>

          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Folder</span>
            <input
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]"
            />
          </label>

          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Tags (comma-separated)</span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="hero, banner, background"
              className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]"
            />
          </label>

          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Alt Text</span>
            <input
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe this image for accessibility"
              className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]"
            />
          </label>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-muted text-sm hover:text-klo-text transition-all min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-klo-accent text-white text-sm font-medium hover:bg-klo-accent/80 transition-all min-h-[44px] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// -------------------------------------------------------
// Delete Confirmation
// -------------------------------------------------------
function DeleteConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
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
        <h3 className="text-lg font-semibold text-klo-text">Delete Asset?</h3>
        <p className="text-sm text-klo-muted">
          This will permanently delete this file from storage. This action cannot
          be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-muted text-sm hover:text-klo-text transition-all min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-medium hover:bg-red-500/30 transition-all min-h-[44px]"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
