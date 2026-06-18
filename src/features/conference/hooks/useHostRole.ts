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
    // Owner and admin always have host access — no DB check needed
    if (appRole === "owner" || appRole === "admin") {
      setIsHost(false); // owners/admins get their own dashboard, not host nav
      setLoading(false);
      return;
    }

    if (!userId) {
      setIsHost(false);
      setLoading(false);
      return;
    }

    // Check if this user has a host role for any active event
    fetch("/api/conference/roles/check-host")
      .then((res) => res.ok ? res.json() : { isHost: false })
      .then((data) => setIsHost(data.isHost ?? false))
      .catch(() => setIsHost(false))
      .finally(() => setLoading(false));
  }, [userId, appRole]);

  return { isHost, loading };
}
