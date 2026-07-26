-- ============================================================
-- RAG Knowledge Base — vault_embeddings
--
-- Backend for semantic search over published Vault content: an embedding is
-- generated (OpenAI text-embedding-3-small, 1536 dimensions — see
-- src/lib/vault-embeddings.ts) for every published vault_content row, and
-- content-automation generation (both vault articles and AI Tool of the
-- Week suggestions) looks up the most similar existing articles before
-- writing, so new content builds on Keith's established thinking instead of
-- repeating it. See src/lib/content-automation.ts.
--
-- Same admin-only access model as vault_drafts/vault_topic_lanes/
-- vault_trusted_sources/vault_pending_tool_updates: RLS is enabled with no
-- policies defined, so PostgREST/anon and authenticated roles get zero
-- access by default (default-deny) and only the service-role client
-- (getServiceSupabase(), which bypasses RLS entirely) can read or write.
--
-- CREATE EXTENSION IF NOT EXISTS is idempotent/safe even though pgvector is
-- already confirmed installed on prod (verified via
-- `SELECT extname FROM pg_extension WHERE extname = 'vector'` this session)
-- — included so this migration is portable to a fresh dev/local instance.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS vault_embeddings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_content_id UUID NOT NULL UNIQUE REFERENCES vault_content(id) ON DELETE CASCADE,
  embedding        extensions.vector(1536) NOT NULL,  -- 1536 dims matches text-embedding-3-small
  content_hash     TEXT NOT NULL,                      -- SHA-256 of the text embedded, for cache invalidation
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- lists = 10: pgvector's own guidance is roughly rows/1000 (or sqrt(rows)
-- for smaller tables) — the Vault has a handful of published articles today,
-- so 10 lists is deliberately generous headroom rather than tuned to the
-- current row count. Revisit if the table grows past a few thousand rows.
CREATE INDEX ON vault_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

ALTER TABLE vault_embeddings ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- match_vault_content — required because PostgREST has no pgvector
-- similarity operators; supabase-js calls this via .rpc(), same pattern as
-- Supabase's own documented vector-search guide (match_documents).
-- Joins back to vault_content so callers get title/excerpt/category/slug
-- directly, and filters to visibility = 'published' so a discarded/hidden
-- article can never surface in a generation prompt via RAG.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION match_vault_content (
  query_embedding extensions.vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  title text,
  excerpt text,
  category text,
  slug text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    vault_content.id,
    vault_content.title,
    vault_content.excerpt,
    vault_content.category,
    vault_content.slug,
    1 - (vault_embeddings.embedding <=> query_embedding) AS similarity
  FROM vault_embeddings
  JOIN vault_content ON vault_content.id = vault_embeddings.vault_content_id
  WHERE vault_content.visibility = 'published'
    AND 1 - (vault_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY vault_embeddings.embedding <=> query_embedding ASC
  LIMIT match_count;
$$;
