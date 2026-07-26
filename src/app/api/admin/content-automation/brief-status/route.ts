import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyCreativeStudioAdmin } from "@/lib/creative-studio-auth";
import type { BriefConfig } from "@/lib/page-config-server";

const STALE_THRESHOLD_DAYS = 30;

// GET /api/admin/content-automation/brief-status — reports how long it's
// been since the Latest Intelligence Brief (page_configs.brief_config for
// page_slug='home') was last saved, for the Admin Dashboard Overview tab's
// staleness banner. `last_updated` is stamped server-side on every save by
// src/app/api/admin/creative-studio/pages/[slug]/route.ts — a brief saved
// before that field existed (or with no brief_config at all) has no way to
// know its true age, so it's reported as unknown (null/not stale) rather
// than guessed.
export async function GET() {
  const session = await verifyCreativeStudioAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("page_configs")
    .select("brief_config")
    .eq("page_slug", "home")
    .maybeSingle();

  if (error) {
    console.error("[GET /api/admin/content-automation/brief-status]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const briefConfig = data?.brief_config as BriefConfig | null;
  if (!briefConfig?.last_updated) {
    return NextResponse.json({ days_since_update: null, is_stale: false, last_updated: null });
  }

  const lastUpdated = new Date(briefConfig.last_updated);
  const daysSinceUpdate = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));

  return NextResponse.json({
    days_since_update: daysSinceUpdate,
    is_stale: daysSinceUpdate > STALE_THRESHOLD_DAYS,
    last_updated: briefConfig.last_updated,
  });
}
