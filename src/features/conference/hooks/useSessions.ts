"use client";

import { useState, useEffect, useCallback } from "react";
import { useConferenceRealtime } from "./useConferenceRealtime";
import type { ConferenceSession } from "../types";

export function useSessions(options?: { eventId?: string; activeOnly?: boolean }) {
  const [sessions, setSessions] = useState<ConferenceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const eventId = options?.eventId;
  const activeOnly = options?.activeOnly;

  const fetchSessions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (eventId) params.set("event_id", eventId);
      if (activeOnly) params.set("active_only", "true");
      const url = `/api/conference/sessions${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        setSessions(await res.json());
      }
    } catch {
      // Keep current state
    } finally {
      setLoading(false);
    }
  }, [eventId, activeOnly]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useConferenceRealtime({
    onSessionsChange: fetchSessions,
  });

  const activeSession = sessions.find((s) => s.is_active) || null;

  return { sessions, activeSession, loading, refetch: fetchSessions };
}
