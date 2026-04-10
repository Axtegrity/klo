"use client";

import { useState, useCallback, useEffect } from "react";
import type { AnimationPreset, AnimationVariantConfig, AnimationCategory } from "@/types/creative-studio";

export function useAnimationPresets() {
  const [presets, setPresets] = useState<AnimationPreset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPresets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/creative-studio/animation-presets");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setPresets(json.data ?? []);
    } catch (err) {
      console.error("Failed to fetch animation presets:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPresets(); }, [fetchPresets]);

  const createPreset = useCallback(async (preset: {
    name: string;
    slug: string;
    category: AnimationCategory;
    config: AnimationVariantConfig;
  }) => {
    const res = await fetch("/api/admin/creative-studio/animation-presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preset),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? "Create failed");
    await fetchPresets();
  }, [fetchPresets]);

  const updatePreset = useCallback(async (id: string, updates: Partial<AnimationPreset>) => {
    const res = await fetch(`/api/admin/creative-studio/animation-presets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
    await fetchPresets();
  }, [fetchPresets]);

  const deletePreset = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/creative-studio/animation-presets/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error((await res.json()).error ?? "Delete failed");
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { presets, loading, createPreset, updatePreset, deletePreset, refetch: fetchPresets };
}
