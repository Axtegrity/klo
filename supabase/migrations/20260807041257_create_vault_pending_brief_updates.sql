-- ============================================================
-- Intelligence Brief automation — vault_pending_brief_updates
--
-- Backend for the AI-assisted "Latest Intelligence Brief" generation
-- pipeline: the weekly content-automation cron (src/app/api/cron/
-- content-automation/route.ts) also web-searches for a current AI/
-- technology topic relevant to faith leaders/executives and lands a full
-- draft article here for human review. Nothing is ever auto-published —
-- see /api/admin/content-automation/brief-updates/[id] PATCH (publish |
-- discard) for the only path that writes into page_configs.brief_config.
--
-- Same admin-only access model as vault_drafts/vault_topic_lanes/
-- vault_trusted_sources/vault_pending_tool_updates: RLS is enabled with no
-- policies defined, so PostgREST/anon and authenticated roles get zero
-- access by default (default-deny) and only the service-role client
-- (getServiceSupabase(), which bypasses RLS entirely) can read or write.
-- ============================================================

CREATE TABLE IF NOT EXISTS vault_pending_brief_updates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  excerpt       TEXT NOT NULL,                 -- 2-3 sentence executive summary
  body          TEXT NOT NULL,                 -- full article, Keith's voice, 600-900 words
  link          TEXT,                          -- optional external reference link
  status        TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'published', 'discarded')),
  topic_source  TEXT,                          -- what topic/search prompted this brief
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at   TIMESTAMPTZ,
  reviewed_by   TEXT,                          -- admin email
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vault_pending_brief_updates_status       ON vault_pending_brief_updates(status);
CREATE INDEX IF NOT EXISTS idx_vault_pending_brief_updates_generated_at ON vault_pending_brief_updates(generated_at DESC);

ALTER TABLE vault_pending_brief_updates ENABLE ROW LEVEL SECURITY;
