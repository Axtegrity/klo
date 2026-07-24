import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyCreativeStudioAdmin } from "@/lib/creative-studio-auth";
import { vaultDraftReviewSchema } from "@/lib/validation";
import type { VaultDraft } from "@/lib/supabase";

// PATCH /api/admin/content-automation/drafts/[id] — publish or discard a draft.
//
// This route is action-gated, not a general field-update endpoint: the body
// is validated against vaultDraftReviewSchema, which accepts exactly one
// field ({ action: "publish" | "discard" }). Nothing from the request body
// is ever spread into a DB update object — every column written below is
// chosen by server-side logic based on which action ran. The ALLOWED_FIELDS
// allowlist pattern used in src/app/api/admin/events/[id]/route.ts exists to
// stop an arbitrary client-supplied field from reaching an update() call;
// there is no such arbitrary field surface here, so that pattern does not
// apply to this route.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyCreativeStudioAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = vaultDraftReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();
  const email = session.user?.email ?? "unknown";
  const now = new Date().toISOString();
  const targetStatus = parsed.data.action === "publish" ? "published" : "discarded";

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

  if (!claimed) {
    // Either the draft doesn't exist, or it's already been reviewed.
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

  const draft = claimed as VaultDraft;

  if (parsed.data.action === "discard") {
    await supabase.from("admin_activity_log").insert({
      admin_user_id: (session.user as { id?: string }).id ?? null,
      admin_email: email,
      action: "DISCARD",
      entity_type: "vault_draft",
      entity_id: draft.id,
      details: `Discarded content automation draft: ${draft.title}`,
    });

    return NextResponse.json({ data: draft });
  }

  // Publish: copy the draft's shared fields into vault_content, matching the
  // create pattern in src/app/api/admin/content-manager/vault/route.ts (both
  // the legacy `published` boolean and the `visibility` enum are set — see
  // that route for why both columns exist).
  const { data: published, error: publishError } = await supabase
    .from("vault_content")
    .insert({
      title: draft.title,
      slug: draft.slug,
      body: draft.body,
      excerpt: draft.excerpt,
      category: draft.category,
      content_type: draft.content_type,
      tier_required: draft.tier_required,
      author_name: "Keith L. Odom",
      visibility: "published",
      published: true,
      published_at: now,
    })
    .select()
    .single();

  if (publishError) {
    console.error("[PATCH /api/admin/content-automation/drafts/[id]] publish failed, reverting claim", publishError);
    // Revert the claim so the draft isn't stuck "published" with no
    // corresponding vault_content row — leaves it reviewable again.
    await supabase
      .from("vault_drafts")
      .update({ status: "pending", reviewed_at: null, reviewed_by: null })
      .eq("id", draft.id);

    return NextResponse.json({ error: publishError.message }, { status: 500 });
  }

  await supabase.from("admin_activity_log").insert({
    admin_user_id: (session.user as { id?: string }).id ?? null,
    admin_email: email,
    action: "PUBLISH",
    entity_type: "vault_draft",
    entity_id: draft.id,
    details: `Published content automation draft as vault_content: ${draft.title}`,
    metadata: { vault_content_id: published.id },
  });

  return NextResponse.json({ data: draft, published });
}
