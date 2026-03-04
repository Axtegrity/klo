"use client";

import { useState, useEffect } from "react";

// Client-side fingerprint for optimistic UI (actual dedup happens server-side)
export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState<string>("");

  useEffect(() => {
    // Simple client-side fingerprint for UI state only
    const stored = sessionStorage.getItem("klo-conference-fp");
    if (stored) {
      setFingerprint(stored);
      return;
    }
    const fp = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("klo-conference-fp", fp);
    setFingerprint(fp);
  }, []);

  return fingerprint;
}
