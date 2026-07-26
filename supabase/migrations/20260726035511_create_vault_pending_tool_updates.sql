-- ============================================================
-- AI Tool of the Week automation — vault_pending_tool_updates
--
-- Backend for the AI-assisted "Tool of the Week" suggestion pipeline: the
-- weekly content-automation cron (src/app/api/cron/content-automation/
-- route.ts) also web-searches for a current AI tool relevant to faith
-- leaders/executives (excluding whatever is currently live in
-- page_configs.tool_config) and lands a suggestion here for human review.
-- Nothing is ever auto-published — see
-- /api/admin/content-automation/tool-updates/[id] PATCH (publish |
-- discard) for the only path that writes into page_configs.tool_config.
--
-- Same admin-only access model as vault_drafts/vault_topic_lanes/
-- vault_trusted_sources: RLS is enabled with no policies defined, so
-- PostgREST/anon and authenticated roles get zero access by default
-- (default-deny) and only the service-role client (getServiceSupabase(),
-- which bypasses RLS entirely) can read or write.
-- ============================================================

CREATE TABLE IF NOT EXISTS vault_pending_tool_updates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name      TEXT NOT NULL,
  category       TEXT NOT NULL,                 -- e.g. "Productivity", "Research"
  description    TEXT NOT NULL,                 -- short blurb about what the tool does
  why_it_matters TEXT NOT NULL,                 -- Keith's voice — why faith leaders/executives should care
  link           TEXT NOT NULL,                 -- URL to the tool
  cta            TEXT NOT NULL DEFAULT 'Learn More',
  status         TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'published', 'discarded')),
  generated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at    TIMESTAMPTZ,
  reviewed_by    TEXT,                          -- admin email
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vault_pending_tool_updates_status       ON vault_pending_tool_updates(status);
CREATE INDEX IF NOT EXISTS idx_vault_pending_tool_updates_generated_at ON vault_pending_tool_updates(generated_at DESC);

ALTER TABLE vault_pending_tool_updates ENABLE ROW LEVEL SECURITY;
