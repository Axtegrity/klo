"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Share, Plus, X, Settings } from "lucide-react";
import {
  PUSH_PROMPT_VERSION,
  PUSH_PROMPT_VERSION_KEY,
  PUSH_PROMPT_DEFER_MS,
} from "@/lib/constants";

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
  | "native-ask"
  | "ios-install"
  | "blocked-web"
  | "blocked-native"
  | "enabled"
  | "declined";

function detectPlatform(): {
  isIOS: boolean;
  isStandalone: boolean;
  platformTag: string;
} {
  if (typeof window === "undefined") {
    return { isIOS: false, isStandalone: false, platformTag: "web" };
  }
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
  const standaloneMatch =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return {
    isIOS,
    isStandalone: Boolean(standaloneMatch),
    platformTag: isIOS ? "ios-safari" : "web",
  };
}

async function logEvent(
  action:
    | "prompt_shown"
    | "enabled"
    | "declined"
    | "dismissed"
    | "ios_install_shown"
    | "blocked_shown",
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

function readPromptVersion(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(PUSH_PROMPT_VERSION_KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

function writePromptVersion(v: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PUSH_PROMPT_VERSION_KEY, String(v));
}

export default function PushOptInPrompt() {
  const { status } = useSession();
  const [mode, setMode] = useState<Mode>("hidden");
  const [working, setWorking] = useState(false);
  const evaluatedRef = useRef(false);

  const platform = useMemo(() => detectPlatform(), []);
  const promptLoggedRef = useKey("klo-optin-prompt-logged");

  const evaluate = useCallback(async () => {
    if (typeof window === "undefined") return;

    const storedVersion = readPromptVersion();
    const versionMismatch = storedVersion < PUSH_PROMPT_VERSION;

    // ----- Native (Capacitor iOS / Android) -----
    let isNative = false;
    let nativePlatform = "native";
    try {
      const { Capacitor } = await import("@capacitor/core");
      isNative = Capacitor.isNativePlatform();
      if (isNative) nativePlatform = Capacitor.getPlatform(); // "ios" | "android"
    } catch {
      isNative = false;
    }

    if (isNative) {
      try {
        const { checkPushPermission } = await import("@/lib/push-notifications");
        const granted = await checkPushPermission();
        if (granted) {
          // Already opted in. A version bump should NOT re-prompt — they
          // already get notifications. Silently advance the stored version
          // so we don't re-evaluate this path on every page load.
          writePromptVersion(PUSH_PROMPT_VERSION);
          setMode("enabled");
          return;
        }
        // If a prior version's decision exists on the server we honor it
        // unless the prompt version was bumped.
        if (!versionMismatch) {
          let server: DecisionResponse = { decision: null, lastDismissedAt: null };
          try {
            const res = await fetch("/api/push/optin-event", { cache: "no-store" });
            if (res.ok) server = await res.json();
          } catch {
            // ignore — show prompt
          }
          if (server.decision === "enabled") {
            // Server-side enabled but OS-level not granted → user revoked
            // in system settings. Treat as blocked so we route them back.
            setMode("blocked-native");
            if (!promptLoggedRef.get()) {
              logEvent("blocked_shown", nativePlatform);
              promptLoggedRef.set(true);
            }
            return;
          }
          if (server.decision === "declined") {
            // Native OS won't let us re-ask after a declined permission, so
            // route them to the app settings screen instead.
            setMode("blocked-native");
            if (!promptLoggedRef.get()) {
              logEvent("blocked_shown", nativePlatform);
              promptLoggedRef.set(true);
            }
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
        }
        setMode("native-ask");
        if (!promptLoggedRef.get() || versionMismatch) {
          logEvent("prompt_shown", nativePlatform);
          promptLoggedRef.set(true);
        }
        return;
      } catch {
        setMode("hidden");
        return;
      }
    }

    // ----- Web -----
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

    const reg = await navigator.serviceWorker.ready.catch(() => null);
    const existing = reg ? await reg.pushManager.getSubscription() : null;
    if (Notification.permission === "granted" && existing) {
      // Already actively subscribed. Even on a version bump, don't bother
      // them — silently advance the stored version.
      writePromptVersion(PUSH_PROMPT_VERSION);
      setMode("enabled");
      return;
    }
    if (Notification.permission === "denied") {
      // Browser-level block — can't programmatically re-ask; show help.
      setMode("blocked-web");
      if (!promptLoggedRef.get()) {
        logEvent("blocked_shown", platform.platformTag);
        promptLoggedRef.set(true);
      }
      return;
    }

    if (!versionMismatch) {
      let server: DecisionResponse = { decision: null, lastDismissedAt: null };
      try {
        const res = await fetch("/api/push/optin-event", { cache: "no-store" });
        if (res.ok) server = await res.json();
      } catch {
        // fall through to showing the prompt
      }

      if (server.decision === "enabled") {
        // Server says enabled but no live subscription in this browser
        // (different device or cleared site data). Show prompt so they can
        // re-subscribe on this browser.
        setMode("web-ask");
        if (!promptLoggedRef.get()) {
          logEvent("prompt_shown", platform.platformTag);
          promptLoggedRef.set(true);
        }
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
    }

    setMode("web-ask");
    if (!promptLoggedRef.get() || versionMismatch) {
      logEvent("prompt_shown", platform.platformTag);
      promptLoggedRef.set(true);
    }
  }, [platform, promptLoggedRef]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (evaluatedRef.current) return;
    evaluatedRef.current = true;

    // Defer until first meaningful interaction (whichever comes first):
    //   1. The defer timeout elapses, OR
    //   2. The user makes any interaction (scroll/click/keydown).
    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      cleanup();
      setMode("loading");
      evaluate();
    };
    const timer = window.setTimeout(fire, PUSH_PROMPT_DEFER_MS);
    const opts: AddEventListenerOptions = { passive: true, once: true };
    window.addEventListener("scroll", fire, opts);
    window.addEventListener("pointerdown", fire, opts);
    window.addEventListener("keydown", fire, opts);
    function cleanup() {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", fire);
      window.removeEventListener("pointerdown", fire);
      window.removeEventListener("keydown", fire);
    }
    return cleanup;
  }, [status, evaluate]);

  const handleEnableWeb = async () => {
    setWorking(true);
    try {
      const { subscribeToWebPush } = await import("@/lib/web-push-client");
      const sub = await subscribeToWebPush();
      if (sub) {
        await logEvent("enabled", platform.platformTag);
        writePromptVersion(PUSH_PROMPT_VERSION);
        setMode("enabled");
      } else {
        await logEvent("declined", platform.platformTag);
        setMode("blocked-web");
      }
    } catch {
      setMode("blocked-web");
    } finally {
      setWorking(false);
    }
  };

  const handleEnableNative = async () => {
    setWorking(true);
    try {
      const { initPushNotifications } = await import("@/lib/push-notifications");
      const token = await initPushNotifications();
      if (token) {
        try {
          window.localStorage.setItem("klo-push-token", token);
        } catch {
          // ignore — non-critical
        }
        await logEvent("enabled", "native");
        writePromptVersion(PUSH_PROMPT_VERSION);
        setMode("enabled");
      } else {
        await logEvent("declined", "native");
        setMode("blocked-native");
      }
    } catch {
      setMode("blocked-native");
    } finally {
      setWorking(false);
    }
  };

  const handleDecline = async () => {
    setWorking(true);
    const tag = mode === "native-ask" ? "native" : platform.platformTag;
    await logEvent("declined", tag);
    writePromptVersion(PUSH_PROMPT_VERSION);
    setMode("declined");
    setWorking(false);
  };

  const handleDismiss = async () => {
    setWorking(true);
    const tag =
      mode === "native-ask" || mode === "blocked-native" ? "native" : platform.platformTag;
    await logEvent("dismissed", tag);
    writePromptVersion(PUSH_PROMPT_VERSION);
    setMode("hidden");
    setWorking(false);
  };

  const shouldRender =
    status === "authenticated" &&
    (mode === "web-ask" ||
      mode === "native-ask" ||
      mode === "ios-install" ||
      mode === "blocked-web" ||
      mode === "blocked-native");

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
          <div className="relative mx-auto max-w-md rounded-2xl border border-white/10 bg-[#0F141B]/95 backdrop-blur-md shadow-[0_16px_60px_rgba(0,0,0,0.55)] p-5">
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
                {mode === "blocked-web" || mode === "blocked-native" ? (
                  <Settings className="w-5 h-5 text-[#C8A84E]" />
                ) : (
                  <Bell className="w-5 h-5 text-[#C8A84E]" />
                )}
              </div>
              <div className="flex-1 min-w-0 pr-8">
                {mode === "web-ask" && (
                  <AskBody
                    working={working}
                    onEnable={handleEnableWeb}
                    onDecline={handleDecline}
                  />
                )}
                {mode === "native-ask" && (
                  <AskBody
                    working={working}
                    onEnable={handleEnableNative}
                    onDecline={handleDecline}
                  />
                )}
                {mode === "ios-install" && (
                  <IOSInstallHelp onDismiss={handleDismiss} working={working} />
                )}
                {mode === "blocked-web" && (
                  <BlockedWebHelp onDismiss={handleDismiss} working={working} />
                )}
                {mode === "blocked-native" && (
                  <BlockedNativeHelp onDismiss={handleDismiss} working={working} />
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AskBody({
  working,
  onEnable,
  onDecline,
}: {
  working: boolean;
  onEnable: () => void;
  onDecline: () => void;
}) {
  return (
    <>
      <h2 className="text-base font-semibold text-klo-text">Stay in the loop with Keith</h2>
      <p className="mt-1 text-sm text-klo-muted leading-relaxed">
        Get notified when Keith drops new content, events, and advisory sessions. No promotional
        spam — just the things you&apos;d want to know. You can turn it off anytime in your
        profile.
      </p>
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={onEnable}
          disabled={working}
          className="flex-1 min-h-[44px] px-4 rounded-lg bg-[#C8A84E] text-[#0D1117] font-semibold text-sm hover:brightness-110 active:brightness-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {working ? "Enabling…" : "Enable notifications"}
        </button>
        <button
          type="button"
          onClick={onDecline}
          disabled={working}
          className="flex-1 min-h-[44px] px-4 rounded-lg border border-white/10 bg-transparent text-klo-text text-sm hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          Not now
        </button>
      </div>
    </>
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

function BlockedWebHelp({ onDismiss, working }: { onDismiss: () => void; working: boolean }) {
  return (
    <>
      <h2 className="text-base font-semibold text-klo-text">Notifications are blocked</h2>
      <p className="mt-1 text-sm text-klo-muted leading-relaxed">
        Your browser has blocked notifications for this site. To re-enable them, open your
        browser&apos;s site settings and allow notifications for{" "}
        <span className="text-klo-text">keithlodom.ai</span>.
      </p>
      <ul className="mt-3 space-y-1.5 text-xs text-klo-muted leading-relaxed">
        <li>
          <span className="text-klo-text/80">Chrome / Edge:</span> click the lock icon in the
          address bar → Site settings → Notifications → Allow.
        </li>
        <li>
          <span className="text-klo-text/80">Safari:</span> Safari menu → Settings → Websites →
          Notifications → set keithlodom.ai to Allow.
        </li>
        <li>
          <span className="text-klo-text/80">Firefox:</span> click the shield/lock icon →
          Permissions → clear the notification block.
        </li>
      </ul>
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

function BlockedNativeHelp({ onDismiss, working }: { onDismiss: () => void; working: boolean }) {
  return (
    <>
      <h2 className="text-base font-semibold text-klo-text">Turn on notifications in Settings</h2>
      <p className="mt-1 text-sm text-klo-muted leading-relaxed">
        Notifications are turned off for KLO at the system level. Open your device settings to
        re-enable them — we&apos;ll only send updates and event alerts, never promotional spam.
      </p>
      <ul className="mt-3 space-y-1.5 text-xs text-klo-muted leading-relaxed">
        <li>
          <span className="text-klo-text/80">iPhone:</span> Settings → Notifications → KLO → Allow
          Notifications.
        </li>
        <li>
          <span className="text-klo-text/80">Android:</span> Settings → Apps → KLO → Notifications
          → enable.
        </li>
      </ul>
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
