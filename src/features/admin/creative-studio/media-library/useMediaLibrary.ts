"use client";

import { useState, useCallback, useEffect } from "react";
import type { MediaAsset, AssetType } from "@/types/creative-studio";

interface UseMediaLibraryOptions {
  initialFolder?: string;
  initialAssetType?: AssetType;
}

interface FolderInfo {
  name: string;
  count: number;
}

export function useMediaLibrary(options: UseMediaLibraryOptions = {}) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [activeFolder, setActiveFolder] = useState(options.initialFolder ?? "");
  const [activeType, setActiveType] = useState<AssetType | "">(options.initialAssetType ?? "");
  const [search, setSearch] = useState("");

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeFolder) params.set("folder", activeFolder);
      if (activeType) params.set("asset_type", activeType);
      if (search) params.set("search", search);
      params.set("limit", "50");

      const res = await fetch(`/api/admin/creative-studio/media?${params}`);
      if (!res.ok) throw new Error("Failed to fetch media");
      const json = await res.json();
      setAssets(json.data ?? []);
      setTotalCount(json.count ?? 0);
    } catch (err) {
      console.error("Failed to fetch media:", err);
    } finally {
      setLoading(false);
    }
  }, [activeFolder, activeType, search]);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/creative-studio/media/folders");
      if (!res.ok) return;
      const json = await res.json();
      setFolders(json.data ?? []);
    } catch (err) {
      console.error("Failed to fetch folders:", err);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const uploadFile = useCallback(async (file: File, folder = "uncategorized") => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/admin/creative-studio/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Upload failed");
      }

      const json = await res.json();
      // Refresh lists
      await Promise.all([fetchAssets(), fetchFolders()]);
      return json.data as MediaAsset;
    } finally {
      setUploading(false);
    }
  }, [fetchAssets, fetchFolders]);

  const updateAsset = useCallback(async (id: string, updates: Partial<Pick<MediaAsset, "name" | "folder" | "tags" | "alt_text">>) => {
    const res = await fetch(`/api/admin/creative-studio/media/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? "Update failed");
    }

    const json = await res.json();
    setAssets((prev) => prev.map((a) => (a.id === id ? json.data : a)));
    await fetchFolders();
    return json.data as MediaAsset;
  }, [fetchFolders]);

  const deleteAsset = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/creative-studio/media/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? "Delete failed");
    }

    setAssets((prev) => prev.filter((a) => a.id !== id));
    setTotalCount((prev) => prev - 1);
    await fetchFolders();
  }, [fetchFolders]);

  return {
    assets,
    folders,
    loading,
    uploading,
    totalCount,
    activeFolder,
    setActiveFolder,
    activeType,
    setActiveType,
    search,
    setSearch,
    uploadFile,
    updateAsset,
    deleteAsset,
    refetch: fetchAssets,
  };
}
