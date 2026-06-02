#!/usr/bin/env bun
/**
 * Generates the seed migration SQL from hardcoded vault-data.ts.
 * Run: bun run scripts/generate-content-seed.ts
 * Writes to: supabase/migrations/20260410000001_seed_content.sql
 * Note: Feed now pulls from vault articles via featured_in_feed flag.
 */

import { writeFileSync } from "node:fs";
import { vaultItems } from "../src/lib/vault-data";

function esc(value: string | undefined | null): string {
  if (value === undefined || value === null) return "NULL";
  return `'${value.replace(/'/g, "''")}'`;
}

function jsonb(obj: Record<string, unknown>): string {
  const json = JSON.stringify(obj).replace(/'/g, "''");
  return `'${json}'::jsonb`;
}

function arr(values: string[]): string {
  if (!values.length) return "ARRAY[]::text[]";
  const escaped = values.map((v) => `'${v.replace(/'/g, "''")}'`).join(",");
  return `ARRAY[${escaped}]::text[]`;
}

const lines: string[] = [];
lines.push("-- ============================================================");
lines.push("-- Seed content: port hardcoded vault data to Supabase");
lines.push("-- Auto-generated from src/lib/vault-data.ts");
lines.push("-- ============================================================\n");

// --- Vault items ---
lines.push("-- Vault content");
for (const item of vaultItems) {
  const metadata = {
    legacy_id: item.id,
    level: item.level,
    duration: item.duration,
    thumbnail_gradient: item.thumbnailGradient,
    is_premium: item.isPremium,
    conference_name: item.conferenceName ?? null,
    conference_location: item.conferenceLocation ?? null,
    files: item.files ?? [],
  };

  const tierRequired = item.isPremium ? "professional" : "free";
  const excerpt = item.description.slice(0, 500);
  const publishedAt = item.publishedAt
    ? `'${item.publishedAt}T00:00:00Z'::timestamptz`
    : "now()";

  lines.push(
    `INSERT INTO vault_content (title, slug, content_type, category, body, excerpt, tier_required, visibility, author_name, published_at, metadata) VALUES (
  ${esc(item.title)},
  ${esc(item.slug)},
  ${esc(item.type)},
  ${esc(item.category)},
  ${esc(item.description)},
  ${esc(excerpt)},
  ${esc(tierRequired)},
  'published',
  ${esc(item.author)},
  ${publishedAt},
  ${jsonb(metadata)}
) ON CONFLICT (slug) DO NOTHING;`
  );
}

const output = lines.join("\n\n") + "\n";
const outPath = "supabase/migrations/20260410000001_seed_content.sql";
writeFileSync(outPath, output);
console.log(`Wrote ${vaultItems.length} vault items to ${outPath}`);
