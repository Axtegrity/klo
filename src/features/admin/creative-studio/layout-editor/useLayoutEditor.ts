"use client";

import { useState, useCallback, useEffect } from "react";
import type { PageConfig } from "@/types/creative-studio";

export function useLayoutEditor() {
  const [pages, setPages] = useState<PageConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState("");

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/creative-studio/pages");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setPages(json.data ?? []);
      if (!selectedSlug && json.data?.length) {
        setSelectedSlug(json.data[0].page_slug);
      }
    } catch (err) {
      console.error("Failed to fetch pages:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedSlug]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

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

  return { pages, selectedPage, selectedSlug, setSelectedSlug, loading, updatePage, refetch: fetchPages };
}
