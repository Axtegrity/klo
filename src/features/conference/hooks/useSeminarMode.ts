"use client";

import { useState, useEffect, useCallback } from "react";
import { useConferenceRealtime } from "./useConferenceRealtime";
import type { SeminarMode } from "../types";

export function useSeminarMode() {
  const [seminarMode, setSeminarMode] = useState<SeminarMode>({ active: false });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/conference/settings");
      if (res.ok) {
        const data = await res.json();
        setSeminarMode(data);
      }
    } catch {
      // Keep current state on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useConferenceRealtime({
    onSettingsChange: fetchSettings,
  });

  return { seminarMode, loading };
}
