"use client";

import { useState, useEffect, useCallback } from "react";
import { useConferenceRealtime } from "./useConferenceRealtime";
import type { SeminarMode } from "../types";

export function useSeminarMode(eventId?: string) {
  const [seminarMode, setSeminarMode] = useState<SeminarMode>({ active: false });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const url = eventId
        ? `/api/conference/settings?event_id=${eventId}`
        : "/api/conference/settings";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSeminarMode(data);
      }
    } catch {
      // Keep current state on error
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useConferenceRealtime({
    onSettingsChange: fetchSettings,
  });

  return { seminarMode, loading };
}
