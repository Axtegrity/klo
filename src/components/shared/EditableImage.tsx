"use client";

// EditableImage — wraps any admin-editable image slot on the home page.
//
// When editMode is false (public page), renders children unchanged.
// When editMode is true, adds a hover scrim with a "Change picture" button
// and a corner label identifying the slot. Click opens MediaPicker.

import { useState } from "react";
import { Camera } from "lucide-react";
import { useEditMode } from "@/contexts/EditModeContext";
import type { EditableSlot } from "@/contexts/EditModeContext";
import MediaPicker from "@/features/admin/creative-studio/page-composer/MediaPicker";

interface EditableImageProps {
  children: React.ReactNode;
  slot: EditableSlot;
  /** Human-readable label shown in the corner overlay and picker title. */
  label: string;
  /** Current image URL — passed to MediaPicker as the selected value. */
  currentUrl: string | null;
}

export default function EditableImage({
  children,
  slot,
  label,
  currentUrl,
}: EditableImageProps) {
  const { editMode, setSlotImage } = useEditMode();
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!editMode) {
    return <>{children}</>;
  }

  return (
    <div className="relative group/editable">
      {children}

      {/* Hover scrim — semi-transparent dark overlay */}
      <div
        className="
          absolute inset-0 z-20
          bg-black/0 group-hover/editable:bg-black/50
          ring-0 group-hover/editable:ring-2 ring-[#2764FF]
          transition-all duration-200 rounded-[inherit]
          cursor-pointer
          flex items-center justify-center
        "
        onClick={() => setPickerOpen(true)}
        role="button"
        tabIndex={0}
        aria-label={`Change ${label}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setPickerOpen(true);
          }
        }}
      >
        {/* Change picture button — visible on hover */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setPickerOpen(true);
          }}
          className="
            opacity-0 group-hover/editable:opacity-100
            transition-opacity duration-200
            flex items-center gap-2
            px-4 py-2.5 rounded-full
            bg-white text-[#0D1117]
            font-semibold text-sm
            shadow-lg hover:bg-[#E6EDF3]
            min-h-[40px]
          "
        >
          <Camera size={16} />
          Change picture
        </button>

        {/* Corner slot label — always visible in edit mode */}
        <span
          className="
            absolute top-2 left-2
            px-2 py-0.5
            bg-[#2764FF]/90 text-white
            text-[10px] font-semibold uppercase tracking-wide
            rounded-md
            opacity-0 group-hover/editable:opacity-100
            transition-opacity duration-200
            pointer-events-none
          "
        >
          {label}
        </span>
      </div>

      {/* MediaPicker rendered outside the overlay so it doesn't inherit ring styles */}
      {pickerOpen && (
        <div onClick={(e) => e.stopPropagation()}>
          {/*
            MediaPicker manages its own open state via its internal modal.
            We open it by setting our local state and pass a wrapper that
            calls setSlotImage and clears pickerOpen on change.
          */}
          <_PickerWrapper
            slot={slot}
            label={label}
            currentUrl={currentUrl}
            onClose={() => setPickerOpen(false)}
            onPick={(url) => {
              setSlotImage(slot, url);
              setPickerOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

// Internal wrapper — opens MediaPicker immediately by lifting `open` state.
// MediaPicker's own trigger button is hidden here; we control open directly.
function _PickerWrapper({
  currentUrl,
  label,
  onClose,
  onPick,
}: {
  slot: EditableSlot;
  label: string;
  currentUrl: string | null;
  onClose: () => void;
  onPick: (url: string | null) => void;
}) {
  // We delegate entirely to MediaPicker's internal open state by rendering it
  // in a portal-like div. Since MediaPicker shows a trigger button + modal,
  // we simulate an immediate "open" by passing a custom trigger that auto-fires.
  return (
    <_AutoOpenPicker
      value={currentUrl}
      label={label}
      onClose={onClose}
      onPick={onPick}
    />
  );
}

// Auto-opens the picker overlay immediately when mounted.
// We replicate the MediaPicker modal inline here (without the trigger button
// row) so we can control open state from the EditableImage layer.
import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImageIcon,
  X,
  Check,
  RefreshCw,
  Upload,
  AlertTriangle,
} from "lucide-react";
import type { MediaAsset } from "@/types/creative-studio";

function _AutoOpenPicker({
  value,
  label,
  onClose,
  onPick,
}: {
  value: string | null;
  label: string;
  onClose: () => void;
  onPick: (url: string | null) => void;
}) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ asset_type: "image", limit: "100" });
      const res = await fetch(`/api/admin/creative-studio/media?${params}`);
      if (res.ok) {
        const json = await res.json();
        setAssets(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

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
        await fetchAssets();
        onPick(asset.public_url);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        if (uploadRef.current) uploadRef.current.value = "";
      }
    },
    [fetchAssets, onPick]
  );

  return (
    <AnimatePresence>
      <motion.div
        key="picker-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-start justify-center bg-black/60 px-4 pt-[72px] pb-4 overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && onClose()}
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
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-klo-muted hover:text-klo-text"
                aria-label="Close picker"
              >
                <X size={18} />
              </button>
            </div>
          </div>

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
              <p>No image files uploaded yet.</p>
              <p className="text-xs mt-1">
                Click &quot;Upload &amp; Use&quot; above to upload a file and
                select it instantly.
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
                    onClick={() => onPick(asset.public_url)}
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
                      <p className="text-[10px] text-white truncate">
                        {asset.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
