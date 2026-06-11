-- 20260611000001: Add pinned_as_next to event_presentations
-- Allows admins to manually pin which event shows as "Up Next" on the events page.
-- Auto mode (no pin): first upcoming event by date shows automatically.
-- Manual mode: pinned event overrides auto-selection regardless of date order.
ALTER TABLE event_presentations
  ADD COLUMN IF NOT EXISTS pinned_as_next boolean DEFAULT false;
