-- Add "ended" to the event_status lifecycle: upcoming -> live -> ended -> past.
--
-- "Ended" is a new, distinct state between "live" and "past": the event is
-- taken off the home page, but its polls remain open for stragglers until an
-- admin/host explicitly "Closes" it (event_status -> "past"), which also
-- locks its polls. See src/app/host/_HostContent.tsx (End Event / Close
-- Event) and src/app/api/cron/auto-end-sessions/route.ts (auto-end safety
-- net) for the two paths into this state.
--
-- Constraint name confirmed by dumping the dev project's schema
-- (supabase db dump --linked -s public) rather than guessing Postgres's
-- auto-generated name — migration 031_event_status_and_activity_log.sql
-- added this CHECK inline without an explicit name:
--   event_presentations_event_status_check
--     CHECK (event_status = ANY (ARRAY['upcoming','live','past']))
-- Dev and prod share this migration's history (reconciled in PR #206,
-- 2026-07-08), so the auto-generated name is expected to match on both.

ALTER TABLE event_presentations
  DROP CONSTRAINT event_presentations_event_status_check,
  ADD CONSTRAINT event_presentations_event_status_check
    CHECK (event_status IN ('upcoming', 'live', 'ended', 'past'));

-- No NOT NULL added to session_end_time here — enforced at the application
-- layer only (Zod: required on create, optional-but-non-nullable on update).
-- 8/8 existing prod events currently have session_end_time null/empty; a
-- DB-level NOT NULL would break every existing row on this additive-only
-- migration path.
