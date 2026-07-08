-- Reconstructed 2026-07-08 for migration history reconciliation.
-- This migration was applied directly to prod with no corresponding local file.
-- UNVERIFIABLE: NOTIFY leaves no catalog object to introspect. Content inferred
-- from migration name only. Standard Supabase pattern for forcing PostgREST
-- to reload schema cache after DDL changes.
NOTIFY pgrst, 'reload schema';
