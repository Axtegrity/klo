-- Reconstructed 2026-07-08 for migration history reconciliation.
-- This migration was applied directly to prod with no corresponding local file.
-- Column + FK definition pulled from information_schema on 2026-07-08. [verified against prod schema]
ALTER TABLE event_files
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES conference_sessions(id) ON DELETE CASCADE;
