-- Host session control: closed_at, session_mode, snapshots
-- Migration: 20260612000001_host_session_control

-- 1. Add closed_at to conference_sessions
ALTER TABLE conference_sessions ADD COLUMN IF NOT EXISTS closed_at timestamptz;

-- 2. Add session_mode to conference_sessions
ALTER TABLE conference_sessions
  ADD COLUMN IF NOT EXISTS session_mode text DEFAULT 'sequential'
  CHECK (session_mode IN ('sequential', 'simultaneous'));

-- 3. Immutable session snapshots table
CREATE TABLE IF NOT EXISTS conference_session_snapshots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid REFERENCES conference_sessions(id) ON DELETE SET NULL,
  event_id    uuid,
  snapshot_data jsonb NOT NULL,
  created_at  timestamptz DEFAULT now(),
  created_by  uuid
);

CREATE INDEX IF NOT EXISTS idx_session_snapshots_session_id ON conference_session_snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_session_snapshots_event_id  ON conference_session_snapshots(event_id);

-- 4. Immutability triggers — snapshots are append-only
CREATE OR REPLACE FUNCTION conference_session_snapshots_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Session snapshots are immutable.';
END;
$$;

DROP TRIGGER IF EXISTS trg_snapshots_no_update ON conference_session_snapshots;
CREATE TRIGGER trg_snapshots_no_update
  BEFORE UPDATE ON conference_session_snapshots
  FOR EACH ROW EXECUTE FUNCTION conference_session_snapshots_immutable();

DROP TRIGGER IF EXISTS trg_snapshots_no_delete ON conference_session_snapshots;
CREATE TRIGGER trg_snapshots_no_delete
  BEFORE DELETE ON conference_session_snapshots
  FOR EACH ROW EXECUTE FUNCTION conference_session_snapshots_immutable();
