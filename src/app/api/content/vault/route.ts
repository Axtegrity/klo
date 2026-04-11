import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { vaultItems as staticVaultItems } from "@/lib/vault-data";
import type { VaultCategory, VaultType, VaultItem } from "@/lib/vault-data";

// GET /api/content/vault — public endpoint returning all vault items.
// Merges admin-managed Supabase items (vault_content) with the curated
// static seed in src/lib/vault-data.ts. DB rows override the static seed
// when slugs collide, so editors can replace seed entries via the admin UI.
//
// Uses anon Supabase client; RLS policy "vault_content_public_read_published"
// allows SELECT where visibility = 'published'.

const VALID_CATEGORIES: VaultCategory[] = [
  "AI & Ethics",
  "Church & Tech",
  "Governance",
  "Leadership",
  "Youth & Workforce",
  "Previous Events",
  "Current Events",
];

const VALID_TYPES: VaultType[] = [
  "video",
  "briefing",
  "template",
  "policy",
  "framework",
  "replay",
  "event",
];

const dbGradients = [
  "from-amber-600 to-orange-800",
  "from-blue-600 to-indigo-900",
  "from-emerald-600 to-teal-900",
  "from-purple-600 to-violet-900",
  "from-rose-600 to-pink-900",
  "from-cyan-600 to-blue-900",
];

function normalizeCategory(c: string): VaultCategory {
  return (VALID_CATEGORIES as string[]).includes(c)
    ? (c as VaultCategory)
    : "Leadership";
}

function normalizeType(t: string): VaultType {
  if ((VALID_TYPES as string[]).includes(t)) return t as VaultType;
  if (t === "article" || t === "guide") return "briefing";
  return "briefing";
}

interface DbRow {
  id: string;
  title: string;
  slug: string;
  content_type: string;
  category: string;
  body: string | null;
  excerpt: string | null;
  thumbnail_url: string | null;
  tier_required: string;
  author_name: string | null;
  published_at: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export async function GET() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("vault_content")
    .select(
      "id, title, slug, content_type, category, body, excerpt, thumbnail_url, tier_required, author_name, published_at, created_at, metadata",
    )
    .eq("visibility", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/content/vault]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const dbItems: VaultItem[] = ((data ?? []) as DbRow[]).map((row, i) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    const body = row.body ?? "";
    const wordCount = body ? body.trim().split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.round(wordCount / 200));
    return {
      id: `db-${row.id}`,
      title: row.title,
      slug: row.slug,
      category: normalizeCategory(row.category),
      level: ((meta.level as string) ?? "Executive") as VaultItem["level"],
      type: normalizeType(row.content_type),
      isPremium: row.tier_required !== "free",
      thumbnailGradient:
        (meta.thumbnail_gradient as string) ?? dbGradients[i % dbGradients.length],
      description: row.excerpt ?? body.slice(0, 240),
      duration:
        (meta.duration as string) ??
        (wordCount > 0 ? `${minutes} min read` : "Quick read"),
      publishedAt: row.published_at ?? row.created_at,
      author: row.author_name ?? "Keith L. Odom",
    };
  });

  // DB items take precedence — drop static seed entries with the same slug
  const dbSlugs = new Set(dbItems.map((i) => i.slug));
  const staticFiltered = staticVaultItems.filter((i) => !dbSlugs.has(i.slug));

  return NextResponse.json({ data: [...dbItems, ...staticFiltered] });
}
