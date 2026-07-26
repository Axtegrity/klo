import type { SupabaseClient } from "@supabase/supabase-js";

// Shared slug generation for content archived into vault_content — used by
// both the Tool of the Week publish path (src/app/api/admin/content-
// automation/tool-updates/[id]/route.ts) and the Latest Intelligence Brief
// archive path (src/app/api/admin/creative-studio/pages/[slug]/route.ts).
// Deliberately separate from slugify()/the collision-retry loop in
// src/lib/content-automation.ts, which checks both vault_drafts AND
// vault_content (drafts awaiting review must not collide with anything) —
// archived content here only ever lands directly in vault_content, so this
// only needs to check that one table.
function slugifyBase(base: string): string {
  return base
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Builds a slug from `base` + `suffix` (e.g. "notebooklm-by-google" +
 * "-tool-review"), and if that slug already exists in vault_content, appends
 * the last 6 digits of the current timestamp to disambiguate.
 */
export async function generateUniqueSlug(
  base: string,
  suffix: string,
  supabase: SupabaseClient
): Promise<string> {
  const candidate = `${slugifyBase(base)}${suffix}`;

  const { data: existing } = await supabase
    .from("vault_content")
    .select("id")
    .eq("slug", candidate)
    .maybeSingle();

  if (!existing) return candidate;

  const shortTimestamp = String(Date.now()).slice(-6);
  return `${candidate}-${shortTimestamp}`;
}
