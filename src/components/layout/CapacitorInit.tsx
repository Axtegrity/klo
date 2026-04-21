"use client";

import { useEffect } from "react";

export default function CapacitorInit() {
  useEffect(() => {
    async function initCapacitor() {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;

        // Hide splash screen
        const { SplashScreen } = await import("@capacitor/splash-screen");
        await SplashScreen.hide();

        // Configure status bar
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setOverlaysWebView({ overlay: true });
        if (Capacitor.getPlatform() === "android") {
          await StatusBar.setBackgroundColor({ color: "#00000000" });
        }

        // Handle Android back button
        const { App } = await import("@capacitor/app");
        App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            App.exitApp();
          }
        });

        // Handle keyboard show/hide for BottomNav
        const { Keyboard } = await import("@capacitor/keyboard");
        Keyboard.addListener("keyboardWillShow", () => {
          document.body.classList.add("keyboard-open");
        });
        Keyboard.addListener("keyboardWillHide", () => {
          document.body.classList.remove("keyboard-open");
        });

        // Lock to portrait on phones
        const { lockPortrait } = await import("@/lib/screen-orientation");
        await lockPortrait();

        // Push notifications are initialized by <PushAutoInit /> inside AuthProvider
        // so registration happens only after a NextAuth session exists. Running it
        // here fired before login and silently 401'd the /api/push/subscribe write.

        // Handle deep links / app URL open
        const { App: CapApp } = await import("@capacitor/app");
        CapApp.addListener("appUrlOpen", (event) => {
          const url = new URL(event.url);
          const path = url.pathname;
          if (path && path !== "/") {
            window.location.href = path;
          }
        });
      } catch {
        // Not running in Capacitor — silently ignore
      }
    }

    initCapacitor();
  }, []);

  return null;
}
