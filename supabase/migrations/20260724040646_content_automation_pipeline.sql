-- ============================================================
-- Content Automation Pipeline — vault_drafts + vault_topic_lanes
--
-- Backend for the AI-assisted content generation pipeline: a weekly
-- cron searches curated topic lanes, drafts articles in Keith L.
-- Odom's voice, and lands them in vault_drafts for human review.
-- Nothing is ever auto-published — see /api/admin/content-automation/
-- drafts/[id] PATCH (publish | discard) for the only path that moves
-- a draft into the public vault_content table.
--
-- Both tables are admin-only: RLS is enabled with no policies defined,
-- so PostgREST/anon and authenticated roles get zero access by default
-- (default-deny) and only the service-role client (getServiceSupabase(),
-- which bypasses RLS entirely) can read or write. This matches how
-- vault_content restricts writes — see 003_vault_content.sql, where the
-- write path is "handled via service key, no policy needed."
-- ============================================================

-- ------------------------------------------------------------
-- 1. vault_topic_lanes — curated search lanes the generator draws from
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vault_topic_lanes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vault_topic_lanes_active ON vault_topic_lanes(active);

ALTER TABLE vault_topic_lanes ENABLE ROW LEVEL SECURITY;

INSERT INTO vault_topic_lanes (name, description, active) VALUES
  ('AI & Ethics',       'Ethical implications of AI for faith and nonprofit leaders', true),
  ('Church & Tech',     'Technology adoption and digital transformation in ministry', true),
  ('Governance',        'AI governance, policy, and compliance frameworks', true),
  ('Leadership',        'Leadership in the age of digital disruption', true),
  ('Youth & Workforce', 'AI impact on youth, education, and the future workforce', true)
ON CONFLICT (name) DO NOTHING;

-- ------------------------------------------------------------
-- 2. vault_drafts — AI-generated articles awaiting human review
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vault_drafts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  body          TEXT NOT NULL,
  excerpt       TEXT,
  category      TEXT NOT NULL,                 -- must match VAULT_CATEGORIES in src/lib/vault-data.ts
  content_type  TEXT NOT NULL DEFAULT 'article',
  tier_required TEXT NOT NULL DEFAULT 'free',   -- free, essentials, professional, enterprise
  topic_source  TEXT,                           -- the search topic that generated this draft
  status        TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'published', 'discarded')),
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at   TIMESTAMPTZ,
  reviewed_by   TEXT,                           -- admin email
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vault_drafts_status       ON vault_drafts(status);
CREATE INDEX IF NOT EXISTS idx_vault_drafts_category     ON vault_drafts(category);
CREATE INDEX IF NOT EXISTS idx_vault_drafts_generated_at ON vault_drafts(generated_at DESC);

ALTER TABLE vault_drafts ENABLE ROW LEVEL SECURITY;
