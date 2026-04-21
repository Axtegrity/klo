import { NextRequest, NextResponse } from "next/server";
import { sendPushToUsers } from "@/lib/push-server";
import { getServiceSupabase } from "@/lib/supabase";
import { resend } from "@/lib/email";
import { pushSendSchema } from "@/lib/validation";
import { verifyCreativeStudioAdmin } from "@/lib/creative-studio-auth";

const FROM_ADDRESS = "KLO Advisory <notifications@keithlodom.ai>";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function notificationEmailHtml(title: string, body: string, url: string | undefined): string {
  const ctaUrl = url
    ? url.startsWith("http")
      ? url
      : `${process.env.NEXT_PUBLIC_APP_URL ?? "https://klo-app.vercel.app"}${url.startsWith("/") ? url : `/${url}`}`
    : null;
  const ctaBlock = ctaUrl
    ? `<a href="${escapeHtml(ctaUrl)}" style="display:inline-block;margin-top:20px;background:#C9A84C;color:#0B0F1A;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Open KLO</a>`
    : "";
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;padding:32px;border-radius:12px;color:#fff;">
      <h1 style="color:#C9A84C;font-size:22px;margin:0 0 12px;">${escapeHtml(title)}</h1>
      <p style="font-size:15px;line-height:1.6;color:#e5e5e5;white-space:pre-line;">${escapeHtml(body)}</p>
      ${ctaBlock}
      <hr style="border:none;border-top:1px solid #222;margin:28px 0 16px;" />
      <p style="font-size:12px;color:#888;">KLO Advisory · Keith L. Odom</p>
    </div>
  `;
}

export async function POST(request: NextRequest) {
  const session = await verifyCreativeStudioAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = pushSendSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, body, url, tag, userId, userIds } = parsed.data;
  const supabase = getServiceSupabase();
  const rawSenderId = (session.user as { id?: string }).id;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const sentBy = rawSenderId && UUID_RE.test(rawSenderId) ? rawSenderId : null;

  // Resolve target user set + audience type for the audit row.
  let targetIds: string[];
  let audienceType: "broadcast" | "user" | "users";
  if (userId) {
    targetIds = [userId];
    audienceType = "user";
  } else if (userIds && userIds.length > 0) {
    targetIds = userIds;
    audienceType = "users";
  } else {
    const { data: allProfiles, error } = await supabase
      .from("profiles")
      .select("id");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    targetIds = (allProfiles ?? []).map((p) => p.id);
    audienceType = "broadcast";
  }

  if (targetIds.length === 0) {
    return NextResponse.json({
      ok: true,
      push_sent: 0,
      push_failed: 0,
      email_sent: 0,
      email_failed: 0,
      total_targets: 0,
    });
  }

  // Partition: users with push subscription vs email-only
  const { data: subRows, error: subErr } = await supabase
    .from("push_subscriptions")
    .select("user_id")
    .in("user_id", targetIds);
  if (subErr) {
    return NextResponse.json({ error: subErr.message }, { status: 500 });
  }
  const pushUserIds = Array.from(new Set((subRows ?? []).map((r) => r.user_id)));
  const emailOnlyIds = targetIds.filter((id) => !pushUserIds.includes(id));

  const { data: emailProfiles, error: profErr } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", emailOnlyIds.length > 0 ? emailOnlyIds : ["00000000-0000-0000-0000-000000000000"]);
  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }
  const emailRecipients = (emailProfiles ?? []).filter((p) => !!p.email);

  const payload = { title, body, url, tag };

  // Fan out both channels in parallel
  const [pushResult, emailResult] = await Promise.all([
    pushUserIds.length > 0
      ? sendPushToUsers(pushUserIds, payload).catch((err) => {
          console.error("[POST /api/notify/send] push error", err);
          return { sent: 0, failed: pushUserIds.length, cleaned: 0 };
        })
      : Promise.resolve({ sent: 0, failed: 0, cleaned: 0 }),
    (async () => {
      const html = notificationEmailHtml(title, body, url);
      let sent = 0;
      let failed = 0;
      await Promise.allSettled(
        emailRecipients.map(async (p) => {
          try {
            const { error } = await resend.emails.send({
              from: FROM_ADDRESS,
              to: p.email!,
              subject: title,
              html,
            });
            if (error) throw new Error(error.message);
            sent++;
          } catch (err) {
            console.error("[POST /api/notify/send] email error", p.email, err);
            failed++;
          }
        })
      );
      return { sent, failed };
    })(),
  ]);

  const pushCleaned = (pushResult as { cleaned?: number }).cleaned ?? 0;

  // Fire-and-forget audit write — never block the response on it.
  void supabase
    .from("notifications_sent")
    .insert({
      sent_by: sentBy,
      title,
      body,
      url: url ?? null,
      tag: tag ?? null,
      audience_type: audienceType,
      target_user_ids: audienceType === "broadcast" ? null : targetIds,
      total_targets: targetIds.length,
      push_sent: pushResult.sent,
      push_failed: pushResult.failed,
      push_cleaned: pushCleaned,
      email_sent: emailResult.sent,
      email_failed: emailResult.failed,
    })
    .then(({ error }) => {
      if (error) console.error("[POST /api/notify/send] audit write failed", error);
    });

  return NextResponse.json({
    ok: true,
    total_targets: targetIds.length,
    push_sent: pushResult.sent,
    push_failed: pushResult.failed,
    push_cleaned: pushCleaned,
    email_sent: emailResult.sent,
    email_failed: emailResult.failed,
  });
}
