"use client";

import { useState, useEffect, useCallback } from "react";
import { useConferenceRealtime } from "./useConferenceRealtime";
import type { WordCloudEntry } from "../types";

export function useWordCloud() {
  const [entries, setEntries] = useState<WordCloudEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/conference/word-cloud");
      if (!res.ok) return;
      const data: WordCloudEntry[] = await res.json();
      setEntries(data);
    } catch {
      // Keep current state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useConferenceRealtime({
    onWordCloudChange: fetchEntries,
  });

  const submitWord = useCallback(
    async (word: string) => {
      try {
        const res = await fetch("/api/conference/word-cloud", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word }),
        });
        if (res.ok) {
          fetchEntries();
        }
        return res.ok;
      } catch {
        return false;
      }
    },
    [fetchEntries]
  );

  return { entries, loading, submitWord, refetch: fetchEntries };
}
