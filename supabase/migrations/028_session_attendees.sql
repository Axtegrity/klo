-- Track which attendees are in which conference session
-- Enforces one active session at a time per user

CREATE TABLE IF NOT EXISTS conference_session_attendees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES conference_sessions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ DEFAULT now(),
  left_at     TIMESTAMPTZ,

  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_csa_user    ON conference_session_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_csa_session ON conference_session_attendees(session_id);

-- RLS
ALTER TABLE conference_session_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own session attendance"
  ON conference_session_attendees FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'owner', 'moderator')
    )
  );

CREATE POLICY "Users join sessions"
  ON conference_session_attendees FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users leave sessions"
  ON conference_session_attendees FOR UPDATE
  USING (user_id = auth.uid());

-- Admins see all
CREATE POLICY "Admins manage session attendance"
  ON conference_session_attendees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'owner', 'moderator')
    )
  );

-- Enable Realtime on new table + existing tables (skip if already members)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE conference_session_attendees;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE conference_polls;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE conference_questions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
