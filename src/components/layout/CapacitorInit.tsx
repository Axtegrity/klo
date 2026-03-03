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
      } catch {
        // Not running in Capacitor — silently ignore
      }
    }

    initCapacitor();
  }, []);

  return null;
}
