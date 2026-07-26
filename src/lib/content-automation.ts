import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/lib/supabase";
import {
  searchLaneTopics,
  generateVaultArticle,
  findAIToolSuggestion,
  type VaultStyleReference,
} from "@/lib/claude";
import type { VaultDraft, VaultTopicLane } from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/*  Content Automation Pipeline — shared generation logic              */
/*                                                                      */
/*  Lives outside src/app/api/ (rather than being exported from the    */
/*  POST route handler) because Next.js App Router route.ts files are  */
/*  documented to only export HTTP-method handlers plus a small config */
/*  allowlist (dynamic, revalidate, runtime, etc.) — adding an extra    */
/*  named export there is an unproven pattern in this repo and isn't   */
/*  worth the framework risk. Both                                      */
/*  src/app/api/admin/content-automation/generate/route.ts (POST) and   */
/*  src/app/api/cron/content-automation/route.ts (GET, weekly cron)     */
/*  import runContentAutomationGenerate() from here directly — no       */
/*  self-fetch between them.                                            */
/* ------------------------------------------------------------------ */

export type LaneRunStatus = "generated" | "failed" | "insufficient_sources";

export interface LaneRunResult {
  lane: string;
  status: LaneRunStatus;
  draftId?: string;
  error?: string;
  // Present on "insufficient_sources" results — the count of reputable
  // sources actually found, for the caller's warning message and any
  // future UI display.
  sourcesFound?: number;
}

export interface GenerateRunSummary {
  generated: number;
  drafts: string[];
  laneResults: LaneRunResult[];
}

// Reputable-source quality gate: a lane must have at least this many
// distinct reputable domains from searchLaneTopics() before generation is
// even attempted — checked BEFORE the style-reference fetch and BEFORE
// generateVaultArticle() runs, so a thin-source lane doesn't spend a
// generation call it can't responsibly use. generateVaultArticle() itself
// never needs to produce an "insufficient_sources" shape because of this.
const MIN_REPUTABLE_SOURCES = 3;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 480);
}

