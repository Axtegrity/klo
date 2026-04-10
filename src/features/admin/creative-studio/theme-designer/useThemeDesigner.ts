"use client";

import { useState, useCallback, useEffect } from "react";
import type { ThemeConfig } from "@/types/creative-studio";

export function useThemeDesigner() {
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThemes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/creative-studio/theme");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setThemes(json.data ?? []);
    } catch (err) {
      console.error("Failed to fetch themes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchThemes(); }, [fetchThemes]);

  const activeTheme = themes.find((t) => t.is_active) ?? null;

  const createTheme = useCallback(async (theme: {
    name: string;
    colors: ThemeConfig["colors"];
    typography: ThemeConfig["typography"];
    buttons: ThemeConfig["buttons"];
    dark_mode?: boolean;
    custom_css?: string | null;
  }) => {
    const res = await fetch("/api/admin/creative-studio/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(theme),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? "Create failed");
    await fetchThemes();
  }, [fetchThemes]);

  const updateTheme = useCallback(async (id: string, updates: Partial<ThemeConfig>) => {
    const res = await fetch(`/api/admin/creative-studio/theme/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
    await fetchThemes();
  }, [fetchThemes]);

  const activateTheme = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/creative-studio/theme/${id}/activate`, { method: "POST" });
    if (!res.ok) throw new Error((await res.json()).error ?? "Activate failed");
    await fetchThemes();
  }, [fetchThemes]);

  const deleteTheme = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/creative-studio/theme/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error((await res.json()).error ?? "Delete failed");
    await fetchThemes();
  }, [fetchThemes]);

  return { themes, activeTheme, loading, createTheme, updateTheme, activateTheme, deleteTheme, refetch: fetchThemes };
}
