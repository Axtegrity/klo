import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyCreativeStudioAdmin } from "@/lib/creative-studio-auth";
import { upsertVaultEmbeddingWithStatus } from "@/lib/vault-embeddings";

// 5 min (Vercel Pro max) — a full backfill embeds every published article
// that doesn't already have a current embedding, one OpenAI call each; the
// same duration reasoning as the content-automation generate routes (see
// src/app/api/cron/content-automation/route.ts).
export const maxDuration = 300;

// GET — lightweight status check so the admin UI only shows the "Backfill
// Embeddings" button when it's actually needed (embedded_count <
// published_count), rather than always rendering a button that's a no-op.
// Not in the original spec's endpoint list, but required to satisfy Part
// 5's UI-visibility requirement without duplicating this count logic
// client-side or guessing at it.
export async function GET() {
  const session = await verifyCreativeStudioAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceSupabase();
  const [publishedResult, embeddedResult] = await Promise.all([
    supabase.from("vault_content").select("id", { count: "exact", head: true }).eq("visibility", "published"),
    supabase.from("vault_embeddings").select("id", { count: "exact", head: true }),
  ]);

  if (publishedResult.error || embeddedResult.error) {
    const error = publishedResult.error ?? embeddedResult.error;
    console.error("[GET /api/admin/content-automation/embeddings/backfill]", error);
    return NextResponse.json({ error: error!.message }, { status: 500 });
  }

  const publishedCount = publishedResult.count ?? 0;
  const embeddedCount = embeddedResult.count ?? 0;

  return NextResponse.json({
    published_count: publishedCount,
    embedded_count: embeddedCount,
    needs_backfill: embeddedCount < publishedCount,
  });
}

// POST — embeds every published vault_content row that doesn't already have
// a current embedding (upsertVaultEmbeddingWithStatus's own content_hash
// check skips anything unchanged). One row failing doesn't stop the run —
// errors are counted and logged, not thrown, so a single bad row can't
// abort backfilling the rest.
export async function POST() {
  const session = await verifyCreativeStudioAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceSupabase();
  const { data: articles, error } = await supabase
    .from("vault_content")
    .select("id, title, body, excerpt")
    .eq("visibility", "published");

  if (error) {
    console.error("[POST /api/admin/content-automation/embeddings/backfill]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const article of articles ?? []) {
    try {
      const status = await upsertVaultEmbeddingWithStatus(
        article.id,
        article.title,
        article.body,
        article.excerpt ?? ""
      );
      if (status === "processed") processed++;
      else skipped++;
    } catch (embedError) {
      errors++;
      console.error(
        `[POST /api/admin/content-automation/embeddings/backfill] failed for vault_content ${article.id}`,
        embedError
      );
      Sentry.captureException(embedError, {
        extra: { source: "embeddings-backfill", vault_content_id: article.id },
      });
    }
  }

  return NextResponse.json({ processed, skipped, errors });
}
