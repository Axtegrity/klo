import { NextRequest, NextResponse } from "next/server";
import { runContentAutomationGenerate } from "@/lib/content-automation";

export const dynamic = "force-dynamic";

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
    return NextResponse.json({ success: true, generated: summary.generated });
  } catch (error) {
    console.error("[GET /api/cron/content-automation]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Generation run failed" },
      { status: 500 }
    );
  }
}
