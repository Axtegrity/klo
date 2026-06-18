"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export function useHostRole() {
  const { data: session } = useSession();
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);

  const userId = (session?.user as { id?: string } | undefined)?.id;
  const appRole = (session?.user as { role?: string } | undefined)?.role;

  useEffect(() => {
    let cancelled = false;

    async function check() {
      // owners/admins get their own dashboard, not host nav
      if (appRole === "owner" || appRole === "admin" || !userId) {
        if (!cancelled) { setIsHost(false); setLoading(false); }
        return;
      }

      try {
        const res = await fetch("/api/conference/roles/check-host");
        const data = res.ok ? await res.json() : { isHost: false };
        if (!cancelled) { setIsHost(data.isHost ?? false); setLoading(false); }
      } catch {
        if (!cancelled) { setIsHost(false); setLoading(false); }
      }
    }

    check();
    return () => { cancelled = true; };
  }, [userId, appRole]);

  return { isHost, loading };
}
