-- ============================================================
-- Trusted Sources — vault_trusted_sources
--
-- Admin-managed allowlist of domains the Content Automation pipeline's
-- web_search tool is restricted to when at least one source is active. See:
--   src/lib/claude.ts (searchLaneTopics() — passes active domains as
--     allowed_domains on the web_search tool call; falls back to no
--     restriction when zero sources are active)
--   src/app/api/admin/content-automation/trusted-sources/route.ts
--   src/features/admin/content-automation/TrustedSources.tsx
--
-- Same admin-only access model as vault_drafts/vault_topic_lanes: RLS
-- enabled with no policies defined, so PostgREST/anon and authenticated
-- roles get zero access by default (default-deny) and only the
-- service-role client (getServiceSupabase(), which bypasses RLS entirely)
-- can read or write.
-- ============================================================

CREATE TABLE IF NOT EXISTS vault_trusted_sources (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  domain     TEXT NOT NULL UNIQUE,
  category   TEXT,                        -- optional tag, e.g. "AI & Ethics" — not DB-constrained; the admin UI limits its dropdown to VAULT_CATEGORIES
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vault_trusted_sources_active ON vault_trusted_sources(active);

ALTER TABLE vault_trusted_sources ENABLE ROW LEVEL SECURITY;

-- NOTE: the requested seed list included both "The Batch" and
-- "DeepLearning.AI" at the same domain (deeplearning.ai) — domain is
-- UNIQUE, so both cannot exist as separate rows. Kept "DeepLearning.AI"
-- (the parent brand) and dropped the duplicate "The Batch" row; flagged in
-- the PR rather than silently seeding only 13 of the 14 requested sources
-- with no explanation. ON CONFLICT DO NOTHING is a backstop, not the
-- primary resolution — this list is intentionally already deduplicated.
INSERT INTO vault_trusted_sources (name, domain, category) VALUES
  ('MIT Technology Review', 'technologyreview.com',   'AI & Ethics'),
  ('VentureBeat',           'venturebeat.com',         'AI & Ethics'),
  ('Hugging Face Blog',     'huggingface.co',          'AI & Ethics'),
  ('Anthropic Blog',        'anthropic.com',           'AI & Ethics'),
  ('OpenAI Blog',           'openai.com',               'AI & Ethics'),
  ('TLDR AI',               'tldr.tech',                'AI & Ethics'),
  ('The Rundown AI',        'therundown.ai',            'AI & Ethics'),
  ('DeepLearning.AI',       'deeplearning.ai',          'AI & Ethics'),
  ('Hacker News',           'news.ycombinator.com',     'AI & Ethics'),
  ('ChurchTechToday',       'churchtechtoday.com',      'Church & Tech'),
  ('Barna Group',           'barna.com',                'Church & Tech'),
  ('Gloo',                  'gloo.us',                  'Church & Tech'),
  ('Subsplash Blog',        'subsplash.com',            'Church & Tech')
ON CONFLICT (domain) DO NOTHING;
