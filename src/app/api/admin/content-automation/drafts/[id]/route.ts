import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyCreativeStudioAdmin } from "@/lib/creative-studio-auth";
import { vaultDraftReviewSchema, vaultDraftEditSchema } from "@/lib/validation";
import { publishClaimedDraft } from "@/lib/content-automation";
import type { VaultDraft } from "@/lib/supabase";

// PATCH /api/admin/content-automation/drafts/[id] — publish, schedule, or
// discard a draft.
//
// This route is action-gated, not a general field-update endpoint: the body
// is validated against vaultDraftReviewSchema, which accepts only
// { action: "publish" | "discard" | "schedule", scheduled_publish_at? }.
// Nothing from the request body is ever spread into a DB update object —
// every column written below is chosen by server-side logic based on which
// action ran. The ALLOWED_FIELDS allowlist pattern used in
// src/app/api/admin/events/[id]/route.ts exists to stop an arbitrary
// client-supplied field from reaching an update() call; there is no such
// arbitrary field surface here, so that pattern does not apply to this route.
//
// "publish" shares its vault_content-insert + activity-log logic with the
// scheduled-publish cron (src/app/api/cron/publish-scheduled-drafts/route.ts)
// via publishClaimedDraft() in src/lib/content-automation.ts — see that
// function's comment for why the atomic claim stays here rather than moving
// into the shared helper.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyCreativeStudioAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);

  // "edit" is validated against its own schema (different field shape than
  // the review actions below) — branch on the raw action string before
  // picking which schema applies, same pattern used for "schedule" vs
  // "cancel_schedule" further down.
  if ((body as { action?: unknown } | null)?.action === "edit") {
    return handleEdit(id, body, session);
  }

  const parsed = vaultDraftReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();
  const email = session.user?.email ?? "unknown";
  const userId = (session.user as { id?: string }).id ?? null;
  const now = new Date().toISOString();
  const action = parsed.data.action;

  // Shared "the atomic claim below matched 0 rows" handler — either the
  // draft doesn't exist, or it's not in the status this action expects to
  // claim from (already reviewed / already scheduled / not scheduled).
  async function notClaimedResponse() {
    const { data: existing } = await supabase
      .from("vault_drafts")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: `Draft already reviewed (status: ${existing.status})` },
      { status: 409 }
    );
  }

  if (action === "cancel_schedule") {
    const { data: claimed, error: claimError } = await supabase
      .from("vault_drafts")
      .update({ status: "pending", scheduled_publish_at: null, reviewed_at: null, reviewed_by: null })
      .eq("id", id)
      .eq("status", "scheduled")
      .select("*")
      .maybeSingle();

    if (claimError) {
      console.error("[PATCH /api/admin/content-automation/drafts/[id]]", claimError);
      return NextResponse.json({ error: claimError.message }, { status: 500 });
    }
    if (!claimed) return notClaimedResponse();

    await supabase.from("admin_activity_log").insert({
      admin_user_id: userId,
      admin_email: email,
      action: "CANCEL_SCHEDULE",
      entity_type: "vault_draft",
      entity_id: claimed.id,
      details: `Cancelled scheduled publish for content automation draft: ${claimed.title}`,
    });

    return NextResponse.json({ data: claimed as VaultDraft });
  }

  if (action === "schedule") {
    // scheduled_publish_at's presence + future-datetime-ness is already
    // enforced by vaultDraftReviewSchema — safe to assert non-null here.
    const scheduledPublishAt = parsed.data.scheduled_publish_at as string;

    const { data: claimed, error: claimError } = await supabase
      .from("vault_drafts")
      .update({
        status: "scheduled",
        scheduled_publish_at: scheduledPublishAt,
        reviewed_at: null,
        reviewed_by: null,
      })
      .eq("id", id)
      .eq("status", "pending")
      .select("*")
      .maybeSingle();

    if (claimError) {
      console.error("[PATCH /api/admin/content-automation/drafts/[id]]", claimError);
      return NextResponse.json({ error: claimError.message }, { status: 500 });
    }
    if (!claimed) return notClaimedResponse();

    await supabase.from("admin_activity_log").insert({
      admin_user_id: userId,
      admin_email: email,
      action: "SCHEDULE",
      entity_type: "vault_draft",
      entity_id: claimed.id,
      details: `Scheduled content automation draft to publish at ${scheduledPublishAt}: ${claimed.title}`,
    });

    return NextResponse.json({ data: claimed as VaultDraft });
  }

  // action is "publish" | "discard" — unchanged from the pre-scheduling
  // behavior: a single atomic claim from "pending", then act on the result.
  const targetStatus = action === "publish" ? "published" : "discarded";

  // Atomically claim the draft: only succeeds if it's still "pending". This
  // closes the race where two admins click publish/discard on the same
  // draft at nearly the same time — the second request gets 0 rows back
  // and is told the draft was already reviewed, instead of double-inserting
  // into vault_content or silently overwriting the first reviewer's action.
  const { data: claimed, error: claimError } = await supabase
    .from("vault_drafts")
    .update({ status: targetStatus, reviewed_at: now, reviewed_by: email })
    .eq("id", id)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (claimError) {
    console.error("[PATCH /api/admin/content-automation/drafts/[id]]", claimError);
    return NextResponse.json({ error: claimError.message }, { status: 500 });
  }

  if (!claimed) return notClaimedResponse();

  const draft = claimed as VaultDraft;

  if (action === "discard") {
    await supabase.from("admin_activity_log").insert({
      admin_user_id: userId,
      admin_email: email,
      action: "DISCARD",
      entity_type: "vault_draft",
      entity_id: draft.id,
      details: `Discarded content automation draft: ${draft.title}`,
    });

    return NextResponse.json({ data: draft });
  }

  const result = await publishClaimedDraft(
    supabase,
    draft,
    { email, userId },
    { status: "pending", scheduled_publish_at: null }
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: draft, published: result.published });
}

// Handles { action: "edit", title?, body?, excerpt? } — lets an admin correct
// AI-generated copy in place before publishing, rather than discarding and
// regenerating over a small wording issue. Only allowed while the draft is
// still "pending" or "scheduled" (an already-published/discarded draft is
// immutable here — same reviewed-once posture as the publish/discard
// actions above); enforced via the UPDATE's WHERE clause, not a separate
// SELECT-then-check, to avoid a race between the check and the write.
async function handleEdit(
  id: string,
  body: unknown,
  session: NonNullable<Awaited<ReturnType<typeof verifyCreativeStudioAdmin>>>
) {
  const parsed = vaultDraftEditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();
  const email = session.user?.email ?? "unknown";
  const userId = (session.user as { id?: string }).id ?? null;

  const { action, ...fields } = parsed.data;
  void action;

  const { data: updated, error: updateError } = await supabase
    .from("vault_drafts")
    .update(fields)
    .eq("id", id)
    .in("status", ["pending", "scheduled"])
    .select("*")
    .maybeSingle();

  if (updateError) {
    console.error("[PATCH /api/admin/content-automation/drafts/[id]] edit failed", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updated) {
    const { data: existing } = await supabase
      .from("vault_drafts")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: `Draft cannot be edited (status: ${existing.status})` },
      { status: 409 }
    );
  }

  await supabase.from("admin_activity_log").insert({
    admin_user_id: userId,
    admin_email: email,
    action: "EDIT",
    entity_type: "vault_draft",
    entity_id: updated.id,
    details: `Edited content automation draft (${Object.keys(fields).join(", ")}): ${updated.title}`,
  });

  return NextResponse.json({ data: updated as VaultDraft });
}
