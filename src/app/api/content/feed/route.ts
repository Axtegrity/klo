import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { FeedPost } from "@/lib/feed-data";

// GET /api/content/feed — public endpoint returning featured vault articles + feed posts.
// Queries vault_content (where featured_in_feed = true) and merges with feed_posts.
// Vault articles appear first, sorted by publish date descending.
//
// RLS policies allow anon SELECT where visibility = 'published'.

interface VaultRow {
  id: string;
  title: string;
  body: string;
  category: string;
  published_at: string | null;
  created_at: string;
  tier_required: string;
  metadata: Record<string, unknown> | null;
}

interface FeedPostRow {
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

  // Query featured vault articles
  const { data: vaultData, error: vaultError } = await supabase
    .from("vault_content")
    .select("id, title, body, category, published_at, created_at, tier_required, metadata")
    .eq("featured_in_feed", true)
    .eq("visibility", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (vaultError) {
    console.error("[GET /api/content/feed] vault query failed:", vaultError);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // Query feed_posts
  const { data: feedData, error: feedError } = await supabase
    .from("feed_posts")
    .select("id, title, body, post_type, tags, published_at, created_at, metadata")
    .eq("visibility", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (feedError) {
    console.error("[GET /api/content/feed] feed_posts query failed:", feedError);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // Map vault articles to FeedPost
  const vaultItems: FeedPost[] = ((vaultData ?? []) as VaultRow[]).map((row) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    const wordCount = row.body ? row.body.trim().split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.round(wordCount / 200));
    return {
      id: `vault-${row.id}`,
      title: row.title,
      category: row.category,
      content: row.body,
      publishedAt: (row.published_at ?? row.created_at).slice(0, 10),
      readTime:
        (meta.duration as string) ??
        (wordCount > 0 ? `${minutes} min read` : "Quick read"),
      isPremium: row.tier_required !== "free",
    };
  });

  // Map feed_posts to FeedPost
  const feedItems: FeedPost[] = ((feedData ?? []) as FeedPostRow[]).map((row) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    const wordCount = row.body ? row.body.trim().split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.round(wordCount / 200));
    return {
      id: `feed-${row.id}`,
      title: row.title ?? "Untitled",
      category: (meta.category as string) ?? row.tags?.[0] ?? "Uncategorized",
      content: row.body,
      publishedAt: (row.published_at ?? row.created_at).slice(0, 10),
      readTime:
        (meta.read_time as string) ??
        (wordCount > 0 ? `${minutes} min read` : "Quick read"),
      isPremium: (meta.is_premium as boolean) ?? false,
    };
  });

  return NextResponse.json({ data: [...vaultItems, ...feedItems] });
}
