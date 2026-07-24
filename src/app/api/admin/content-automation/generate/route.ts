import { NextRequest, NextResponse } from "next/server";
import { verifyCreativeStudioAdmin } from "@/lib/creative-studio-auth";
import { contentAutomationGenerateSchema } from "@/lib/validation";
import { runContentAutomationGenerate } from "@/lib/content-automation";
import { extractReferenceFileText } from "@/lib/document-extraction";
import { getServiceSupabase } from "@/lib/supabase";

// POST /api/admin/content-automation/generate — run the content generation
// pipeline on demand (the same core logic also runs weekly via
// src/app/api/cron/content-automation/route.ts, which imports
// runContentAutomationGenerate() directly from src/lib/content-automation.ts
// rather than self-fetching this route).
//
// Optional `guidance` (free-text focus) and `referenceFilePath` (a storage
// path from content-automation/sign-upload/route.ts) let an admin steer a
// single on-demand run — both are undefined on the weekly cron path, which
// is unaffected by anything in this route.
export async function POST(req: NextRequest) {
  const session = await verifyCreativeStudioAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = contentAutomationGenerateSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { lane, guidance, referenceFilePath } = parsed.data;

  // Resolve the reference file's text up front, before the lane loop even
  // starts — a broken/unreadable reference file should fail fast with a
  // clear 400 rather than silently generating without it or failing every
  // lane individually with the same underlying cause.
  let referenceText: string | undefined;
  if (referenceFilePath) {
    try {
      referenceText = await extractReferenceFileText(referenceFilePath);
    } catch (error) {
      console.error("[POST /api/admin/content-automation/generate]", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to read reference file" },
        { status: 400 }
      );
    }
  }

  try {
    const summary = await runContentAutomationGenerate(lane, guidance, referenceText);
    const warnings = summary.laneResults
      .filter((result) => result.status === "insufficient_sources")
      .map((result) => `Insufficient reputable sources found for ${result.lane}. No draft created.`);

    // Audit trail entry (Avery review, PR #226, should-fix #2). This route
    // triggers a cost-incurring external LLM call and can optionally attach
    // an admin-supplied reference file to that call — an audit trail of
    // who ran it, when, and with what inputs materially helps incident
    // response if a bad reference-file access or a bad generated article is
    // ever traced back. No single vault_drafts row represents "the run"
    // (a run can produce 0-N drafts across lanes), so entity_id is null and
    // the run's inputs/outcome are captured in details/metadata instead —
    // same shape as the other admin_activity_log inserts in this feature
    // area (drafts/[id]/route.ts, lanes/route.ts).
    const supabase = getServiceSupabase();
    await supabase.from("admin_activity_log").insert({
      admin_user_id: (session.user as { id?: string }).id ?? null,
      admin_email: session.user?.email ?? "unknown",
      action: "GENERATE",
      entity_type: "content_automation_run",
      entity_id: null,
      details: `Ran content automation generate (lane: ${lane ?? "all"}, guidance: ${guidance ? "yes" : "no"}, referenceFile: ${referenceFilePath ? "yes" : "no"}) — generated ${summary.generated} draft(s)`,
      metadata: {
        lane: lane ?? null,
        hasGuidance: Boolean(guidance),
        hasReferenceFile: Boolean(referenceFilePath),
        generated: summary.generated,
        laneResults: summary.laneResults,
      },
    });

    return NextResponse.json({ ...summary, warnings });
  } catch (error) {
    console.error("[POST /api/admin/content-automation/generate]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation run failed" },
      { status: 500 }
    );
  }
}
