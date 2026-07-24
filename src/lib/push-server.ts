import webpush from "web-push";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getServiceSupabase } from "@/lib/supabase";

// Configure web-push with VAPID keys (lazy — env vars unavailable at build time)
let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:kodom@techchurch.io";
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys not configured");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

// Configure firebase-admin for native (iOS/Android) push (lazy — env vars unavailable at build time)
function ensureFirebase() {
  if (getApps().length > 0) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase credentials not configured");
  }
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

/**
 * Send a push notification to a specific user (all their devices)
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  ensureVapid();
  const supabase = getServiceSupabase();
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, platform, token")
    .eq("user_id", userId);

  if (error || !subs?.length) return { sent: 0, failed: 0 };

  return sendToSubscriptions(subs, payload);
}

/**
 * Broadcast a push notification to ALL subscribed users
 */
export async function broadcastPush(payload: PushPayload) {
  ensureVapid();
  const supabase = getServiceSupabase();
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, platform, token");

  if (error || !subs?.length) return { sent: 0, failed: 0 };

  return sendToSubscriptions(subs, payload);
}

/**
 * Send to a filtered set of users (e.g., by tier)
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  ensureVapid();
  const supabase = getServiceSupabase();
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, platform, token")
    .in("user_id", userIds);

  if (error || !subs?.length) return { sent: 0, failed: 0 };

  return sendToSubscriptions(subs, payload);
}

async function sendToSubscriptions(
  subs: { id: string; platform: string; token: string }[],
  payload: PushPayload
) {
  let sent = 0;
  let failed = 0;
  const staleIds: string[] = [];

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icons/icon-192.png",
    badge: payload.badge || "/icons/badge-72.png",
    data: { url: payload.url || "/" },
    tag: payload.tag,
  });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        if (sub.platform === "web") {
          const subscription = JSON.parse(sub.token);
          await webpush.sendNotification(subscription, notificationPayload);
          sent++;
        } else {
          try {
            ensureFirebase();
            await getMessaging().send({
              token: sub.token,
              notification: {
                title: payload.title,
                body: payload.body,
              },
              data: { url: payload.url || "/" },
            });
            sent++;
          } catch (fcmErr: unknown) {
            const code = (fcmErr as { code?: string })?.code;
            if (
              code === "messaging/registration-token-not-registered" ||
              code === "messaging/invalid-registration-token"
            ) {
              staleIds.push(sub.id);
            } else {
              console.error(`[Push] FCM send failed for ${sub.platform} subscription ${sub.id}`, fcmErr);
            }
            failed++;
          }
        }
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          // Subscription expired or invalid — mark for cleanup
          staleIds.push(sub.id);
        }
        failed++;
      }
    })
  );

  // Clean up stale subscriptions
  if (staleIds.length > 0) {
    const supabase = getServiceSupabase();
    await supabase.from("push_subscriptions").delete().in("id", staleIds);
  }

  return { sent, failed, cleaned: staleIds.length };
}
