import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyCreativeStudioAdmin } from "@/lib/creative-studio-auth";
import { vaultPendingToolReviewSchema, toolConfigSchema } from "@/lib/validation";
import { generateUniqueSlug } from "@/lib/vault-slug";
import { VAULT_CATEGORIES } from "@/lib/vault-data";
import type { VaultPendingToolUpdate } from "@/lib/supabase";
import type { ToolConfig } from "@/lib/page-config-server";
import { upsertVaultEmbedding } from "@/lib/vault-embeddings";

// Maps a suggestion's freeform `category` (e.g. "Productivity", "Research")
// onto the closest VAULT_CATEGORIES value so the archived vault_content row
// lands in a category the public Vault's filter tabs actually recognize —
// same reasoning as vaultTopicLaneSchema's `name` constraint in
// validation.ts. Case-insensitive exact match only (the tool-category and
// VAULT_CATEGORIES vocabularies barely overlap, so anything fancier than an
// exact match would be guessing); falls back to "AI & Ethics" per spec.
function mapToVaultCategory(toolCategory: string): (typeof VAULT_CATEGORIES)[number] {
  const normalized = toolCategory.trim().toLowerCase();
  const match = VAULT_CATEGORIES.find((c) => c.toLowerCase() === normalized);
  return match ?? "AI & Ethics";
}

// Archives the currently-live AI Tool of the Week into vault_content before
// it gets overwritten, so a past week's pick isn't just lost — it becomes a
// browsable Vault article. Never throws: any failure here is logged/reported
// to Sentry and swallowed, since losing the archive copy must never block
// publishing the new tool (spec: "the tool still goes live, the archive
// failure is non-blocking").
async function archiveCurrentTool(
  supabase: SupabaseClient,
  actor: { email: string; userId: string | null }
): Promise<void> {
  try {
    const { data: pageConfig, error: pageConfigError } = await supabase
      .from("page_configs")
      .select("tool_config")
      .eq("page_slug", "home")
      .maybeSingle();

    if (pageConfigError) {
      throw new Error(`Failed to load current tool_config: ${pageConfigError.message}`);
    }

    const currentTool = pageConfig?.tool_config as ToolConfig | null;
    if (!currentTool?.name) return; // nothing live yet — nothing to archive

    const slug = await generateUniqueSlug(currentTool.name, "-tool-review", supabase);
    const body = `## What It Is\n${currentTool.description}\n\n## Why It Matters for Faith Leaders\n${currentTool.why}\n\n## Try It\n${currentTool.link}`;

    const { data: archived, error: archiveError } = await supabase
      .from("vault_content")
      .insert({
        title: currentTool.name,
        slug,
        body,
        excerpt: currentTool.description.slice(0, 150),
        category: mapToVaultCategory(currentTool.category),
        content_type: "guide",
        tier_required: "free",
        author_name: "Keith L. Odom",
        visibility: "published",
        published: true,
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (archiveError) {
      throw new Error(`Failed to archive previous tool: ${archiveError.message}`);
    }

    await supabase.from("admin_activity_log").insert({
      admin_user_id: actor.userId,
      admin_email: actor.email,
      action: "ARCHIVE",
      entity_type: "vault_content",
      entity_id: archived.id,
      details: `Archived previous AI Tool of the Week to Vault: ${currentTool.name}`,
    });

    // Embed for the RAG knowledge base — own try/catch (not folded into the
    // outer one) so a failure here is attributed accurately: the archive
    // itself already succeeded by this point, only the embedding step
    // failed, and the log/Sentry message should say so rather than implying
    // the archive didn't happen. Still just as non-blocking either way.
    try {
      const excerpt = currentTool.description.slice(0, 150);
      await upsertVaultEmbedding(archived.id, currentTool.name, body, excerpt);
    } catch (embeddingError) {
      console.error(
        "[PATCH /api/admin/content-automation/tool-updates/[id]] archive succeeded but embedding failed",
        embeddingError
      );
      Sentry.captureException(embeddingError, {
        extra: { source: "tool-of-the-week-archive-embedding", vault_content_id: archived.id },
      });
    }
  } catch (error) {
    console.error("[PATCH /api/admin/content-automation/tool-updates/[id]] archive failed, continuing publish", error);
    Sentry.captureException(error, {
      extra: { source: "tool-of-the-week-archive" },
    });
  }
}

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
  // and its shared `toolConfigSchema` (validation.ts, also used by
  // pageConfigUpdateSchema). Re-validated here rather than trusted as-is:
  // this row was already schema-checked once at insert time
  // (generateAIToolSuggestion(), src/lib/content-automation.ts), but this is
  // the point where it actually reaches the public-facing tool_config
  // column that the homepage renders an href from, so it gets a second,
  // independent check immediately before that write rather than relying on
  // the insert-time check alone. (Avery review, PR #234 follow-up.)
  const toolConfigParsed = toolConfigSchema.safeParse({
    name: suggestion.tool_name,
    category: suggestion.category,
    description: suggestion.description,
    why: suggestion.why_it_matters,
    link: suggestion.link,
    cta: suggestion.cta,
  });

  if (!toolConfigParsed.success) {
    console.error(
      "[PATCH /api/admin/content-automation/tool-updates/[id]] suggestion failed tool_config validation, reverting claim",
      toolConfigParsed.error.flatten()
    );
    await supabase
      .from("vault_pending_tool_updates")
      .update({ status: "pending", reviewed_at: null, reviewed_by: null })
      .eq("id", suggestion.id);

    return NextResponse.json(
      { error: "Suggestion failed validation and cannot be published", details: toolConfigParsed.error.flatten() },
      { status: 422 }
    );
  }

  // Archive whatever tool is currently live before it gets overwritten below
  // — non-blocking (see archiveCurrentTool's own try/catch): the new tool
  // still goes live even if the archive copy fails to save.
  await archiveCurrentTool(supabase, { email, userId });

  const { error: publishError } = await supabase
    .from("page_configs")
    .update({ tool_config: toolConfigParsed.data })
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
