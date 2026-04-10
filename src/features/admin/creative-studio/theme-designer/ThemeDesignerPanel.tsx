"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Plus,
  Check,
  Trash2,
  Star,
  RefreshCw,
  X,
  Type,
  RectangleHorizontal,
} from "lucide-react";
import type { ThemeColors, ThemeTypography, ThemeButtons } from "@/types/creative-studio";
import { useThemeDesigner } from "./useThemeDesigner";

const DEFAULT_COLORS: ThemeColors = {
  primary: "#2764FF",
  secondary: "#21B8CD",
  accent: "#2764FF",
  background: "#0D1117",
  surface: "#161B22",
  text: "#E6EDF3",
  muted: "#8B949E",
  gold: "#C8A84E",
};

const DEFAULT_TYPOGRAPHY: ThemeTypography = {
  bodyFont: "Geist Sans, Inter, sans-serif",
  displayFont: "Playfair Display, serif",
  baseSizeRem: 1,
  scaleRatio: 1.25,
  weights: { body: 400, heading: 700 },
};

const DEFAULT_BUTTONS: ThemeButtons = {
  radiusPx: 12,
  shadowPx: 0,
  hoverScale: 1.02,
  variant: "solid",
};

const FONT_OPTIONS = [
  "Geist Sans, Inter, sans-serif",
  "Inter, sans-serif",
  "Playfair Display, serif",
  "Georgia, serif",
  "system-ui, sans-serif",
  "Cascadia Code, monospace",
];

