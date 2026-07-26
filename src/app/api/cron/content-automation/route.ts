import { NextRequest, NextResponse } from "next/server";
import { runContentAutomationGenerate, generateAIToolSuggestion } from "@/lib/content-automation";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Weekly content automation run. Same CRON_SECRET bearer-auth pattern as
// the other cron routes (sync-events, auto-end-sessions) — see
// src/app/api/cron/sync-events/route.ts for the reference implementation.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runContentAutomationGenerate();
    // Surface per-lane results on the cron response too — not just the
    // manual /generate endpoint. Sentry.captureException (in
    // runContentAutomationGenerate's catch block) is the primary visibility
    // mechanism for this unattended weekly path, but including the failure
    // list here is cheap and useful for anyone checking Vercel's cron logs.
    const failed = summary.laneResults
      .filter((r) => r.status === "failed")
      .map((r) => r.lane);

    // AI Tool of the Week suggestion — runs after the vault-article batch,
    // wrapped separately so a failure here (web search, DB) never fails the
    // cron response or masks the vault-article results above.
    // generateAIToolSuggestion() itself already catches internally and
    // returns { generated: false } rather than throwing; this try/catch is
    // belt-and-suspenders against an unexpected throw.
    let toolSuggestion: { generated: boolean; draft_id?: string } = { generated: false };
    try {
      toolSuggestion = await generateAIToolSuggestion();
      console.log("[cron/content-automation] tool suggestion result", toolSuggestion);
    } catch (toolError) {
      console.error("[cron/content-automation] tool suggestion run failed", toolError);
    }

    return NextResponse.json({
      success: true,
      generated: summary.generated,
      laneResults: summary.laneResults,
      failed,
      toolSuggestion,
    });
  } catch (error) {
    console.error("[GET /api/cron/content-automation]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Generation run failed" },
      { status: 500 }
    );
  }
}
