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
import { vaultPendingToolSchema } from "@/lib/validation";
import { upsertVaultEmbedding, searchSimilarVaultContent, buildRagContextBlock } from "@/lib/vault-embeddings";

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

      // 2a. RAG lookup — surface Keith's existing published thinking related
      // to this lane/guidance so the new article builds on it rather than
      // repeating it. searchSimilarVaultContent() already degrades to []
      // on any failure (embeddings provider down, RPC error, etc.), and
      // buildRagContextBlock() returns "" for an empty result — so a failed
      // or empty lookup simply omits the RAG section from the prompt
      // entirely rather than affecting generation any other way.
      const similarContent = await searchSimilarVaultContent(
        `${lane.name} ${guidance || ""}`.trim(),
        3
      );
      const ragContext = buildRagContextBlock(similarContent);

      // 3. Generate the article in Keith's voice from the research + style
      //    refs, constrained to the reputable-source closed list, with
      //    guidance/reference-file context injected when present (both
      //    undefined on the weekly cron path — no behavior change there).
      const article = await generateVaultArticle(research, styleReferences, lane.name, reputableSources, {
        guidance,
        referenceText,
        ragContext,
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

// Must match vaultPendingToolSchema's own max lengths exactly
// (src/lib/validation.ts) — these are pre-validation cleanup, not a
// replacement for that schema, which stays the hard backstop. Keeping the
// numbers here rather than deriving them from the schema is a deliberate
// tradeoff: simple and explicit, at the cost of needing to update both
// places if either changes (exactly the kind of drift that caused a good
// suggestion to be discarded over a `why_it_matters` overshoot in the first
// place — see the PATCH history for context).
const TOOL_NAME_MAX = 100;
const CATEGORY_MAX = 60;
const TEXT_FIELD_MAX = 500;

// Truncates at the last complete word before `max` (so the model's own
// sentence isn't cut mid-word), appending "..." — total length is always
// <= max. A word-free string longer than max (no spaces) falls back to a
// hard slice.
function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;

  const sliceLength = Math.max(0, max - 3);
  const sliced = text.slice(0, sliceLength);
  const lastSpace = sliced.lastIndexOf(" ");
  const base = lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced;

  return `${base}...`;
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

    // RAG lookup — there's no "lane" concept for tool suggestions (unlike
    // vault-article generation), so this uses a fixed topic query rather
    // than lane.name + guidance. Surfaces any prior Vault content Keith has
    // published about AI tools (including past archived Tool of the Week
    // picks — see archiveCurrentTool() in tool-updates/[id]/route.ts) so the
    // write-up stays consistent with his established voice on the subject.
    const similarContent = await searchSimilarVaultContent(
      "AI tools for faith leaders and executives",
      3
    );
    const ragContext = buildRagContextBlock(similarContent);

    const suggestion = await findAIToolSuggestion(currentToolName, ragContext);

    // Trim text fields to their schema maximums BEFORE validating — a
    // model that runs a little long on `why_it_matters` (or any other text
    // field) shouldn't cost an entire web-search + generation call over a
    // formatting nit. Word-boundary truncation only touches length, never
    // content correctness, so it's safe to apply before the schema runs;
    // link is never touched here — that check stays a hard reject (Avery
    // review, PR #234 follow-up — a javascript:/data: URI must never reach
    // the href this row's link later gets bound to).
    const trimmedSuggestion = {
      tool_name: truncateAtWord(suggestion.tool_name, TOOL_NAME_MAX),
      category: truncateAtWord(suggestion.category, CATEGORY_MAX),
      description: truncateAtWord(suggestion.description, TEXT_FIELD_MAX),
      why_it_matters: truncateAtWord(suggestion.why_it_matters, TEXT_FIELD_MAX),
    };

    // Validate before persisting — findAIToolSuggestion()'s output comes
    // from an open web-search-driven model response (extractJsonObject() is
    // a naive JSON.parse with no runtime shape/content checks), so nothing
    // about it is trusted until it passes this schema. This is still the
    // hard backstop even after the truncation above — e.g. the link check
    // below, or any future field this function doesn't pre-clean.
    const parsed = vaultPendingToolSchema.safeParse({
      ...trimmedSuggestion,
      link: suggestion.link,
      cta: suggestion.cta || "Learn More",
      status: "pending",
    });

    if (!parsed.success) {
      throw new Error(
        `AI tool suggestion failed validation: ${parsed.error.message}`
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from("vault_pending_tool_updates")
      .insert(parsed.data)
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

  // Embed for the RAG knowledge base — non-blocking. A failed/misconfigured
  // embeddings provider (see src/lib/vault-embeddings.ts's known-gap note on
  // OPENAI_API_KEY) must never prevent the article itself from publishing.
  try {
    await upsertVaultEmbedding(published.id, draft.title, draft.body, draft.excerpt ?? "");
  } catch (error) {
    console.error("[content-automation:publish] embedding failed, publish still succeeded", error);
    Sentry.captureException(error, {
      extra: { source: "content-automation-publish-embedding", vault_content_id: published.id },
    });
  }

  return { success: true, published };
}
