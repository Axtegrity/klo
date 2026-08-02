import { createHash } from "crypto";
import * as Sentry from "@sentry/nextjs";
import { getServiceSupabase } from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/*  RAG Knowledge Base — Vault content embeddings                      */
/*                                                                      */
/*  Anthropic has no native embeddings endpoint (confirmed against      */
/*  platform.claude.com/docs/en/api/embeddings — 404 — and their own    */
/*  guidance to use a third-party provider). This uses OpenAI's         */
/*  text-embedding-3-small (1536 dimensions, matching the vector(1536)  */
/*  column in the vault_embeddings migration) via a raw fetch, matching */
/*  the rest of this codebase's no-SDK style (see src/lib/claude.ts).   */
/*                                                                      */
/*  KNOWN GAP: OPENAI_API_KEY is not currently configured in this       */
/*  project's Vercel environment (verified via `vercel env list         */
/*  production` this session — absent from all 22 existing vars). Every */
/*  function here will fail until it's added (Production AND Preview,   */
/*  per this repo's standing env-var-scoping rule) — this is a known,   */
/*  flagged blocker, not an oversight.                                  */
/* ------------------------------------------------------------------ */

const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

// Below this, a "similar" result is treated as unrelated noise rather than
// genuinely relevant prior thinking — matches the match_vault_content SQL
// function's own threshold parameter default usage in this file.
const SIMILARITY_THRESHOLD = 0.7;

// First 2000 chars of body only — an embedding call doesn't need (and
// shouldn't pay for) a full 600-900 word article; title+excerpt+lede is
// enough signal for semantic similarity.
const BODY_CHARS_FOR_EMBEDDING = 2000;

export interface VaultEmbeddingResult {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  slug: string;
  similarity: number;
}

/**
 * Builds the "Keith's existing thinking" system-prompt block from
 * searchSimilarVaultContent() results, or "" when there are none — callers
 * (src/lib/content-automation.ts) append this to a generation system prompt
 * only when non-empty, so a lookup with no matches never mentions RAG at
 * all rather than injecting an empty/awkward section.
 */
export function buildRagContextBlock(results: VaultEmbeddingResult[]): string {
  if (results.length === 0) return "";

  const articles = results.map((r) => `## ${r.title}\n${r.excerpt}`).join("\n\n");

  return `KEITH'S EXISTING THINKING ON THIS TOPIC:
The following articles represent Keith L. Odom's existing published perspective on related subjects. Build on this thinking — do not repeat what has already been said. Stay consistent with his established positions and voice.

${articles}

When referencing these topics, extend and deepen Keith's thinking rather than restating it.`;
}

/**
 * Generates a 1536-dimension embedding for `text` via OpenAI's
 * text-embedding-3-small. Throws if OPENAI_API_KEY is unset or the request
 * fails — callers (upsertVaultEmbedding, searchSimilarVaultContent) are
 * responsible for deciding whether that failure should be non-blocking.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch(OPENAI_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI embeddings API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const embedding = data?.data?.[0]?.embedding;

  if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `OpenAI embeddings API returned an unexpected shape (expected ${EMBEDDING_DIMENSIONS}-dim array)`
    );
  }

  return embedding as number[];
}

function buildEmbeddingInput(title: string, excerpt: string, body: string): string {
  return `${title}\n\n${excerpt}\n\n${body.slice(0, BODY_CHARS_FOR_EMBEDDING)}`;
}

function hashContent(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export type UpsertVaultEmbeddingStatus = "processed" | "skipped";

// Shared implementation behind both upsertVaultEmbedding() (spec'd as
// Promise<void> — the two per-publish call sites don't care about the
// outcome) and upsertVaultEmbeddingWithStatus() (used by the backfill route,
// which needs to report processed/skipped/errors counts without
// re-implementing this exact hash-check logic a second time).
async function upsertVaultEmbeddingInternal(
  vaultContentId: string,
  title: string,
  body: string,
  excerpt: string
): Promise<UpsertVaultEmbeddingStatus> {
  const supabase = getServiceSupabase();
  const input = buildEmbeddingInput(title, excerpt, body);
  const contentHash = hashContent(input);

  const { data: existing, error: existingError } = await supabase
    .from("vault_embeddings")
    .select("content_hash")
    .eq("vault_content_id", vaultContentId)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to check existing embedding: ${existingError.message}`);
  }

  if (existing?.content_hash === contentHash) {
    return "skipped"; // unchanged since last embed — nothing to do
  }

  const embedding = await generateEmbedding(input);

  const { error: upsertError } = await supabase.from("vault_embeddings").upsert(
    {
      vault_content_id: vaultContentId,
      embedding,
      content_hash: contentHash,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "vault_content_id" }
  );

  if (upsertError) {
    throw new Error(`Failed to upsert embedding: ${upsertError.message}`);
  }

  return "processed";
}

/**
 * Generates (or refreshes) the embedding for a single vault_content row.
 * Skips the OpenAI call entirely when the concatenated title+excerpt+body
 * text is unchanged since the last embed (content_hash match) — cheap
 * cache-invalidation check before paying for a new embedding.
 */
export async function upsertVaultEmbedding(
  vaultContentId: string,
  title: string,
  body: string,
  excerpt: string
): Promise<void> {
  await upsertVaultEmbeddingInternal(vaultContentId, title, body, excerpt);
}

/**
 * Same as upsertVaultEmbedding(), but returns whether the row was actually
 * (re)embedded or skipped as unchanged — used by the embeddings backfill
 * route (src/app/api/admin/content-automation/embeddings/backfill/route.ts)
 * to report accurate processed/skipped counts.
 */
export async function upsertVaultEmbeddingWithStatus(
  vaultContentId: string,
  title: string,
  body: string,
  excerpt: string
): Promise<UpsertVaultEmbeddingStatus> {
  return upsertVaultEmbeddingInternal(vaultContentId, title, body, excerpt);
}

/**
 * Semantic search over published Vault content via the match_vault_content
 * Postgres function (required — PostgREST has no pgvector similarity
 * operators, so this can't be a plain .select() query; see the migration).
 * Returns [] on any failure rather than throwing — every caller of this
 * function treats "no relevant prior content" and "search failed" the same
 * way (skip the RAG prompt section entirely), so there's no separate error
 * path callers need to handle.
 */
export async function searchSimilarVaultContent(
  query: string,
  limit: number = 3
): Promise<VaultEmbeddingResult[]> {
  try {
    const supabase = getServiceSupabase();
    const queryEmbedding = await generateEmbedding(query);

    const { data, error } = await supabase.rpc("match_vault_content", {
      query_embedding: queryEmbedding,
      match_threshold: SIMILARITY_THRESHOLD,
      match_count: limit,
    });

    if (error) {
      throw new Error(`match_vault_content RPC failed: ${error.message}`);
    }

    return (data ?? []) as VaultEmbeddingResult[];
  } catch (error) {
    console.error("[searchSimilarVaultContent] failed, returning no results", error);
    Sentry.captureException(error, { extra: { source: "search-similar-vault-content" } });
    return [];
  }
}
