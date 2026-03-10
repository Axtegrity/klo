import { Capacitor } from "@capacitor/core";

async function vibrate(style: "light" | "medium" | "heavy" | "success" | "warning" | "error") {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
    if (style === "success") return Haptics.notification({ type: NotificationType.Success });
    if (style === "warning") return Haptics.notification({ type: NotificationType.Warning });
    if (style === "error") return Haptics.notification({ type: NotificationType.Error });
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
    return Haptics.impact({ style: map[style] });
  } catch {}
}

export const haptics = {
  light: () => vibrate("light"),
  medium: () => vibrate("medium"),
  heavy: () => vibrate("heavy"),
  success: () => vibrate("success"),
  warning: () => vibrate("warning"),
  error: () => vibrate("error"),
};
