"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, X, Check, RefreshCw, Upload, AlertTriangle } from "lucide-react";
import type { MediaAsset, AssetType } from "@/types/creative-studio";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  assetType?: AssetType; // filter by type
  label?: string;
}

/**
 * A compact picker that lets admins select an image (or other asset type)
 * from their uploaded Media Library instead of pasting a URL.
 */
export default function MediaPicker({
  value,
  onChange,
  assetType = "image",
  label = "Background Image",
}: Props) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (assetType) params.set("asset_type", assetType);
      params.set("limit", "100");
      const res = await fetch(`/api/admin/creative-studio/media?${params}`);
      if (res.ok) {
        const json = await res.json();
        setAssets(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [assetType]);

  useEffect(() => {
    if (open) fetchAssets();
  }, [open, fetchAssets]);

  // Upload a file directly from within the picker, then auto-select it.
  const handleUploadAndUse = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadError("");
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "page-images");
        const res = await fetch("/api/admin/creative-studio/media/upload", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
        const asset = json.data as MediaAsset;
        // Refresh the grid so the new asset is visible, then auto-select it.
        await fetchAssets();
        onChange(asset.public_url);
        setOpen(false);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        // Reset so the same file can be re-selected if needed.
        if (uploadRef.current) uploadRef.current.value = "";
      }
    },
    [fetchAssets, onChange]
  );

  return (
    <div>
      <div className="flex gap-2">
        {/* Current selection preview */}
        {value ? (
          <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Selected"
              className="w-16 h-16 rounded-xl object-cover border border-white/10"
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-all"
              aria-label="Remove image"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-xl border border-dashed border-white/10 flex items-center justify-center text-klo-muted">
            <ImageIcon size={20} />
          </div>
        )}

        <div className="flex-1 space-y-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-klo-dark/50 border border-white/5 text-sm text-klo-text hover:border-klo-accent/30 transition-all min-h-[40px]"
          >
            <ImageIcon size={14} />
            {value ? "Change Image" : "Choose from Media Library"}
          </button>
          {value && (
            <p className="text-[10px] text-klo-muted truncate">{value}</p>
          )}
        </div>
      </div>

      {/* Picker Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[72px] pb-4 overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              className="w-full max-w-3xl max-h-[80vh] rounded-2xl bg-klo-slate border border-white/10 p-6 space-y-4 flex flex-col"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-lg font-semibold text-klo-text">
                  Choose {label}
                </h3>
                <div className="flex items-center gap-2 ml-auto">
                  {/* Upload & Use — upload a new file and immediately select it */}
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-klo-accent/10 border border-klo-accent/20 text-sm text-klo-accent hover:bg-klo-accent/20 cursor-pointer transition-all min-h-[44px]">
                    {uploading ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {uploading ? "Uploading..." : "Upload & Use"}
                    <input
                      ref={uploadRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleUploadAndUse}
                      disabled={uploading}
                    />
                  </label>
                  <button
                    onClick={() => setOpen(false)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-klo-muted hover:text-klo-text"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Upload error */}
              {uploadError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle size={14} className="text-red-400 shrink-0" />
                  <p className="text-xs text-red-300 flex-1">{uploadError}</p>
                  <button onClick={() => setUploadError("")} className="text-red-400">
                    <X size={12} />
                  </button>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <RefreshCw size={24} className="animate-spin text-klo-muted" />
                </div>
              ) : assets.length === 0 ? (
                <div className="text-center py-12 text-klo-muted text-sm">
                  <ImageIcon size={32} className="mx-auto mb-3 opacity-50" />
                  <p>No {assetType} files uploaded yet.</p>
                  <p className="text-xs mt-1">
                    Click &quot;Upload &amp; Use&quot; above to upload a file and select it instantly.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 overflow-y-auto flex-1">
                  {assets.map((asset) => {
                    const isSelected = value === asset.public_url;
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => {
                          onChange(asset.public_url);
                          setOpen(false);
                        }}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-square ${
                          isSelected
                            ? "border-klo-accent"
                            : "border-white/5 hover:border-white/20"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={asset.public_url}
                          alt={asset.alt_text ?? asset.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-klo-accent/20 flex items-center justify-center">
                            <div className="p-2 rounded-full bg-klo-accent">
                              <Check size={16} className="text-white" />
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p className="text-[10px] text-white truncate">{asset.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
