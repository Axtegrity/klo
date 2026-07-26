import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyCreativeStudioAdmin } from "@/lib/creative-studio-auth";
import { vaultPendingToolReviewSchema } from "@/lib/validation";
import type { VaultPendingToolUpdate } from "@/lib/supabase";

// PATCH /api/admin/content-automation/tool-updates/[id] — publish or
// discard an AI Tool of the Week suggestion.
//
// Matches the action-gated PATCH convention used by
// src/app/api/admin/content-automation/drafts/[id]/route.ts rather than a
// plain POST — an action-on-a-specific-resource endpoint is a PATCH in this
// repo's existing routes (drafts/[id], trusted-sources), so this follows
// suit for consistency rather than introducing a new verb for the same
// shape of operation.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyCreativeStudioAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = vaultPendingToolReviewSchema.safeParse(body);
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
  const targetStatus = action === "publish" ? "published" : "discarded";

  // Atomically claim the suggestion: only succeeds if it's still "pending" —
  // same race-guard pattern as the drafts/[id] PATCH route.
  const { data: claimed, error: claimError } = await supabase
    .from("vault_pending_tool_updates")
    .update({ status: targetStatus, reviewed_at: now, reviewed_by: email })
    .eq("id", id)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (claimError) {
    console.error("[PATCH /api/admin/content-automation/tool-updates/[id]]", claimError);
    return NextResponse.json({ error: claimError.message }, { status: 500 });
  }

  if (!claimed) {
    const { data: existing } = await supabase
      .from("vault_pending_tool_updates")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: `Suggestion already reviewed (status: ${existing.status})` },
      { status: 409 }
    );
  }

  const suggestion = claimed as VaultPendingToolUpdate;

  if (action === "discard") {
    await supabase.from("admin_activity_log").insert({
      admin_user_id: userId,
      admin_email: email,
      action: "DISCARD",
      entity_type: "vault_pending_tool_update",
      entity_id: suggestion.id,
      details: `Discarded AI Tool of the Week suggestion: ${suggestion.tool_name}`,
    });

    return NextResponse.json({ data: suggestion });
  }

  // Publish: write the suggestion into page_configs.tool_config for the
  // home page — same field names as ToolConfig (src/lib/page-config-server.ts)
  // and its `tool_config` Zod shape in validation.ts (pageConfigUpdateSchema).
  const { error: publishError } = await supabase
    .from("page_configs")
    .update({
      tool_config: {
        name: suggestion.tool_name,
        category: suggestion.category,
        description: suggestion.description,
        why: suggestion.why_it_matters,
        link: suggestion.link,
        cta: suggestion.cta,
      },
    })
    .eq("page_slug", "home");

  if (publishError) {
    console.error(
      "[PATCH /api/admin/content-automation/tool-updates/[id]] page_configs update failed, reverting claim",
      publishError
    );
    await supabase
      .from("vault_pending_tool_updates")
      .update({ status: "pending", reviewed_at: null, reviewed_by: null })
      .eq("id", suggestion.id);

    return NextResponse.json({ error: publishError.message }, { status: 500 });
  }

  await supabase.from("admin_activity_log").insert({
    admin_user_id: userId,
    admin_email: email,
    action: "PUBLISH",
    entity_type: "vault_pending_tool_update",
    entity_id: suggestion.id,
    details: `Published AI Tool of the Week: ${suggestion.tool_name}`,
  });

  return NextResponse.json({ data: suggestion });
}