export default function ThemeDesignerPanel() {
  const { themes, activeTheme, loading, createTheme, updateTheme, activateTheme, deleteTheme } = useThemeDesigner();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");

  const editingTheme = themes.find((t) => t.id === editingId) ?? null;

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

      {/* Theme List */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-klo-text">
          {themes.length} theme{themes.length !== 1 ? "s" : ""}
        </h3>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-klo-accent text-white text-sm font-medium hover:bg-klo-accent/80 min-h-[44px]"
        >
          <Plus size={16} /> New Theme
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
              theme.is_active
                ? "bg-klo-accent/10 border-klo-accent/30"
                : "bg-klo-dark/30 border-white/5 hover:border-white/10"
            }`}
            onClick={() => setEditingId(theme.id)}
          >
            {theme.is_active && (
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-klo-gold/20 text-klo-gold text-[10px] font-medium">
                  <Star size={10} /> Active
                </span>
              </div>
            )}

            <h4 className="text-sm font-medium text-klo-text mb-3">{theme.name}</h4>

            {/* Color swatches */}
            <div className="flex gap-1 mb-3">
              {Object.entries(theme.colors as Record<string, string>).slice(0, 6).map(([key, value]) => (
                <div
                  key={key}
                  className="w-6 h-6 rounded-full border border-white/10"
                  style={{ backgroundColor: value }}
                  title={key}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {!theme.is_active && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    activateTheme(theme.id).catch((err) => setError(err.message));
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-klo-gold/10 text-klo-gold text-xs hover:bg-klo-gold/20 min-h-[32px]"
                >
                  <Check size={12} /> Activate
                </button>
              )}
              {!theme.is_active && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTheme(theme.id).catch((err) => setError(err.message));
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 min-h-[32px]"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Editor */}
      <AnimatePresence>
        {editingTheme && (
          <ThemeEditor
            theme={editingTheme}
            onClose={() => setEditingId(null)}
            onSave={async (updates) => {
              try {
                await updateTheme(editingTheme.id, updates);
                setEditingId(null);
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
          <CreateThemeModal
            onClose={() => setShowCreate(false)}
            onCreate={async (data) => {
              try {
                await createTheme(data);
                setShowCreate(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Create failed");
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ThemeEditor({
  theme,
  onClose,
  onSave,
}: {
  theme: { id: string; name: string; colors: unknown; typography: unknown; buttons: unknown; dark_mode: boolean };
  onClose: () => void;
  onSave: (updates: Record<string, unknown>) => Promise<void>;
}) {
  const colors = (theme.colors ?? DEFAULT_COLORS) as ThemeColors;
  const typo = (theme.typography ?? DEFAULT_TYPOGRAPHY) as ThemeTypography;
  const btns = (theme.buttons ?? DEFAULT_BUTTONS) as ThemeButtons;

  const [editColors, setEditColors] = useState<ThemeColors>({ ...DEFAULT_COLORS, ...colors });
  const [editTypo, setEditTypo] = useState<ThemeTypography>({ ...DEFAULT_TYPOGRAPHY, ...typo });
  const [editBtns, setEditBtns] = useState<ThemeButtons>({ ...DEFAULT_BUTTONS, ...btns });
  const [activeSection, setActiveSection] = useState<"colors" | "typography" | "buttons">("colors");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ colors: editColors, typography: editTypo, buttons: editBtns });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="glass rounded-2xl p-6 border border-white/5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-klo-text">Edit: {theme.name}</h3>
        <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-klo-muted hover:text-klo-text">
          <X size={18} />
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-klo-dark/30 border border-white/5">
        {[
          { id: "colors" as const, label: "Colors", icon: Palette },
          { id: "typography" as const, label: "Typography", icon: Type },
          { id: "buttons" as const, label: "Buttons", icon: RectangleHorizontal },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
              activeSection === s.id ? "bg-klo-slate text-klo-text shadow" : "text-klo-muted hover:text-klo-text"
            }`}
          >
            <s.icon size={14} /> {s.label}
          </button>
        ))}
      </div>

      {/* Colors */}
      {activeSection === "colors" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(editColors).map(([key, value]) => (
            <label key={key} className="block">
              <span className="text-xs text-klo-muted mb-1 block capitalize">{key}</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => setEditColors({ ...editColors, [key]: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setEditColors({ ...editColors, [key]: e.target.value })}
                  className="flex-1 px-2 py-2 rounded-lg bg-klo-dark/50 border border-white/5 text-klo-text text-xs min-h-[40px] font-mono"
                />
              </div>
            </label>
          ))}
        </div>
      )}

      {/* Typography */}
      {activeSection === "typography" && (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Body Font</span>
            <select value={editTypo.bodyFont} onChange={(e) => setEditTypo({ ...editTypo, bodyFont: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]">
              {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f.split(",")[0]}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Display Font</span>
            <select value={editTypo.displayFont} onChange={(e) => setEditTypo({ ...editTypo, displayFont: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]">
              {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f.split(",")[0]}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-klo-muted mb-1 block">Base Size (rem)</span>
              <input type="number" step={0.05} min={0.5} max={3} value={editTypo.baseSizeRem} onChange={(e) => setEditTypo({ ...editTypo, baseSizeRem: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]" />
            </label>
            <label className="block">
              <span className="text-xs text-klo-muted mb-1 block">Scale Ratio</span>
              <input type="number" step={0.05} min={1} max={2} value={editTypo.scaleRatio} onChange={(e) => setEditTypo({ ...editTypo, scaleRatio: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-klo-muted mb-1 block">Body Weight</span>
              <select value={editTypo.weights.body} onChange={(e) => setEditTypo({ ...editTypo, weights: { ...editTypo.weights, body: Number(e.target.value) } })} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]">
                {[300, 400, 500, 600, 700].map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-klo-muted mb-1 block">Heading Weight</span>
              <select value={editTypo.weights.heading} onChange={(e) => setEditTypo({ ...editTypo, weights: { ...editTypo.weights, heading: Number(e.target.value) } })} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]">
                {[400, 500, 600, 700, 800, 900].map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </label>
          </div>
        </div>
      )}

      {/* Buttons */}
      {activeSection === "buttons" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs text-klo-muted mb-1 block">Radius (px)</span>
              <input type="range" min={0} max={50} value={editBtns.radiusPx} onChange={(e) => setEditBtns({ ...editBtns, radiusPx: Number(e.target.value) })} className="w-full" />
              <span className="text-xs text-klo-text">{editBtns.radiusPx}px</span>
            </label>
            <label className="block">
              <span className="text-xs text-klo-muted mb-1 block">Shadow (px)</span>
              <input type="range" min={0} max={50} value={editBtns.shadowPx} onChange={(e) => setEditBtns({ ...editBtns, shadowPx: Number(e.target.value) })} className="w-full" />
              <span className="text-xs text-klo-text">{editBtns.shadowPx}px</span>
            </label>
            <label className="block">
              <span className="text-xs text-klo-muted mb-1 block">Hover Scale</span>
              <input type="range" min={1} max={1.5} step={0.01} value={editBtns.hoverScale} onChange={(e) => setEditBtns({ ...editBtns, hoverScale: Number(e.target.value) })} className="w-full" />
              <span className="text-xs text-klo-text">{editBtns.hoverScale}x</span>
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Variant</span>
            <select value={editBtns.variant} onChange={(e) => setEditBtns({ ...editBtns, variant: e.target.value as "solid" | "ghost" | "outline" })} className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]">
              <option value="solid">Solid</option>
              <option value="ghost">Ghost</option>
              <option value="outline">Outline</option>
            </select>
          </label>

          {/* Button preview */}
          <div className="p-6 rounded-xl bg-klo-dark flex items-center justify-center gap-4">
            <button
              style={{
                borderRadius: `${editBtns.radiusPx}px`,
                boxShadow: editBtns.shadowPx > 0 ? `0 ${editBtns.shadowPx}px ${editBtns.shadowPx * 2}px rgba(0,0,0,0.3)` : "none",
                backgroundColor: editBtns.variant === "solid" ? editColors.primary : "transparent",
                border: editBtns.variant === "outline" ? `2px solid ${editColors.primary}` : "none",
                color: editBtns.variant === "solid" ? "#fff" : editColors.primary,
                padding: "10px 24px",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Primary Button
            </button>
            <button
              style={{
                borderRadius: `${editBtns.radiusPx}px`,
                backgroundColor: editBtns.variant === "solid" ? editColors.gold : "transparent",
                border: editBtns.variant === "outline" ? `2px solid ${editColors.gold}` : "none",
                color: editBtns.variant === "solid" ? "#000" : editColors.gold,
                padding: "10px 24px",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Gold Button
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-muted text-sm min-h-[44px]">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-klo-accent text-white text-sm font-medium min-h-[44px] disabled:opacity-50">
          {saving ? "Saving..." : "Save Theme"}
        </button>
      </div>
    </motion.div>
  );
}

function CreateThemeModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: { name: string; colors: ThemeColors; typography: ThemeTypography; buttons: ThemeButtons; dark_mode: boolean }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onCreate({
        name: name.trim(),
        colors: DEFAULT_COLORS,
        typography: DEFAULT_TYPOGRAPHY,
        buttons: DEFAULT_BUTTONS,
        dark_mode: true,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-sm rounded-2xl bg-klo-slate border border-white/10 p-6 space-y-4"
      >
        <h3 className="text-lg font-semibold text-klo-text">New Theme</h3>
        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Theme Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Theme" className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]" autoFocus />
        </label>
        <p className="text-xs text-klo-muted">Creates with default KLO colors. You can customize everything after creation.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-muted text-sm min-h-[44px]">Cancel</button>
          <button onClick={handleCreate} disabled={saving || !name.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-klo-accent text-white text-sm font-medium min-h-[44px] disabled:opacity-50">
            {saving ? "Creating..." : "Create"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
