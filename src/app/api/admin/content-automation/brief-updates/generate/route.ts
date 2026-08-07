import { NextRequest, NextResponse } from "next/server";
import { verifyCreativeStudioAdmin } from "@/lib/creative-studio-auth";
import { generateIntelligenceBrief } from "@/lib/content-automation";
import { getServiceSupabase } from "@/lib/supabase";

// 300s (5 min) — matches src/app/api/admin/content-automation/generate/route.ts
// and tool-updates/generate/route.ts. generateIntelligenceBrief() makes a
// research web-search call plus a separate generation call, both of which
// individually run well past the platform's 10s default.
export const maxDuration = 300;

// POST /api/admin/content-automation/brief-updates/generate — run the
// Intelligence Brief generator on demand (the same core logic also runs
// weekly via src/app/api/cron/content-automation/route.ts, which imports
// generateIntelligenceBrief() directly from src/lib/content-automation.ts
// rather than self-fetching this route). Optional `guidance` (free-text
// focus) lets an admin steer a single on-demand run.
export async function POST(req: NextRequest) {
  const session = await verifyCreativeStudioAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const guidance =
    typeof (body as { guidance?: unknown })?.guidance === "string"
      ? (body as { guidance: string }).guidance.trim() || undefined
      : undefined;

  try {
    const result = await generateIntelligenceBrief(guidance);

    // Audit trail entry — same reasoning and shape as tool-updates/generate/
    // route.ts's admin_activity_log insert: this route triggers a
    // cost-incurring external LLM call, so who ran it, when, and what it
    // produced matters for incident response.
    const supabase = getServiceSupabase();
    await supabase.from("admin_activity_log").insert({
      admin_user_id: (session.user as { id?: string }).id ?? null,
      admin_email: session.user?.email ?? "unknown",
      action: "GENERATE",
      entity_type: "vault_pending_brief_update",
      entity_id: result.draft_id ?? null,
      details: result.generated
        ? `Ran Intelligence Brief generation — created brief ${result.draft_id}`
        : `Ran Intelligence Brief generation — no brief produced${result.warning ? `: ${result.warning}` : ""}`,
      metadata: { generated: result.generated },
    });

    return NextResponse.json({
      generated: result.generated,
      draft_id: result.draft_id,
      warning: result.generated
        ? undefined
        : result.warning ?? "No brief was generated — see logs for details.",
    });
  } catch (error) {
    console.error("[POST /api/admin/content-automation/brief-updates/generate]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation run failed" },
      { status: 500 }
    );
  }
}
