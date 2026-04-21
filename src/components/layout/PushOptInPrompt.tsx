"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Share, Plus, X } from "lucide-react";

const DISMISS_REPROMPT_DAYS = 7;
const LOCAL_SEEN_KEY = "klo-push-optin-checked";

type Decision = "enabled" | "declined" | null;

interface DecisionResponse {
  decision: Decision;
  lastDismissedAt: string | null;
}

type Mode =
  | "hidden"
  | "loading"
  | "web-ask"
  | "ios-install"
  | "blocked"
  | "enabled"
  | "declined";

function detectPlatform(): {
  isIOS: boolean;
  isStandalone: boolean;
  isNativeCandidate: boolean;
  platformTag: string;
} {
  if (typeof window === "undefined") {
    return { isIOS: false, isStandalone: false, isNativeCandidate: false, platformTag: "web" };
  }
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
  const standaloneMatch =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return {
    isIOS,
    isStandalone: Boolean(standaloneMatch),
    isNativeCandidate: false,
    platformTag: isIOS ? "ios-safari" : "web",
  };
}

async function logEvent(
  action: "prompt_shown" | "enabled" | "declined" | "dismissed" | "ios_install_shown",
  platform: string,
) {
  try {
    await fetch("/api/push/optin-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        platform,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      }),
    });
  } catch {
    // Best-effort telemetry — never block the UI.
  }
}

