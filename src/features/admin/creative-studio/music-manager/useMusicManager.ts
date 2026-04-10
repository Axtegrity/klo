"use client";

import { useState, useCallback, useEffect } from "react";
import type { AudioAsset } from "@/types/creative-studio";

export function useMusicManager() {
  const [audioAssets, setAudioAssets] = useState<AudioAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchAudio = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/creative-studio/audio");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setAudioAssets(json.data ?? []);
    } catch (err) {
      console.error("Failed to fetch audio:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAudio(); }, [fetchAudio]);

  const uploadAudio = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/creative-studio/audio/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
      await fetchAudio();
    } finally {
      setUploading(false);
    }
  }, [fetchAudio]);

  const updateAudio = useCallback(async (id: string, updates: Partial<AudioAsset>) => {
    const res = await fetch(`/api/admin/creative-studio/audio/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
    await fetchAudio();
  }, [fetchAudio]);

  const deleteAudio = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/creative-studio/audio/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error((await res.json()).error ?? "Delete failed");
    setAudioAssets((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { audioAssets, loading, uploading, uploadAudio, updateAudio, deleteAudio, refetch: fetchAudio };
}
