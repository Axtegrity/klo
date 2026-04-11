"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Trash2,
  Play,
  Pause,
  Volume2,
  RefreshCw,
  X,
  FileAudio,
  ToggleLeft,
  ToggleRight,
  Repeat,
} from "lucide-react";
import type { AudioAsset } from "@/types/creative-studio";
import { useMusicManager } from "./useMusicManager";

const PAGE_OPTIONS = [
  { slug: "home", label: "Home" },
  { slug: "vault", label: "Content Vault" },
  { slug: "advisor", label: "AI Advisor" },
  { slug: "assessments", label: "Assessments" },
  { slug: "booking", label: "Booking" },
  { slug: "strategy-rooms", label: "Strategy Rooms" },
  { slug: "events", label: "Events" },
  { slug: "marketplace", label: "Marketplace" },
];

export default function MusicManagerPanel() {
  const { audioAssets, loading, uploading, uploadAudio, updateAudio, deleteAudio } = useMusicManager();
  const [editingAudio, setEditingAudio] = useState<AudioAsset | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      try {
        await uploadAudio(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [uploadAudio]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw size={24} className="animate-spin text-klo-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-300 flex-1">{error}</p>
          <button onClick={() => setError("")} className="min-h-[44px] min-w-[44px] flex items-center justify-center"><X size={14} className="text-red-400" /></button>
        </div>
      )}

      {/* Upload */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-klo-text">
          {audioAssets.length} audio file{audioAssets.length !== 1 ? "s" : ""}
        </h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-klo-accent text-white text-sm font-medium hover:bg-klo-accent/80 min-h-[44px] disabled:opacity-50"
        >
          {uploading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? "Uploading..." : "Upload Audio"}
        </button>
        <input ref={fileInputRef} type="file" accept="audio/*" multiple onChange={handleUpload} className="hidden" />
      </div>

      {audioAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center glass rounded-2xl border border-white/5">
          <FileAudio size={32} className="text-klo-gold mb-3" />
          <p className="text-klo-text font-medium mb-1">No audio files yet</p>
          <p className="text-sm text-klo-muted">Upload MP3, WAV, OGG, or AAC files</p>
        </div>
      ) : (
        <div className="space-y-2">
          {audioAssets.map((audio) => (
            <AudioCard
              key={audio.id}
              audio={audio}
              onEdit={() => setEditingAudio(audio)}
              onDelete={async () => {
                try {
                  await deleteAudio(audio.id);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Delete failed");
                }
              }}
              formatSize={formatSize}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingAudio && (
          <EditAudioModal
            audio={editingAudio}
            onClose={() => setEditingAudio(null)}
            onSave={async (updates) => {
              try {
                await updateAudio(editingAudio.id, updates);
                setEditingAudio(null);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Save failed");
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AudioCard({
  audio,
  onEdit,
  onDelete,
  formatSize,
}: {
  audio: AudioAsset;
  onEdit: () => void;
  onDelete: () => void;
  formatSize: (bytes: number) => string;
}) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audio.public_url);
      audioRef.current.volume = audio.volume;
      audioRef.current.loop = audio.loop;
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-klo-dark/30 border border-white/5 hover:border-white/10 transition-all">
      <button
        onClick={togglePlay}
        className="shrink-0 w-10 h-10 rounded-xl bg-klo-accent/10 flex items-center justify-center text-klo-accent hover:bg-klo-accent/20 min-h-[44px] min-w-[44px]"
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
        <p className="text-sm font-medium text-klo-text truncate">{audio.name}</p>
        <div className="flex items-center gap-3 text-[10px] text-klo-muted mt-0.5">
          <span>{formatSize(audio.size_bytes)}</span>
          {audio.assigned_to.length > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-klo-gold/10 text-klo-gold">
              {audio.assigned_to.length} page{audio.assigned_to.length !== 1 ? "s" : ""}
            </span>
          )}
          {audio.autoplay && <span className="px-1.5 py-0.5 rounded bg-klo-accent/10 text-klo-accent">Autoplay</span>}
          {audio.loop && <Repeat size={10} className="text-klo-muted" />}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Volume2 size={12} className="text-klo-muted" />
        <span className="text-[10px] text-klo-muted w-8 text-center">{Math.round(audio.volume * 100)}%</span>
      </div>

      <button
        onClick={onDelete}
        className="p-2 rounded-lg hover:bg-red-500/20 text-klo-muted hover:text-red-400 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function EditAudioModal({
  audio,
  onClose,
  onSave,
}: {
  audio: AudioAsset;
  onClose: () => void;
  onSave: (updates: Partial<AudioAsset>) => Promise<void>;
}) {
  const [name, setName] = useState(audio.name);
  const [assignedTo, setAssignedTo] = useState<string[]>(audio.assigned_to);
  const [autoplay, setAutoplay] = useState(audio.autoplay);
  const [loop, setLoop] = useState(audio.loop);
  const [volume, setVolume] = useState(audio.volume);
  const [saving, setSaving] = useState(false);

  const togglePage = (slug: string) => {
    setAssignedTo((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ name, assigned_to: assignedTo, autoplay, loop, volume });
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
          <h3 className="text-lg font-semibold text-klo-text">Edit Audio</h3>
          <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-klo-muted hover:text-klo-text"><X size={18} /></button>
        </div>

        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]" />
        </label>

        {/* Page assignment */}
        <div>
          <span className="text-xs text-klo-muted mb-2 block">Assign to Pages</span>
          <div className="grid grid-cols-2 gap-2">
            {PAGE_OPTIONS.map((page) => (
              <button
                key={page.slug}
                onClick={() => togglePage(page.slug)}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-all min-h-[40px] ${
                  assignedTo.includes(page.slug)
                    ? "bg-klo-accent/10 border border-klo-accent/30 text-klo-text"
                    : "bg-klo-dark/30 border border-white/5 text-klo-muted hover:text-klo-text"
                }`}
              >
                {page.label}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button onClick={() => setAutoplay(!autoplay)} className="inline-flex items-center gap-2 text-sm min-h-[44px]">
            {autoplay ? <ToggleRight size={20} className="text-klo-accent" /> : <ToggleLeft size={20} className="text-klo-muted" />}
            <span className={autoplay ? "text-klo-text" : "text-klo-muted"}>Autoplay</span>
          </button>
          <button onClick={() => setLoop(!loop)} className="inline-flex items-center gap-2 text-sm min-h-[44px]">
            {loop ? <ToggleRight size={20} className="text-klo-accent" /> : <ToggleLeft size={20} className="text-klo-muted" />}
            <span className={loop ? "text-klo-text" : "text-klo-muted"}>Loop</span>
          </button>
        </div>

        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Volume ({Math.round(volume * 100)}%)</span>
          <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full" />
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
