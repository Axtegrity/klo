"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "klo-guest-token";

interface GuestInfo {
  id: string;
  display_name: string;
  event_id: string;
  access_code: string;
  event_presentations?: {
    id: string;
    title: string;
    slug: string;
    seminar_mode: boolean;
    conference_name: string;
    conference_location: string;
    event_date: string;
  };
}

interface SignInParams {
  display_name: string;
  access_code: string;
}

interface SignInResult {
  success: boolean;
  error?: string;
  event_slug?: string;
}

export function useGuestSession() {
  const [guest, setGuest] = useState<GuestInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Verify existing token on mount.
  // The setLoading(false) early-return is wrapped in a microtask so the
  // setState doesn't run synchronously in the effect body
  // (react-hooks/set-state-in-effect).
  useEffect(() => {
    let cancelled = false;
    const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!token) {
      Promise.resolve().then(() => {
        if (!cancelled) setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    fetch("/api/conference/guest-verify", {
      headers: { "x-guest-token": token },
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data) setGuest(data);
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (params: SignInParams): Promise<SignInResult> => {
    try {
      const res = await fetch("/api/conference/guest-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Sign-in failed" };
      }

      localStorage.setItem(STORAGE_KEY, data.guest_token);

      // Re-verify to get full guest info with event details
      const verifyRes = await fetch("/api/conference/guest-verify", {
        headers: { "x-guest-token": data.guest_token },
      });
      if (verifyRes.ok) {
        setGuest(await verifyRes.json());
      }

      return { success: true, event_slug: data.event_slug };
    } catch {
      return { success: false, error: "Network error" };
    }
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setGuest(null);
  }, []);

  return {
    guest,
    eventId: guest?.event_id ?? null,
    isGuest: !!guest,
    loading,
    signIn,
    signOut,
  };
}