export async function runContentAutomationGenerate(
  laneFilter?: string,
  // Both undefined on the weekly cron path (src/app/api/cron/content-automation/
  // route.ts calls this with no arguments) — behavior there is unchanged.
  // The manual on-demand admin endpoint resolves referenceText from a
  // storage path via src/lib/document-extraction.ts before calling this.
  guidance?: string,
  referenceText?: string
): Promise<GenerateRunSummary> {
  const supabase = getServiceSupabase();

  let laneQuery = supabase
    .from("vault_topic_lanes")
    .select("*")
    .eq("active", true);
  if (laneFilter) {
    laneQuery = laneQuery.eq("name", laneFilter);
  }

  const { data: lanes, error: lanesError } = await laneQuery;
  if (lanesError) {
    console.error("[content-automation:generate] failed to load lanes", lanesError);
    throw new Error(`Failed to load topic lanes: ${lanesError.message}`);
  }

  const activeLanes = (lanes ?? []) as VaultTopicLane[];
  const draftIds: string[] = [];
  const laneResults: LaneRunResult[] = [];

  for (const lane of activeLanes) {
    try {
      // 1. Research 2-3 current, vetted topics for this lane via web search.
      const research = await searchLaneTopics(lane.name, lane.description);

      // 1a. Reputable-source quality gate — runs for every lane regardless
      //     of whether guidance/a reference file was supplied, on both the
      //     manual and weekly-cron paths. Skips the style-reference fetch
      //     and generation call entirely when the gate fails, so a
      //     thin-source lane doesn't spend a generation call it can't
      //     responsibly use.
      const reputableSources = research.sources.filter((source) => source.reputable);
      if (reputableSources.length < MIN_REPUTABLE_SOURCES) {
        console.warn(
          `[content-automation:generate] lane "${lane.name}" has only ${reputableSources.length} reputable source(s) (need ${MIN_REPUTABLE_SOURCES}) — skipping generation`
        );
        Sentry.captureMessage(
          `Content automation: insufficient reputable sources for lane "${lane.name}"`,
          {
            level: "warning",
            extra: {
              lane: lane.name,
              sourcesFound: reputableSources.length,
              source: "content-automation-generate",
            },
          }
        );
        laneResults.push({
          lane: lane.name,
          status: "insufficient_sources",
          sourcesFound: reputableSources.length,
        });
        continue;
      }

      // 2. Style references — 3 existing published vault_content rows in
      //    the same category, used so the generated article matches
      //    Keith's established tone/cadence rather than a generic voice.
      const { data: styleRows, error: styleError } = await supabase
        .from("vault_content")
        .select("title, body")
        .eq("category", lane.name)
        .eq("visibility", "published")
        .order("created_at", { ascending: false })
        .limit(3);

      if (styleError) {
        throw new Error(`Failed to load style references: ${styleError.message}`);
      }

      const styleReferences: VaultStyleReference[] = (styleRows ?? []).map(
        (row) => ({ title: String(row.title), body: String(row.body) })
      );

      // 3. Generate the article in Keith's voice from the research + style
      //    refs, constrained to the reputable-source closed list, with
      //    guidance/reference-file context injected when present (both
      //    undefined on the weekly cron path — no behavior change there).
      const article = await generateVaultArticle(research, styleReferences, lane.name, reputableSources, {
        guidance,
        referenceText,
      });

      // Slug collision guard against both vault_drafts and vault_content —
      // the DB unique constraint is the backstop, but retrying here avoids
      // a needless failed lane on a title collision.
      const baseSlug = slugify(article.slug || article.title) || `draft-${Date.now()}`;
      let slug = baseSlug;
      for (let attempt = 0; attempt < 5; attempt++) {
        const [{ data: draftHit }, { data: contentHit }] = await Promise.all([
          supabase.from("vault_drafts").select("id").eq("slug", slug).maybeSingle(),
          supabase.from("vault_content").select("id").eq("slug", slug).maybeSingle(),
        ]);
        if (!draftHit && !contentHit) break;
        slug = `${baseSlug}-${Date.now().toString(36)}${attempt > 0 ? `-${attempt}` : ""}`;
      }

      // 4. Insert into vault_drafts — always pending, never auto-published.
      const { data: inserted, error: insertError } = await supabase
        .from("vault_drafts")
        .insert({
          title: article.title,
          slug,
          body: article.body,
          excerpt: article.excerpt,
          category: lane.name,
          content_type: "article",
          tier_required: "free",
          topic_source: research.primaryTopic,
          status: "pending",
        })
        .select("id")
        .single();

      if (insertError) {
        throw new Error(`Failed to insert draft: ${insertError.message}`);
      }

      draftIds.push(inserted.id);
      laneResults.push({ lane: lane.name, status: "generated", draftId: inserted.id });
    } catch (error) {
      // Partial-failure tolerance: one lane's Anthropic/DB error is logged
      // and the run continues to the next lane rather than aborting. Also
      // reported to Sentry (matching the Sentry.captureException pattern
      // used in src/app/global-error.tsx) because this function is called
      // from the unattended weekly cron route as well as the manual
      // on-demand admin endpoint — console.error alone is invisible on the
      // cron path, since nothing forwards console output to Sentry here
      // (no captureConsoleIntegration configured) and Vercel function logs
      // aren't a monitored channel per this repo's conventions.
      console.error(`[content-automation:generate] lane "${lane.name}" failed`, error);
      Sentry.captureException(error, {
        extra: { lane: lane.name, source: "content-automation-generate" },
      });
      laneResults.push({
        lane: lane.name,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { generated: draftIds.length, drafts: draftIds, laneResults };
}

/* ------------------------------------------------------------------ */
/*  AI Tool of the Week — weekly suggestion generation                 */
/*                                                                      */
/*  Called from both the weekly cron (src/app/api/cron/content-        */
/*  automation/route.ts, after runContentAutomationGenerate()) and can  */
/*  be invoked on-demand the same way vault-article generation is.      */
/*  Never throws — any failure is logged/reported to Sentry and         */
/*  returns { generated: false } so a bad web-search or DB error here   */
/*  never blocks the weekly vault-article batch.                       */
/* ------------------------------------------------------------------ */

export interface GenerateToolSuggestionResult {
  generated: boolean;
  draft_id?: string;
}

export async function generateAIToolSuggestion(): Promise<GenerateToolSuggestionResult> {
  const supabase = getServiceSupabase();

  try {
    // Read the currently-live tool so the suggestion doesn't just repeat it.
    const { data: pageConfig, error: pageConfigError } = await supabase
      .from("page_configs")
      .select("tool_config")
      .eq("page_slug", "home")
      .maybeSingle();

    if (pageConfigError) {
      throw new Error(`Failed to load current tool_config: ${pageConfigError.message}`);
    }

    const currentToolName =
      (pageConfig?.tool_config as { name?: string } | null)?.name ?? null;

    const suggestion = await findAIToolSuggestion(currentToolName);

    const { data: inserted, error: insertError } = await supabase
      .from("vault_pending_tool_updates")
      .insert({
        tool_name: suggestion.tool_name,
        category: suggestion.category,
        description: suggestion.description,
        why_it_matters: suggestion.why_it_matters,
        link: suggestion.link,
        cta: suggestion.cta || "Learn More",
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(`Failed to insert tool suggestion: ${insertError.message}`);
    }

    return { generated: true, draft_id: inserted.id };
  } catch (error) {
    console.error("[content-automation:tool-suggestion] failed", error);
    Sentry.captureException(error, {
      extra: { source: "content-automation-tool-suggestion" },
    });
    return { generated: false };
  }
}

/* ------------------------------------------------------------------ */
/*  Publish — shared between the manual PATCH review endpoint          */
/*  (src/app/api/admin/content-automation/drafts/[id]/route.ts,        */
/*  "publish" action) and the hourly scheduled-publish cron             */
/*  (src/app/api/cron/publish-scheduled-drafts/route.ts). Both callers  */
/*  are expected to have already atomically claimed the draft (an       */
/*  UPDATE ... WHERE status = <expected> ... SET status = 'published'   */
/*  that only succeeds if nothing else got there first) before calling  */
/*  this — this function only does the vault_content insert + activity  */
/*  log + revert-on-failure, it does not re-check the draft's status.   */
/* ------------------------------------------------------------------ */

export interface PublishClaimedDraftResult {
  success: boolean;
  // Full inserted vault_content row — callers that don't need it (the cron)
  // can ignore it; the manual PATCH route returns it verbatim in its
  // response body, matching the pre-refactor response shape exactly.
  published?: Record<string, unknown>;
  error?: string;
}

export async function publishClaimedDraft(
  supabase: SupabaseClient,
  draft: VaultDraft,
  actor: { email: string; userId: string | null },
  // What to revert the draft's row back to if the vault_content insert
  // fails, so it isn't left stuck "published" with no corresponding
  // vault_content row. The manual publish path (claimed from "pending")
  // reverts to pending; the scheduled-publish cron (claimed from
  // "scheduled") reverts to scheduled with its original timestamp intact,
  // so it's simply retried on the next hourly run instead of losing the
  // schedule.
  revertOnFailureTo: { status: VaultDraft["status"]; scheduled_publish_at: string | null }
): Promise<PublishClaimedDraftResult> {
  const now = new Date().toISOString();

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
    console.error("[content-automation:publish] insert into vault_content failed, reverting claim", publishError);
    await supabase
      .from("vault_drafts")
      .update({
        status: revertOnFailureTo.status,
        reviewed_at: null,
        reviewed_by: null,
        scheduled_publish_at: revertOnFailureTo.scheduled_publish_at,
      })
      .eq("id", draft.id);

    return { success: false, error: publishError.message };
  }

  await supabase.from("admin_activity_log").insert({
    admin_user_id: actor.userId,
    admin_email: actor.email,
    action: "PUBLISH",
    entity_type: "vault_draft",
    entity_id: draft.id,
    details: `Published content automation draft as vault_content: ${draft.title}`,
    metadata: { vault_content_id: published.id },
  });

  return { success: true, published };
}
