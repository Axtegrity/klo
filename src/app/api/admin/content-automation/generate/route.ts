import { NextRequest, NextResponse } from "next/server";
import { verifyCreativeStudioAdmin } from "@/lib/creative-studio-auth";
import { contentAutomationGenerateSchema } from "@/lib/validation";
import { runContentAutomationGenerate } from "@/lib/content-automation";

// POST /api/admin/content-automation/generate — run the content generation
// pipeline on demand (the same core logic also runs weekly via
// src/app/api/cron/content-automation/route.ts, which imports
// runContentAutomationGenerate() directly from src/lib/content-automation.ts
// rather than self-fetching this route).
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

  try {
    const summary = await runContentAutomationGenerate(parsed.data.lane);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("[POST /api/admin/content-automation/generate]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation run failed" },
      { status: 500 }
    );
  }
}
