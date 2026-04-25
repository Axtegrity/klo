"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const RUN_FLAG = "klo-push-auto-init-run";

/**
 * Best-effort token refresh for users who already opted in.
 *
 * This component never surfaces an OS permission dialog — that is owned by
 * <PushOptInPrompt /> so the user always sees an in-app pre-prompt with
 * context first. Here we only re-persist tokens for already-granted users so
 * the server row stays current after sign-in or account switches.
 */
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

        // Native: only re-register if permission was already granted.
        // Otherwise leave the ask to <PushOptInPrompt /> which shows context.
        if (Capacitor.isNativePlatform()) {
          const { checkPushPermission, initPushNotifications } = await import(
            "@/lib/push-notifications"
          );
          const granted = await checkPushPermission();
          if (!granted) return;
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
        // Silently ignore — user can still opt in from the prompt or /profile.
      }
    }
    run();
  }, [status]);

  return null;
}
