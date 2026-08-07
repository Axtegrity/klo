import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyCreativeStudioAdmin } from "@/lib/creative-studio-auth";
import { vaultPendingBriefReviewSchema } from "@/lib/validation";
import { generateUniqueSlug } from "@/lib/vault-slug";
import type { VaultPendingBriefUpdate } from "@/lib/supabase";
import type { BriefConfig } from "@/lib/page-config-server";
import { upsertVaultEmbedding } from "@/lib/vault-embeddings";

// Archives the currently-live Intelligence Brief into vault_content before
// it gets overwritten, so a past brief isn't just lost — it becomes a
// browsable Vault article. Same non-blocking shape as archiveCurrentTool()
// (tool-updates/[id]/route.ts): any failure here is logged/reported to
// Sentry and swallowed, since losing the archive copy must never block
// publishing the new brief. brief_config only stores title/date/excerpt/
// link/cta (no full body), so — same constraint archiveCurrentTool() has
// with ToolConfig — the archived body is reconstructed from what's actually
// available: title as heading, excerpt as body intro.
async function archiveCurrentBrief(
  supabase: SupabaseClient,
  actor: { email: string; userId: string | null }
): Promise<void> {
  try {
    const { data: pageConfig, error: pageConfigError } = await supabase
      .from("page_configs")
      .select("brief_config")
      .eq("page_slug", "home")
      .maybeSingle();

    if (pageConfigError) {
      throw new Error(`Failed to load current brief_config: ${pageConfigError.message}`);
    }

    const currentBrief = pageConfig?.brief_config as BriefConfig | null;
    if (!currentBrief?.title) return; // nothing live yet — nothing to archive

    const slug = await generateUniqueSlug(currentBrief.title, "-brief", supabase);
    const body = `## ${currentBrief.title}\n\n${currentBrief.excerpt}`;
    const excerpt = currentBrief.excerpt.slice(0, 150);

    const { data: archived, error: archiveError } = await supabase
      .from("vault_content")
      .insert({
        title: currentBrief.title,
        slug,
        body,
        excerpt,
        category: "Leadership",
        content_type: "briefing",
        tier_required: "free",
        author_name: "Keith L. Odom",
        visibility: "published",
        published: true,
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (archiveError) {
      throw new Error(`Failed to archive previous brief: ${archiveError.message}`);
    }

    await supabase.from("admin_activity_log").insert({
      admin_user_id: actor.userId,
      admin_email: actor.email,
      action: "ARCHIVE",
      entity_type: "vault_content",
      entity_id: archived.id,
      details: `Archived previous Intelligence Brief to Vault: ${currentBrief.title}`,
    });

    // Embed for the RAG knowledge base — own try/catch (not folded into the
    // outer one) so a failure here is attributed accurately: the archive
    // itself already succeeded by this point, only the embedding step
    // failed. Still just as non-blocking either way.
    try {
      await upsertVaultEmbedding(archived.id, currentBrief.title, body, excerpt);
    } catch (embeddingError) {
      console.error(
        "[PATCH /api/admin/content-automation/brief-updates/[id]] archive succeeded but embedding failed",
        embeddingError
      );
      Sentry.captureException(embeddingError, {
        extra: { source: "intelligence-brief-archive-embedding", vault_content_id: archived.id },
      });
    }
  } catch (error) {
    console.error("[PATCH /api/admin/content-automation/brief-updates/[id]] archive failed, continuing publish", error);
    Sentry.captureException(error, {
      extra: { source: "intelligence-brief-archive" },
    });
  }
}

// PATCH /api/admin/content-automation/brief-updates/[id] — publish or
// discard an Intelligence Brief draft. Same action-gated PATCH convention as
// tool-updates/[id]/route.ts and drafts/[id]/route.ts.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyCreativeStudioAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = vaultPendingBriefReviewSchema.safeParse(body);
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

  // Atomically claim the draft: only succeeds if it's still "pending" — same
  // race-guard pattern as drafts/[id] and tool-updates/[id].
  const { data: claimed, error: claimError } = await supabase
    .from("vault_pending_brief_updates")
    .update({ status: targetStatus, reviewed_at: now, reviewed_by: email })
    .eq("id", id)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (claimError) {
    console.error("[PATCH /api/admin/content-automation/brief-updates/[id]]", claimError);
    return NextResponse.json({ error: claimError.message }, { status: 500 });
  }

  if (!claimed) {
    const { data: existing } = await supabase
      .from("vault_pending_brief_updates")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: `Brief already reviewed (status: ${existing.status})` },
      { status: 409 }
    );
  }

  const draft = claimed as VaultPendingBriefUpdate;

  if (action === "discard") {
    await supabase.from("admin_activity_log").insert({
      admin_user_id: userId,
      admin_email: email,
      action: "DISCARD",
      entity_type: "vault_pending_brief_update",
      entity_id: draft.id,
      details: `Discarded Intelligence Brief: ${draft.title}`,
    });

    return NextResponse.json({ data: draft });
  }

  // Publish. Order differs slightly from the source spec's listing because
  // brief_config.link must point at the new vault_content article, so that
  // article has to exist (and have a slug) before brief_config is written —
  // archive-old, then insert-new, then point brief_config at it.

  // 1. Archive whatever brief is currently live before it gets overwritten
  //    below — non-blocking (see archiveCurrentBrief's own try/catch): the
  //    new brief still goes live even if the archive copy fails to save.
  await archiveCurrentBrief(supabase, { email, userId });

  // 2. Insert the full body into vault_content as a new published article.
  const slug = await generateUniqueSlug(draft.title, "-intelligence-brief", supabase);
  const { data: published, error: publishInsertError } = await supabase
    .from("vault_content")
    .insert({
      title: draft.title,
      slug,
      body: draft.body,
      excerpt: draft.excerpt,
      category: "Leadership",
      content_type: "briefing",
      tier_required: "free",
      author_name: "Keith L. Odom",
      visibility: "published",
      published: true,
      published_at: now,
    })
    .select("id, slug")
    .single();

  if (publishInsertError) {
    console.error(
      "[PATCH /api/admin/content-automation/brief-updates/[id]] vault_content insert failed, reverting claim",
      publishInsertError
    );
    await supabase
      .from("vault_pending_brief_updates")
      .update({ status: "pending", reviewed_at: null, reviewed_by: null })
      .eq("id", draft.id);

    return NextResponse.json({ error: publishInsertError.message }, { status: 500 });
  }

  // 3. Update page_configs.brief_config for the home page — date/cta aren't
  //    part of vault_pending_brief_updates (BriefConfig requires both), so
  //    they're set here: date to today (matching the LatestBrief.tsx
  //    DEFAULTS format), cta to the section's standing "Read More" label
  //    (ToolConfig has a per-suggestion cta; a brief doesn't — it's always
  //    Keith's own writing, not a third-party tool with its own CTA
  //    convention). link points at the article just inserted above, not an
  //    external site — the whole point of the Latest Intelligence Brief
  //    card is to send readers to Keith's own analysis in the Vault.
  const briefConfig: BriefConfig = {
    title: draft.title,
    date: new Date(now).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }),
    excerpt: draft.excerpt,
    link: `/vault/${published.slug}`,
    cta: "Read More",
    last_updated: now,
  };

  const { error: configUpdateError } = await supabase
    .from("page_configs")
    .update({ brief_config: briefConfig })
    .eq("page_slug", "home");

  if (configUpdateError) {
    console.error(
      "[PATCH /api/admin/content-automation/brief-updates/[id]] page_configs update failed, reverting claim",
      configUpdateError
    );
    // Best-effort cleanup of the orphaned vault_content row so a retry
    // doesn't leave a duplicate published article behind — non-fatal if
    // this also fails, since the primary failure is already being reported
    // and reverted below regardless.
    await supabase.from("vault_content").delete().eq("id", published.id);
    await supabase
      .from("vault_pending_brief_updates")
      .update({ status: "pending", reviewed_at: null, reviewed_by: null })
      .eq("id", draft.id);

    return NextResponse.json({ error: configUpdateError.message }, { status: 500 });
  }

  // Embed for the RAG knowledge base — non-blocking, same pattern as
  // publishClaimedDraft() in src/lib/content-automation.ts.
  try {
    await upsertVaultEmbedding(published.id, draft.title, draft.body, draft.excerpt);
  } catch (embeddingError) {
    console.error(
      "[PATCH /api/admin/content-automation/brief-updates/[id]] publish succeeded but embedding failed",
      embeddingError
    );
    Sentry.captureException(embeddingError, {
      extra: { source: "intelligence-brief-publish-embedding", vault_content_id: published.id },
    });
  }

  // 4. Draft status/reviewed_at/reviewed_by were already set by the atomic
  //    claim above.
  // 5. Audit log.
  await supabase.from("admin_activity_log").insert({
    admin_user_id: userId,
    admin_email: email,
    action: "PUBLISH",
    entity_type: "vault_pending_brief_update",
    entity_id: draft.id,
    details: `Published Intelligence Brief: ${draft.title}`,
    metadata: { vault_content_id: published.id },
  });

  return NextResponse.json({ data: draft });
}
