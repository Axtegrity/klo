-- Reconstructed 2026-07-08 for migration history reconciliation.
-- This migration was applied directly to prod with no corresponding local file.
-- Column definition pulled from information_schema.columns on 2026-07-08. [verified against prod schema]
ALTER TABLE event_presentations
  ADD COLUMN IF NOT EXISTS rehearsal_mode boolean DEFAULT false;
