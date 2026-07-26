import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyCreativeStudioAdmin } from "@/lib/creative-studio-auth";
import { pageConfigUpdateSchema } from "@/lib/validation";
import { generateUniqueSlug } from "@/lib/vault-slug";
import type { BriefConfig } from "@/lib/page-config-server";

// Archives the currently-live Latest Intelligence Brief into vault_content
// before it gets replaced, so a past brief isn't just lost — it becomes a
// browsable Vault article. Never throws: any failure here is logged/reported
// to Sentry and swallowed, since losing the archive copy must never block
// saving the new brief (same non-blocking contract as
// archiveCurrentTool() in src/app/api/admin/content-automation/
// tool-updates/[id]/route.ts).
async function archiveCurrentBrief(
  supabase: SupabaseClient,
  currentBrief: BriefConfig,
  actor: { email: string; userId: string | null }
): Promise<void> {
  try {
    const slug = await generateUniqueSlug(currentBrief.title, "-intelligence-brief", supabase);
    const body = `## Overview\n${currentBrief.excerpt}\n\n## Read the Full Brief\n${currentBrief.link}`;

    const { data: archived, error: archiveError } = await supabase
      .from("vault_content")
      .insert({
        title: currentBrief.title,
        slug,
        body,
        excerpt: currentBrief.excerpt.slice(0, 150),
        category: "Leadership",
        content_type: "briefing",
        tier_required: "free",
        author_name: "Keith L. Odom",
        visibility: "published",
        published: true,
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (archiveError) {
      throw new Error(`Failed to archive previous brief: ${archiveError.message}`);
    }

    await supabase.from("admin_activity_log").insert({
      admin_user_id: actor.userId,
      admin_email: actor.email,
      action: "ARCHIVE",
      entity_type: "vault_content",
      entity_id: archived.id,
      details: `Archived previous Latest Intelligence Brief to Vault: ${currentBrief.title}`,
    });
  } catch (error) {
    console.error("[PATCH /api/admin/creative-studio/pages/[slug]] brief archive failed, continuing update", error);
    Sentry.captureException(error, {
      extra: { source: "intelligence-brief-archive" },
    });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await verifyCreativeStudioAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("page_configs")
    .select("*")
    .eq("page_slug", slug)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await verifyCreativeStudioAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const body = await req.json();
  const parsed = pageConfigUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  // Stamp the server's own current time onto brief_config.last_updated,
  // overwriting whatever (if anything) the client sent — this is what
  // src/app/api/admin/content-automation/brief-status/route.ts reads to
  // compute staleness, so it must reflect an actual save, not a
  // client-supplied value.
  if (parsed.data.brief_config) {
    parsed.data.brief_config.last_updated = new Date().toISOString();
  }

  const supabase = getServiceSupabase();
  const email = session.user?.email ?? "unknown";

  // Read current row so we can deep-merge JSONB columns rather than replacing
  // them wholesale. Without this, saving hero text wipes the background image
  // config (and vice-versa) because two admin panels share the same column.
  const { data: current } = await supabase
    .from("page_configs")
    .select("*")
    .eq("page_slug", slug)
    .maybeSingle();

  // Archive the currently-live Latest Intelligence Brief before it gets
  // replaced below — only when this request is actually touching
  // brief_config, and only when a real brief is currently live. Non-blocking
  // (see archiveCurrentBrief's own try/catch): the new brief still saves
  // even if the archive copy fails.
  if ("brief_config" in parsed.data) {
    const currentBrief = (current as Record<string, unknown> | null)?.brief_config as
      | BriefConfig
      | null
      | undefined;
    if (currentBrief?.title) {
      const userId = (session.user as { id?: string }).id ?? null;
      await archiveCurrentBrief(supabase, currentBrief, { email, userId });
    }
  }

  const mergedData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    const existing = (current as Record<string, unknown> | null)?.[key];
    if (
      value !== null &&
      value !== undefined &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      existing !== null &&
      existing !== undefined &&
      typeof existing === "object" &&
      !Array.isArray(existing)
    ) {
      mergedData[key] = { ...(existing as Record<string, unknown>), ...(value as Record<string, unknown>) };
    } else {
      mergedData[key] = value;
    }
  }

  const { data, error } = await supabase
    .from("page_configs")
    .update({ ...mergedData, updated_by: email })
    .eq("page_slug", slug)
    .select()
    .single();

  if (error) {
    console.error("[PATCH /api/admin/creative-studio/pages/[slug]]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("admin_activity_log").insert({
    admin_user_id: (session.user as { id?: string }).id ?? null,
    admin_email: email,
    action: "UPDATE",
    entity_type: "page_config",
    entity_id: data.id,
    details: `Updated page config: ${data.page_label}`,
    metadata: { fields: Object.keys(parsed.data) },
  });

  return NextResponse.json({ data });
}
