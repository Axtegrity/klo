"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const RUN_FLAG = "klo-push-auto-init-run";

export default function PushAutoInit() {
  const { status } = useSession();
  const ran = useRef(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (ran.current) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(RUN_FLAG) === "1") return;
    ran.current = true;
    sessionStorage.setItem(RUN_FLAG, "1");

    async function run() {
      try {
        const { Capacitor } = await import("@capacitor/core");

        // Native: prompt + register + persist token with a valid session
        if (Capacitor.isNativePlatform()) {
          const { initPushNotifications } = await import("@/lib/push-notifications");
          const token = await initPushNotifications();
          if (token) localStorage.setItem("klo-push-token", token);
          return;
        }

        // Web: if permission is already granted and a subscription exists,
        // re-persist it so the server row is present even if an earlier POST
        // lost its session (401) or the user switched accounts.
        if (
          "serviceWorker" in navigator &&
          "PushManager" in window &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          const reg = await navigator.serviceWorker.ready;
          const existing = await reg.pushManager.getSubscription();
          if (existing) {
            await fetch("/api/push/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                platform: "web",
                token: existing.toJSON(),
              }),
            });
          }
        }
      } catch {
        // Silently ignore — user can still opt in from /profile
      }
    }
    run();
  }, [status]);

  return null;
}
