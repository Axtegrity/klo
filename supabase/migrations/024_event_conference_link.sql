-- 024: Link Events to Conference Tools + Guest Sign-In
-- Fully additive — all new columns nullable, existing data untouched.

-- 1. Add access_code and seminar_mode to event_presentations
ALTER TABLE event_presentations
  ADD COLUMN IF NOT EXISTS access_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS seminar_mode BOOLEAN DEFAULT false;

-- 2. Link conference_sessions to events
ALTER TABLE conference_sessions
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES event_presentations(id) ON DELETE SET NULL;

-- 3. Link conference_polls to events
ALTER TABLE conference_polls
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES event_presentations(id) ON DELETE SET NULL;

-- 4. Link conference_questions to events
ALTER TABLE conference_questions
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES event_presentations(id) ON DELETE SET NULL;

-- 5. Create conference_guests table (lightweight sign-in)
CREATE TABLE IF NOT EXISTS conference_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES event_presentations(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  access_code TEXT NOT NULL,
  guest_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Link poll votes to guests
ALTER TABLE conference_poll_votes
  ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES conference_guests(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conference_sessions_event_id ON conference_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_conference_polls_event_id ON conference_polls(event_id);
CREATE INDEX IF NOT EXISTS idx_conference_questions_event_id ON conference_questions(event_id);
CREATE INDEX IF NOT EXISTS idx_conference_guests_event_id ON conference_guests(event_id);
CREATE INDEX IF NOT EXISTS idx_conference_guests_token ON conference_guests(guest_token);
CREATE INDEX IF NOT EXISTS idx_event_presentations_access_code ON event_presentations(access_code);

-- RLS for conference_guests
ALTER TABLE conference_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read guests" ON conference_guests
  FOR SELECT USING (true);

CREATE POLICY "Service role full access to guests" ON conference_guests
  FOR ALL USING (auth.role() = 'service_role');

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE conference_guests;
