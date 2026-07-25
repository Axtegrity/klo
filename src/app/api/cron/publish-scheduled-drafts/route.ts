import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { publishClaimedDraft } from "@/lib/content-automation";
import type { VaultDraft } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// System actor recorded on admin_activity_log rows this cron writes —
// admin_email has no NOT NULL/enum constraint, so a label is enough to
// distinguish these from a human admin's publish/schedule actions.
const CRON_ACTOR_EMAIL = "system:publish-scheduled-drafts";

// Hourly: publish any draft whose scheduled_publish_at has passed. Same
// CRON_SECRET bearer-auth pattern as the other cron routes — see
// src/app/api/cron/sync-events/route.ts for the reference implementation.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const now = new Date().toISOString();

  const { data: due, error: dueError } = await supabase
    .from("vault_drafts")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_publish_at", now);

  if (dueError) {
    console.error("[GET /api/cron/publish-scheduled-drafts]", dueError);
    return NextResponse.json({ error: dueError.message }, { status: 500 });
  }

  let published = 0;
  let errors = 0;

  for (const row of (due ?? []) as VaultDraft[]) {
    try {
      // Atomically claim: only succeeds if the draft is still "scheduled" —
      // guards against a second overlapping cron invocation (or an admin's
      // manual publish/cancel racing this run) double-publishing the same
      // draft. Same claim-then-act shape as the manual PATCH route.
      const { data: claimed, error: claimError } = await supabase
        .from("vault_drafts")
        .update({ status: "published", reviewed_at: now, reviewed_by: CRON_ACTOR_EMAIL })
        .eq("id", row.id)
        .eq("status", "scheduled")
        .select("*")
        .maybeSingle();

      if (claimError) throw new Error(claimError.message);
      if (!claimed) continue; // already claimed by something else since the select above

      const draft = claimed as VaultDraft;
      const result = await publishClaimedDraft(
        supabase,
        draft,
        { email: CRON_ACTOR_EMAIL, userId: null },
        { status: "scheduled", scheduled_publish_at: draft.scheduled_publish_at }
      );

      if (!result.success) throw new Error(result.error ?? "publish failed");
      published++;
    } catch (error) {
      // Per-draft error isolation — one bad draft doesn't stop the batch.
      console.error(`[GET /api/cron/publish-scheduled-drafts] draft ${row.id} failed`, error);
      errors++;
    }
  }

  return NextResponse.json({ published, errors });
}
