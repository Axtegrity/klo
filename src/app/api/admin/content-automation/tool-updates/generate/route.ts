import { NextResponse } from "next/server";
import { verifyCreativeStudioAdmin } from "@/lib/creative-studio-auth";
import { generateAIToolSuggestion } from "@/lib/content-automation";
import { getServiceSupabase } from "@/lib/supabase";

// 300s (5 min) — matches src/app/api/admin/content-automation/generate/route.ts.
// generateAIToolSuggestion() makes a single web-search-driven model call, but
// that call alone has been measured running well past the platform's 10s
// default, so the sibling route's headroom applies here too.
export const maxDuration = 300;

// POST /api/admin/content-automation/tool-updates/generate — run the AI Tool
// of the Week suggestion generator on demand (the same core logic also runs
// weekly via src/app/api/cron/content-automation/route.ts, which imports
// generateAIToolSuggestion() directly from src/lib/content-automation.ts
// rather than self-fetching this route). No request body — unlike the vault
// draft generate route, there's no guidance/reference-file input to steer
// this run.
export async function POST() {
  const session = await verifyCreativeStudioAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await generateAIToolSuggestion();

    // Audit trail entry — same reasoning and shape as the sibling
    // generate/route.ts's admin_activity_log insert (Avery review, PR #226,
    // should-fix #2): this route triggers a cost-incurring external LLM call,
    // so who ran it, when, and what it produced matters for incident
    // response. entity_id is the new suggestion's id when one was created,
    // null when the run produced nothing.
    const supabase = getServiceSupabase();
    await supabase.from("admin_activity_log").insert({
      admin_user_id: (session.user as { id?: string }).id ?? null,
      admin_email: session.user?.email ?? "unknown",
      action: "GENERATE",
      entity_type: "vault_pending_tool_update",
      entity_id: result.draft_id ?? null,
      details: result.generated
        ? `Ran AI Tool of the Week suggestion generation — created suggestion ${result.draft_id}`
        : "Ran AI Tool of the Week suggestion generation — no suggestion produced",
      metadata: { generated: result.generated },
    });

    return NextResponse.json({
      generated: result.generated,
      draft_id: result.draft_id,
      warning: result.generated ? undefined : "No suggestion was generated — see logs for details.",
    });
  } catch (error) {
    console.error("[POST /api/admin/content-automation/tool-updates/generate]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation run failed" },
      { status: 500 }
    );
  }
}
