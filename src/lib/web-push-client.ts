const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

/**
 * Check if web push is supported in this browser
 */
export function isWebPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Get current web push permission state
 */
export function getWebPushPermission(): NotificationPermission | "unsupported" {
  if (!isWebPushSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Check if the user is already subscribed to web push
 */
export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isWebPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

/**
 * Subscribe to web push notifications.
 * Requests permission, registers the service worker, and creates a push subscription.
 * Then persists it to the server.
 */
export async function subscribeToWebPush(): Promise<PushSubscription | null> {
  if (!isWebPushSupported()) return null;

  // Request notification permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  // Ensure service worker is registered
  const reg = await navigator.serviceWorker.ready;

  // Check for existing subscription
  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  // Persist to server
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      platform: "web",
      token: subscription.toJSON(),
    }),
  });

  return subscription;
}

/**
 * Unsubscribe from web push notifications
 */
export async function unsubscribeFromWebPush(): Promise<boolean> {
  if (!isWebPushSupported()) return false;

  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.getSubscription();
  if (!subscription) return true;

  // Remove from server
  await fetch("/api/push/unsubscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: subscription.toJSON() }),
  });

  // Unsubscribe from browser
  await subscription.unsubscribe();
  return true;
}
