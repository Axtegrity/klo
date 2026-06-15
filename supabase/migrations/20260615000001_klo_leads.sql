-- klo_leads: capture contact info submitted by users who complete
-- an assessment or survey. Tied to a user account when signed in,
-- anonymous otherwise.

CREATE TABLE IF NOT EXISTS klo_leads (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  name          text        NOT NULL,
  email         text        NOT NULL,
  phone         text,
  organization  text,
  source        text        NOT NULL CHECK (source IN ('assessment', 'survey')),
  source_id     text        NOT NULL,
  user_id       uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  metadata      jsonb
);

-- Fast lookup by email (admin searches, dedup checks)
CREATE INDEX IF NOT EXISTS klo_leads_email_idx
  ON klo_leads (email);

-- Fast lookup by source + source_id (per-assessment or per-survey reporting)
CREATE INDEX IF NOT EXISTS klo_leads_source_source_id_idx
  ON klo_leads (source, source_id);

-- RLS: enabled; service role bypasses for API writes.
-- No public read or write — leads are internal PII.
ALTER TABLE klo_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "klo_leads_no_public_access" ON klo_leads
  AS RESTRICTIVE
  FOR ALL
  USING (false);
