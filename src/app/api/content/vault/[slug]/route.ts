import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { VaultCategory, VaultType, VaultItem } from "@/lib/vault-data";

// GET /api/content/vault/[slug] — public single vault item by slug.
// Used by the public vault detail page to resolve admin-managed items
// stored in vault_content (not in the static seed).
//
// Returns { item: VaultItem, body: string } so the detail page can render
// the long-form body when no rich entry exists in src/lib/vault-content.ts.

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("vault_content")
    .select(
      "id, title, slug, content_type, category, body, excerpt, thumbnail_url, tier_required, author_name, published_at, created_at, metadata",
    )
    .eq("visibility", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[GET /api/content/vault/[slug]]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const meta = (data.metadata ?? {}) as Record<string, unknown>;
  const body: string = data.body ?? "";
  const wordCount = body ? body.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.round(wordCount / 200));

  const item: VaultItem = {
    id: `db-${data.id}`,
    title: data.title,
    slug: data.slug,
    category: normalizeCategory(data.category),
    level: ((meta.level as string) ?? "Executive") as VaultItem["level"],
    type: normalizeType(data.content_type),
    isPremium: data.tier_required !== "free",
    thumbnailGradient:
      (meta.thumbnail_gradient as string) ?? "from-blue-600 to-indigo-900",
    description: data.excerpt ?? body.slice(0, 240),
    duration:
      (meta.duration as string) ??
      (wordCount > 0 ? `${minutes} min read` : "Quick read"),
    publishedAt: data.published_at ?? data.created_at,
    author: data.author_name ?? "Keith L. Odom",
  };

  return NextResponse.json({ data: { item, body } });
}
