"use client";

import { useState, useEffect, useCallback } from "react";
import { useConferenceRealtime } from "./useConferenceRealtime";
import type { ConferenceSession } from "../types";

export function useSessions(options?: { eventId?: string }) {
  const [sessions, setSessions] = useState<ConferenceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const eventId = options?.eventId;

  const fetchSessions = useCallback(async () => {
    try {
      const url = eventId
        ? `/api/conference/sessions?event_id=${eventId}`
        : "/api/conference/sessions";
      const res = await fetch(url);
      if (res.ok) {
        setSessions(await res.json());
      }
    } catch {
      // Keep current state
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useConferenceRealtime({
    onSessionsChange: fetchSessions,
  });

  const activeSession = sessions.find((s) => s.is_active) || null;

  return { sessions, activeSession, loading, refetch: fetchSessions };
}
