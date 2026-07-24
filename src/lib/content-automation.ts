import { getServiceSupabase } from "@/lib/supabase";
import {
  searchLaneTopics,
  generateVaultArticle,
  type VaultStyleReference,
} from "@/lib/claude";
import type { VaultTopicLane } from "@/lib/supabase";

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

export interface LaneRunResult {
  lane: string;
  status: "generated" | "failed";
  draftId?: string;
  error?: string;
}

export interface GenerateRunSummary {
  generated: number;
  drafts: string[];
  laneResults: LaneRunResult[];
}

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
  laneFilter?: string
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

      // 3. Generate the article in Keith's voice from the research + style refs.
      const article = await generateVaultArticle(research, styleReferences, lane.name);

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
      // and the run continues to the next lane rather than aborting.
      console.error(`[content-automation:generate] lane "${lane.name}" failed`, error);
      laneResults.push({
        lane: lane.name,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { generated: draftIds.length, drafts: draftIds, laneResults };
}
