"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Save,
  RefreshCw,
  Monitor,
  Tablet,
  Smartphone,
  ImageIcon,
  Sparkles,
  Music,
  FileText,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import type { HeroConfig, BackgroundType, ViewportSize } from "@/types/creative-studio";
import { usePageComposer } from "./usePageComposer";

const VIEWPORTS: { size: ViewportSize; icon: React.ElementType; label: string }[] = [
  { size: 390, icon: Smartphone, label: "Mobile" },
  { size: 768, icon: Tablet, label: "Tablet" },
  { size: 1440, icon: Monitor, label: "Desktop" },
];

const DEFAULT_HERO: HeroConfig = {
  headline: "",
  subheadline: "",
  backgroundType: "color",
  backgroundRef: null,
  overlayOpacity: 0.5,
};

export default function PageComposerPanel() {
  const {
    pages,
    selectedPage,
    selectedSlug,
    setSelectedSlug,
    animationPresets,
    audioAssets,
    loading,
    updatePage,
  } = usePageComposer();

  const [viewport, setViewport] = useState<ViewportSize>(1440);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Local state
  const [hero, setHero] = useState<HeroConfig>(DEFAULT_HERO);
  const [animationPresetId, setAnimationPresetId] = useState<string | null>(null);
  const [audioAssetId, setAudioAssetId] = useState<string | null>(null);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [published, setPublished] = useState(true);

  // Sync from selected page
  useEffect(() => {
    if (selectedPage) {
      const heroConfig = selectedPage.hero_config as HeroConfig | null;
      setHero({ ...DEFAULT_HERO, ...heroConfig });
      setAnimationPresetId(selectedPage.animation_preset_id);
      setAudioAssetId(selectedPage.audio_asset_id);
      setMetaTitle(selectedPage.meta_title ?? "");
      setMetaDescription(selectedPage.meta_description ?? "");
      setPublished(selectedPage.published);
    }
  }, [selectedPage]);

  const handleSave = async () => {
    if (!selectedSlug) return;
    setSaving(true);
    setError("");
    try {
      await updatePage(selectedSlug, {
        hero_config: hero as HeroConfig,
        animation_preset_id: animationPresetId,
        audio_asset_id: audioAssetId,
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        published,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
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
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Page Selector + Viewport + Save */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]"
        >
          {pages.map((p) => (
            <option key={p.page_slug} value={p.page_slug}>{p.page_label}</option>
          ))}
        </select>

        <div className="flex gap-1 p-1 rounded-xl bg-klo-dark/30 border border-white/5">
          {VIEWPORTS.map((vp) => {
            const Icon = vp.icon;
            return (
              <button
                key={vp.size}
                onClick={() => setViewport(vp.size)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium min-h-[36px] ${
                  viewport === vp.size ? "bg-klo-slate text-klo-text shadow" : "text-klo-muted hover:text-klo-text"
                }`}
              >
                <Icon size={14} /> {vp.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={() => setPublished(!published)}
            className="inline-flex items-center gap-2 text-sm min-h-[44px]"
          >
            {published ? <ToggleRight size={20} className="text-green-400" /> : <ToggleLeft size={20} className="text-klo-muted" />}
            <span className={published ? "text-green-400" : "text-klo-muted"}>{published ? "Published" : "Draft"}</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-klo-accent text-white text-sm font-medium hover:bg-klo-accent/80 min-h-[44px] disabled:opacity-50"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Page"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5 border border-white/5 space-y-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon size={16} className="text-klo-gold" />
            <h4 className="text-sm font-semibold text-klo-text">Hero Section</h4>
          </div>

          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Headline</span>
            <input
              value={hero.headline}
              onChange={(e) => setHero({ ...hero, headline: e.target.value })}
              placeholder="Your headline here"
              className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]"
            />
          </label>

          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Subheadline</span>
            <input
              value={hero.subheadline}
              onChange={(e) => setHero({ ...hero, subheadline: e.target.value })}
              placeholder="Supporting text"
              className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]"
            />
          </label>

          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Background Type</span>
            <select
              value={hero.backgroundType}
              onChange={(e) => setHero({ ...hero, backgroundType: e.target.value as BackgroundType })}
              className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]"
            >
              <option value="color">Solid Color</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">
              {hero.backgroundType === "color" ? "Background Color" : "Asset URL"}
            </span>
            <input
              type={hero.backgroundType === "color" ? "color" : "text"}
              value={hero.backgroundRef ?? (hero.backgroundType === "color" ? "#0D1117" : "")}
              onChange={(e) => setHero({ ...hero, backgroundRef: e.target.value || null })}
              placeholder={hero.backgroundType === "color" ? "" : "Paste media URL from Media Library"}
              className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]"
            />
          </label>

          <label className="block">
            <span className="text-xs text-klo-muted mb-1 block">Overlay Opacity ({Math.round(hero.overlayOpacity * 100)}%)</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={hero.overlayOpacity}
              onChange={(e) => setHero({ ...hero, overlayOpacity: Number(e.target.value) })}
              className="w-full"
            />
          </label>

          {/* Hero Preview */}
          <div
            className="rounded-xl overflow-hidden h-32 flex items-center justify-center relative"
            style={{
              backgroundColor: hero.backgroundType === "color" ? (hero.backgroundRef ?? "#0D1117") : "#0D1117",
              maxWidth: viewport === 390 ? "390px" : viewport === 768 ? "768px" : "100%",
            }}
          >
            {hero.backgroundType === "image" && hero.backgroundRef && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.backgroundRef} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black" style={{ opacity: hero.overlayOpacity }} />
            <div className="relative text-center z-10 p-4">
              <p className="text-white font-display font-bold text-lg">{hero.headline || "Headline"}</p>
              <p className="text-white/70 text-sm mt-1">{hero.subheadline || "Subheadline"}</p>
            </div>
          </div>
        </motion.div>

        {/* Assignments & SEO */}
        <div className="space-y-4">
          {/* Animation */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass rounded-2xl p-5 border border-white/5 space-y-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-klo-gold" />
              <h4 className="text-sm font-semibold text-klo-text">Animation</h4>
            </div>
            <select
              value={animationPresetId ?? ""}
              onChange={(e) => setAnimationPresetId(e.target.value || null)}
              className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]"
            >
              <option value="">No animation</option>
              {animationPresets.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
              ))}
            </select>
          </motion.div>

          {/* Audio */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-5 border border-white/5 space-y-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <Music size={16} className="text-klo-gold" />
              <h4 className="text-sm font-semibold text-klo-text">Background Audio</h4>
            </div>
            <select
              value={audioAssetId ?? ""}
              onChange={(e) => setAudioAssetId(e.target.value || null)}
              className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]"
            >
              <option value="">No audio</option>
              {audioAssets.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </motion.div>

          {/* SEO */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass rounded-2xl p-5 border border-white/5 space-y-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-klo-gold" />
              <h4 className="text-sm font-semibold text-klo-text">SEO</h4>
            </div>
            <label className="block">
              <span className="text-xs text-klo-muted mb-1 block">Meta Title</span>
              <input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Page title for search engines"
                className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]"
              />
            </label>
            <label className="block">
              <span className="text-xs text-klo-muted mb-1 block">Meta Description</span>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Brief description for search results"
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm resize-none"
              />
            </label>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
