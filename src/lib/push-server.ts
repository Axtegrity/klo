import webpush from "web-push";
import { getServiceSupabase } from "@/lib/supabase";

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:kodom@techchurch.io";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

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
          // Native tokens (iOS/Android) — log for now, FCM integration later
          console.log(`[Push] Native ${sub.platform} token — FCM send not yet configured`);
          sent++;
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