export default function PushOptInPrompt() {
  const { status } = useSession();
  const [mode, setMode] = useState<Mode>("hidden");
  const [working, setWorking] = useState(false);

  const platform = useMemo(() => detectPlatform(), []);
  const promptLoggedRef = useKey("klo-optin-prompt-logged");

  const evaluate = useCallback(async () => {
    if (typeof window === "undefined") return;
    // Inside the native wrapper we let Capacitor's own flow handle the ask.
    try {
      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.isNativePlatform()) {
        setMode("hidden");
        return;
      }
    } catch {
      // ignore — browser context
    }

    // Web: feature-detect first.
    const supported =
      "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

    // iOS Safari (not standalone) cannot receive push — show install prompt instead.
    if (platform.isIOS && !platform.isStandalone) {
      setMode("ios-install");
      if (!promptLoggedRef.get()) {
        logEvent("ios_install_shown", platform.platformTag);
        promptLoggedRef.set(true);
      }
      return;
    }

    if (!supported) {
      setMode("hidden");
      return;
    }

    // Already subscribed in this browser?
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    const existing = reg ? await reg.pushManager.getSubscription() : null;
    if (Notification.permission === "granted" && existing) {
      setMode("enabled");
      return;
    }
    if (Notification.permission === "denied") {
      // Browser-level block — can't re-ask until user clears it. Stay quiet.
      setMode("blocked");
      return;
    }

    // Check server-side decision history.
    let server: DecisionResponse = { decision: null, lastDismissedAt: null };
    try {
      const res = await fetch("/api/push/optin-event", { cache: "no-store" });
      if (res.ok) server = await res.json();
    } catch {
      // If the call fails, fall through to showing the prompt once.
    }

    if (server.decision === "enabled") {
      setMode("enabled");
      return;
    }
    if (server.decision === "declined") {
      setMode("declined");
      return;
    }

    if (server.lastDismissedAt) {
      const ageMs = Date.now() - new Date(server.lastDismissedAt).getTime();
      const reopenMs = DISMISS_REPROMPT_DAYS * 24 * 60 * 60 * 1000;
      if (ageMs < reopenMs) {
        setMode("hidden");
        return;
      }
    }

    setMode("web-ask");
    if (!promptLoggedRef.get()) {
      logEvent("prompt_shown", platform.platformTag);
      promptLoggedRef.set(true);
    }
  }, [platform, promptLoggedRef]);

  useEffect(() => {
    if (status !== "authenticated") return;
    setMode("loading");
    evaluate();
  }, [status, evaluate]);

  const handleEnable = async () => {
    setWorking(true);
    try {
      const { subscribeToWebPush } = await import("@/lib/web-push-client");
      const sub = await subscribeToWebPush();
      if (sub) {
        await logEvent("enabled", platform.platformTag);
        setMode("enabled");
      } else {
        // Permission was denied in the native prompt.
        await logEvent("declined", platform.platformTag);
        setMode("blocked");
      }
    } catch {
      setMode("blocked");
    } finally {
      setWorking(false);
    }
  };

  const handleDecline = async () => {
    setWorking(true);
    await logEvent("declined", platform.platformTag);
    setMode("declined");
    setWorking(false);
  };

  const handleDismiss = async () => {
    setWorking(true);
    await logEvent("dismissed", platform.platformTag);
    setMode("hidden");
    setWorking(false);
  };

  const shouldRender =
    status === "authenticated" && (mode === "web-ask" || mode === "ios-install");

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="fixed inset-x-0 z-[70] px-4"
          style={{
            bottom: "calc(96px + env(safe-area-inset-bottom, 0px))",
          }}
          role="dialog"
          aria-live="polite"
          aria-label="Enable notifications"
        >
          <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#0F141B]/95 backdrop-blur-md shadow-[0_16px_60px_rgba(0,0,0,0.55)] p-5">
            <button
              type="button"
              onClick={handleDismiss}
              disabled={working}
              aria-label="Close"
              className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full text-klo-muted hover:text-klo-text hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C8A84E]/15 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-[#C8A84E]" />
              </div>
              <div className="flex-1 min-w-0 pr-8">
                {mode === "web-ask" ? (
                  <>
                    <h2 className="text-base font-semibold text-klo-text">
                      Stay in the loop with Keith
                    </h2>
                    <p className="mt-1 text-sm text-klo-muted leading-relaxed">
                      Get notified when Keith drops new content, events, and advisory sessions.
                      One tap and you&apos;re in — you can turn it off anytime in your profile.
                    </p>
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={handleEnable}
                        disabled={working}
                        className="flex-1 min-h-[44px] px-4 rounded-lg bg-[#C8A84E] text-[#0D1117] font-semibold text-sm hover:brightness-110 active:brightness-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {working ? "Enabling…" : "Enable notifications"}
                      </button>
                      <button
                        type="button"
                        onClick={handleDecline}
                        disabled={working}
                        className="flex-1 min-h-[44px] px-4 rounded-lg border border-white/10 bg-transparent text-klo-text text-sm hover:bg-white/5 transition-colors disabled:opacity-50"
                      >
                        No thanks
                      </button>
                    </div>
                  </>
                ) : (
                  <IOSInstallHelp onDismiss={handleDismiss} working={working} />
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function IOSInstallHelp({ onDismiss, working }: { onDismiss: () => void; working: boolean }) {
  return (
    <>
      <h2 className="text-base font-semibold text-klo-text">Install KLO to get notifications</h2>
      <p className="mt-1 text-sm text-klo-muted leading-relaxed">
        On iPhone, add KLO to your Home Screen to receive push notifications.
      </p>
      <ol className="mt-3 space-y-2 text-sm text-klo-text/90">
        <li className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-white/5 text-klo-muted text-xs flex items-center justify-center flex-shrink-0">
            1
          </span>
          <span className="inline-flex items-center gap-1.5">
            Tap the <Share className="w-4 h-4 text-klo-muted" /> Share button in Safari
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-white/5 text-klo-muted text-xs flex items-center justify-center flex-shrink-0">
            2
          </span>
          <span className="inline-flex items-center gap-1.5">
            Tap <Plus className="w-4 h-4 text-klo-muted" /> Add to Home Screen
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-white/5 text-klo-muted text-xs flex items-center justify-center flex-shrink-0">
            3
          </span>
          <span>Open KLO from your Home Screen to turn on notifications</span>
        </li>
      </ol>
      <button
        type="button"
        onClick={onDismiss}
        disabled={working}
        className="mt-4 w-full min-h-[44px] px-4 rounded-lg border border-white/10 bg-transparent text-klo-text text-sm hover:bg-white/5 transition-colors disabled:opacity-50"
      >
        Got it
      </button>
    </>
  );
}

// Small localStorage-backed guard so we don't spam telemetry on every re-render.
function useKey(key: string) {
  return useMemo(
    () => ({
      get: () => {
        if (typeof window === "undefined") return false;
        return window.localStorage.getItem(`${LOCAL_SEEN_KEY}:${key}`) === "1";
      },
      set: (v: boolean) => {
        if (typeof window === "undefined") return;
        if (v) window.localStorage.setItem(`${LOCAL_SEEN_KEY}:${key}`, "1");
        else window.localStorage.removeItem(`${LOCAL_SEEN_KEY}:${key}`);
      },
    }),
    [key],
  );
}
