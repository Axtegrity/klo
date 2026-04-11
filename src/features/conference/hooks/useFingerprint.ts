"use client";

import { useState, useEffect } from "react";

// Client-side fingerprint for optimistic UI (actual dedup happens server-side)
export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState<string>("");

  useEffect(() => {
    // Defer to a microtask so the setState doesn't run synchronously in the
    // effect body (react-hooks/set-state-in-effect). We can't lazy-init from
    // sessionStorage because it would cause an SSR/hydration mismatch — the
    // server has no sessionStorage.
    Promise.resolve().then(() => {
      const stored = sessionStorage.getItem("klo-conference-fp");
      if (stored) {
        setFingerprint(stored);
        return;
      }
      const fp = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("klo-conference-fp", fp);
      setFingerprint(fp);
    });
  }, []);

  return fingerprint;
}
