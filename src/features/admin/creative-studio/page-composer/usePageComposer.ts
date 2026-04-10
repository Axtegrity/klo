"use client";

import { useState, useCallback, useEffect } from "react";
import type { PageConfig, AnimationPreset, AudioAsset } from "@/types/creative-studio";

export function usePageComposer() {
  const [pages, setPages] = useState<PageConfig[]>([]);
  const [animationPresets, setAnimationPresets] = useState<AnimationPreset[]>([]);
  const [audioAssets, setAudioAssets] = useState<AudioAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pagesRes, animRes, audioRes] = await Promise.all([
        fetch("/api/admin/creative-studio/pages"),
        fetch("/api/admin/creative-studio/animation-presets"),
        fetch("/api/admin/creative-studio/audio"),
      ]);
      const [pagesJson, animJson, audioJson] = await Promise.all([
        pagesRes.json(),
        animRes.json(),
        audioRes.json(),
      ]);
      setPages(pagesJson.data ?? []);
      setAnimationPresets(animJson.data ?? []);
      setAudioAssets(audioJson.data ?? []);
      if (!selectedSlug && pagesJson.data?.length) {
        setSelectedSlug(pagesJson.data[0].page_slug);
      }
    } catch (err) {
      console.error("Failed to fetch page composer data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedSlug]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const selectedPage = pages.find((p) => p.page_slug === selectedSlug) ?? null;

  const updatePage = useCallback(async (slug: string, updates: Partial<PageConfig>) => {
    const res = await fetch(`/api/admin/creative-studio/pages/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
    const json = await res.json();
    setPages((prev) => prev.map((p) => (p.page_slug === slug ? json.data : p)));
    return json.data as PageConfig;
  }, []);

  return {
    pages,
    selectedPage,
    selectedSlug,
    setSelectedSlug,
    animationPresets,
    audioAssets,
    loading,
    updatePage,
    refetch: fetchAll,
  };
}
