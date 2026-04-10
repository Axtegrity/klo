"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Plus,
  Trash2,
  Lock,
  Play,
  RefreshCw,
  X,
} from "lucide-react";
import type { AnimationPreset, AnimationCategory, AnimationTrigger } from "@/types/creative-studio";
import { useAnimationPresets } from "./useAnimationPresets";

const CATEGORIES: { id: AnimationCategory; label: string }[] = [
  { id: "fade", label: "Fade" },
  { id: "slide", label: "Slide" },
  { id: "bounce", label: "Bounce" },
  { id: "scale", label: "Scale" },
  { id: "parallax", label: "Parallax" },
  { id: "custom", label: "Custom" },
];

const TRIGGERS: { id: AnimationTrigger; label: string }[] = [
  { id: "load", label: "On Load" },
  { id: "scroll", label: "On Scroll" },
  { id: "hover", label: "On Hover" },
  { id: "tap", label: "On Tap" },
];

const EASING_OPTIONS = [
  "easeOut", "easeIn", "easeInOut", "linear",
  "backOut", "backIn", "backInOut",
  "anticipate",
];

export default function AnimationBuilderPanel() {
  const { presets, loading, createPreset, deletePreset } = useAnimationPresets();
  const [selectedPreset, setSelectedPreset] = useState<AnimationPreset | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [filterCategory, setFilterCategory] = useState<AnimationCategory | "">("");

  const filtered = filterCategory
    ? presets.filter((p) => p.category === filterCategory)
    : presets;

  return (
    <div className="space-y-4">
      {/* Filter + Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 p-1 rounded-xl bg-klo-dark/30 border border-white/5 flex-wrap">
          <button
            onClick={() => setFilterCategory("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] ${
              filterCategory === "" ? "bg-klo-slate text-klo-text shadow" : "text-klo-muted hover:text-klo-text"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] ${
                filterCategory === cat.id ? "bg-klo-slate text-klo-text shadow" : "text-klo-muted hover:text-klo-text"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-klo-accent text-white text-sm font-medium hover:bg-klo-accent/80 transition-all min-h-[44px] ml-auto"
        >
          <Plus size={16} /> New Preset
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <RefreshCw size={24} className="animate-spin text-klo-muted" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isSelected={selectedPreset?.id === preset.id}
              onSelect={() => {
                setSelectedPreset(preset);
                setPreviewKey((k) => k + 1);
              }}
              onDelete={async () => {
                await deletePreset(preset.id);
                if (selectedPreset?.id === preset.id) setSelectedPreset(null);
              }}
            />
          ))}
        </div>
      )}

      {/* Preview Panel */}
      {selectedPreset && (
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-klo-text">
              Preview: {selectedPreset.name}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewKey((k) => k + 1)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-klo-dark/50 border border-white/5 text-sm text-klo-muted hover:text-klo-text min-h-[44px]"
              >
                <Play size={14} /> Replay
              </button>
              <button
                onClick={() => setSelectedPreset(null)}
                className="p-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-muted hover:text-klo-text min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center h-48 bg-klo-dark rounded-xl overflow-hidden">
            <motion.div
              key={previewKey}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              initial={selectedPreset.config.initial as any}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              animate={selectedPreset.config.animate as any}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              transition={selectedPreset.config.transition as any}
              className="w-32 h-32 rounded-2xl bg-gradient-to-br from-klo-accent to-klo-gold flex items-center justify-center"
            >
              <Sparkles size={32} className="text-white" />
            </motion.div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-klo-dark/30">
              <span className="text-klo-muted block mb-1">Category</span>
              <span className="text-klo-text font-medium capitalize">{selectedPreset.category}</span>
            </div>
            <div className="p-3 rounded-xl bg-klo-dark/30">
              <span className="text-klo-muted block mb-1">Trigger</span>
              <span className="text-klo-text font-medium capitalize">{selectedPreset.config.trigger}</span>
            </div>
            <div className="p-3 rounded-xl bg-klo-dark/30">
              <span className="text-klo-muted block mb-1">Duration</span>
              <span className="text-klo-text font-medium">{selectedPreset.config.transition.duration}s</span>
            </div>
            <div className="p-3 rounded-xl bg-klo-dark/30">
              <span className="text-klo-muted block mb-1">Easing</span>
              <span className="text-klo-text font-medium">{selectedPreset.config.transition.ease}</span>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreatePresetModal
            onClose={() => setShowCreate(false)}
            onCreate={async (data) => {
              await createPreset(data);
              setShowCreate(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PresetCard({
  preset,
  isSelected,
  onSelect,
  onDelete,
}: {
  preset: AnimationPreset;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`text-left p-4 rounded-xl border transition-all min-h-[44px] ${
        isSelected
          ? "bg-klo-accent/10 border-klo-accent/30"
          : "bg-klo-dark/30 border-white/5 hover:border-white/10"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-klo-text">{preset.name}</span>
        <div className="flex items-center gap-1.5">
          {preset.is_system && <Lock size={12} className="text-klo-muted" />}
          {!preset.is_system && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onDelete(); }}}
              className="p-1 rounded hover:bg-red-500/20 text-klo-muted hover:text-red-400 transition-all"
            >
              <Trash2 size={12} />
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-2 text-[10px]">
        <span className="px-2 py-0.5 rounded-full bg-klo-accent/10 text-klo-accent capitalize">
          {preset.category}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-klo-gold/10 text-klo-gold capitalize">
          {preset.config.trigger}
        </span>
        <span className="text-klo-muted self-center">
          {preset.config.transition.duration}s
        </span>
      </div>
    </button>
  );
}

function CreatePresetModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: {
    name: string;
    slug: string;
    category: AnimationCategory;
    config: AnimationPreset["config"];
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AnimationCategory>("fade");
  const [trigger, setTrigger] = useState<AnimationTrigger>("scroll");
  const [duration, setDuration] = useState(0.5);
  const [delay, setDelay] = useState(0);
  const [ease, setEase] = useState("easeOut");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const buildConfig = () => {
    const configs: Record<AnimationCategory, { initial: Record<string, number>; animate: Record<string, number> }> = {
      fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
      slide: { initial: { opacity: 0, x: -40 }, animate: { opacity: 1, x: 0 } },
      bounce: { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 } },
      scale: { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 } },
      parallax: { initial: {}, animate: {} },
      custom: { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } },
    };
    return {
      ...configs[category],
      transition: { duration, delay: delay || undefined, ease },
      trigger,
    };
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      await onCreate({
        name: name.trim(),
        slug,
        category,
        config: buildConfig() as AnimationPreset["config"],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
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
        className="w-full max-w-lg rounded-2xl bg-klo-slate border border-white/10 p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-klo-text">New Animation Preset</h3>
          <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-klo-muted hover:text-klo-text">
            <X size={18} />
          </button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Animation" className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]" />
          </label>

          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as AnimationCategory)} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]">
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Trigger</span>
            <select value={trigger} onChange={(e) => setTrigger(e.target.value as AnimationTrigger)} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]">
              {TRIGGERS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-klo-muted mb-1 block">Duration (s)</span>
              <input type="number" step={0.1} min={0.1} max={10} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]" />
            </label>
            <label className="block">
              <span className="text-xs text-klo-muted mb-1 block">Delay (s)</span>
              <input type="number" step={0.1} min={0} max={10} value={delay} onChange={(e) => setDelay(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]" />
            </label>
          </div>

          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Easing</span>
            <select value={ease} onChange={(e) => setEase(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]">
              {EASING_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </label>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-muted text-sm hover:text-klo-text min-h-[44px]">Cancel</button>
          <button onClick={handleCreate} disabled={saving || !name.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-klo-accent text-white text-sm font-medium hover:bg-klo-accent/80 min-h-[44px] disabled:opacity-50">
            {saving ? "Creating..." : "Create"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
