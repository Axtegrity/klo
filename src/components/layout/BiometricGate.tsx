"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { isBiometricAvailable, biometricVerify } from "@/lib/biometric-auth";

const BIOMETRIC_LOCK_KEY = "klo-biometric-lock";

export function isBiometricLockEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(BIOMETRIC_LOCK_KEY) === "true";
}

export function setBiometricLockEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BIOMETRIC_LOCK_KEY, enabled ? "true" : "false");
}

export default function BiometricGate({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(false);
  const verifyingRef = useRef(false);

  const unlock = useCallback(async () => {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setChecking(true);
    const success = await biometricVerify("Unlock KLO");
    if (success) {
      setLocked(false);
    }
    setChecking(false);
    // Delay clearing the flag so rapid appStateChange events don't re-trigger
    setTimeout(() => { verifyingRef.current = false; }, 1500);
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function setup() {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;

        const { App } = await import("@capacitor/app");

        const listener = await App.addListener("appStateChange", async (state) => {
          // Skip if already verifying (prevents loop when biometric/passcode UI causes state changes)
          if (verifyingRef.current) return;
          if (state.isActive && isBiometricLockEnabled()) {
            const available = await isBiometricAvailable();
            if (available) {
              setLocked(true);
              verifyingRef.current = true;
              setChecking(true);
              const success = await biometricVerify("Unlock KLO");
              if (success) {
                setLocked(false);
              }
              setChecking(false);
              setTimeout(() => { verifyingRef.current = false; }, 1500);
            }
          }
        });

        cleanup = () => {
          listener.remove();
        };
      } catch {
        // Not running in Capacitor
      }
    }

    setup();

    return () => {
      cleanup?.();
    };
  }, []);

  if (!locked) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0D1117]"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/* KLO Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 rounded-full bg-[#2764FF]/15 border-2 border-[#2764FF]/30 flex items-center justify-center">
            <span className="font-display text-3xl font-bold text-[#2764FF]">
              KLO
            </span>
          </div>
        </div>

        <h2 className="font-display text-xl font-semibold text-klo-text mb-2">
          App Locked
        </h2>
        <p className="text-klo-muted text-sm mb-8 text-center px-8">
          Use Face ID or Touch ID to unlock
        </p>

        <button
          onClick={unlock}
          disabled={checking}
          className="px-8 py-3 rounded-xl bg-[#2764FF] text-white font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
        >
          {checking ? "Verifying..." : "Tap to Unlock"}
        </button>
      </div>
    </>
  );
}
