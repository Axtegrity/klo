import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { feedPosts as staticFeedPosts } from "@/lib/feed-data";
import type { FeedCategory, FeedPost } from "@/lib/feed-data";

// GET /api/content/feed — public endpoint returning all feed posts.
// Merges admin-managed Supabase posts (feed_posts) with the curated
// static seed in src/lib/feed-data.ts. DB rows take precedence when ids match.
//
// RLS policy "feed_posts_public_read_published" allows anon SELECT
// where visibility = 'published'.

const VALID_CATEGORIES: FeedCategory[] = [
  "AI Breakthroughs",
  "Regulatory Shifts",
  "Tech Ethics",
  "Church Implications",
  "Leadership",
];

function normalizeCategory(c: string | undefined): FeedCategory {
  if (c && (VALID_CATEGORIES as string[]).includes(c)) {
    return c as FeedCategory;
  }
  return "Leadership";
}

interface DbRow {
  id: string;
  title: string | null;
  body: string;
  post_type: string;
  tags: string[] | null;
  published_at: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export async function GET() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("feed_posts")
    .select(
      "id, title, body, post_type, tags, published_at, created_at, metadata",
    )
    .eq("visibility", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/content/feed]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const dbItems: FeedPost[] = ((data ?? []) as DbRow[]).map((row) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    const wordCount = row.body ? row.body.trim().split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.round(wordCount / 200));
    return {
      id: `db-${row.id}`,
      title: row.title ?? "Untitled",
      category: normalizeCategory(
        (meta.category as string) ?? row.tags?.[0],
      ),
      content: row.body,
      publishedAt: (row.published_at ?? row.created_at).slice(0, 10),
      readTime:
        (meta.read_time as string) ??
        (wordCount > 0 ? `${minutes} min read` : "Quick read"),
      isPremium: (meta.is_premium as boolean) ?? false,
    };
  });

  // DB items take precedence — drop static seed entries with the same id
  const dbIds = new Set(dbItems.map((p) => p.id));
  const staticFiltered = staticFeedPosts.filter((p) => !dbIds.has(p.id));

  return NextResponse.json({ data: [...dbItems, ...staticFiltered] });
}
