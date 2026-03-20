import { Capacitor } from "@capacitor/core";

export async function initPushNotifications(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    // Request permission
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== "granted") return null;

    // Register with APNs/FCM
    await PushNotifications.register();

    // Return the device token via a promise
    return new Promise((resolve) => {
      PushNotifications.addListener("registration", async (token) => {
        console.log("[Push] Registered with token:", token.value);
        // Persist token to server for push delivery
        try {
          const platform = (await import("@capacitor/core")).Capacitor.getPlatform();
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              platform: platform === "ios" ? "ios" : "android",
              token: token.value,
            }),
          });
        } catch (e) {
          console.warn("[Push] Failed to persist token to server:", e);
        }
        resolve(token.value);
      });

      PushNotifications.addListener("registrationError", (error) => {
        console.error("[Push] Registration error:", error);
        resolve(null);
      });

      // Handle received notifications (foreground)
      PushNotifications.addListener(
        "pushNotificationReceived",
        (notification) => {
          console.log("[Push] Received:", notification.title);
        }
      );

      // Handle notification tap — navigate to target page if specified
      PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (action) => {
          console.log("[Push] Action:", action.notification.title);
          const data = action.notification.data as Record<string, string> | undefined;
          if (data?.url) {
            window.location.href = data.url;
          }
        }
      );
    });
  } catch (err) {
    console.error("[Push] Init error:", err);
    return null;
  }
}

export async function checkPushPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const result = await PushNotifications.checkPermissions();
    return result.receive === "granted";
  } catch {
    return false;
  }
}
