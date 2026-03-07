-- Add session_id to conference_polls so polls can be scoped to specific sessions
ALTER TABLE conference_polls
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES conference_sessions(id) ON DELETE SET NULL;
