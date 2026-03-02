"use client";

import { useState } from "react";

export type Platform = "ios" | "android" | "web";

interface PlatformInfo {
  platform: Platform;
  isNative: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
}

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "web";
  const ua = navigator.userAgent.toLowerCase();
  const isCapacitor = !!(window as unknown as Record<string, unknown>).Capacitor;

  if (isCapacitor) {
    if (/iphone|ipad|ipod/.test(ua)) return "ios";
    if (/android/.test(ua)) return "android";
  }
  return "web";
}

export function usePlatform(): PlatformInfo {
  const [platform] = useState<Platform>(detectPlatform);

  return {
    platform,
    isNative: platform !== "web",
    isIOS: platform === "ios",
    isAndroid: platform === "android",
    isWeb: platform === "web",
  };
}
