-- Migration: create_advisor_conversations
-- Table already applied to production. This file exists for git history only.
-- Do NOT apply to a production database that already has this table.

CREATE TABLE IF NOT EXISTS advisor_conversations (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  title         text,
  messages      jsonb       NOT NULL DEFAULT '[]',
  message_count integer     DEFAULT 0
);

CREATE INDEX IF NOT EXISTS advisor_conversations_user_id_idx
  ON advisor_conversations (user_id, updated_at DESC);

ALTER TABLE advisor_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "users own their conversations"
  ON advisor_conversations
  FOR ALL
  USING (user_id = auth.uid());
