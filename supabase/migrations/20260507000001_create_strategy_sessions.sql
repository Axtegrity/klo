-- strategy_sessions is distinct from strategy_rooms (004_strategy_rooms.sql).
-- 004_strategy_rooms.sql defines the real-time chat-room feature (strategy_rooms +
-- strategy_room_messages tables). This migration defines the event-style scheduled
-- sessions feature (strategy_sessions + strategy_registrations tables).
-- The two schemas coexist in the same database without conflict.

-- Strategy Rooms: sessions + registrations tables
-- Created 2026-05-07

CREATE TABLE strategy_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  date text,                    -- display label e.g. "April 15, 2026"
  session_date date,            -- for ordering
  time text,
  facilitator text,
  total_seats int NOT NULL DEFAULT 20,
  attendees_override int,       -- for past sessions: manually set historical count
  is_past bool NOT NULL DEFAULT false,
  tier text NOT NULL DEFAULT 'pro' CHECK (tier IN ('pro', 'executive')),
  topics jsonb NOT NULL DEFAULT '[]',
  agenda jsonb NOT NULL DEFAULT '[]',
  key_takeaways jsonb NOT NULL DEFAULT '[]',
  replay_url text,
  notes_url text,
  discussion_count int NOT NULL DEFAULT 0,
  published bool NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE strategy_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES strategy_sessions(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  user_email text NOT NULL,
  user_name text,
  registered_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'registered',
  UNIQUE(session_id, user_id)
);

-- RLS
ALTER TABLE strategy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_registrations ENABLE ROW LEVEL SECURITY;

-- Public read on published sessions
CREATE POLICY "public_read_published_sessions"
  ON strategy_sessions FOR SELECT
  USING (published = true);

-- Service role full access (for admin routes)
CREATE POLICY "service_full_access_sessions"
  ON strategy_sessions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Users read own registrations
CREATE POLICY "users_read_own_registrations"
  ON strategy_registrations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Users insert own registrations
CREATE POLICY "users_insert_own_registrations"
  ON strategy_registrations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

-- Users delete own registrations
CREATE POLICY "users_delete_own_registrations"
  ON strategy_registrations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Service role full access on registrations
CREATE POLICY "service_full_access_registrations"
  ON strategy_registrations FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- Atomic seat-check + insert function (prevents TOCTOU race condition)
-- Called from POST /api/strategy-rooms/[id]/register via supabase.rpc(...)
-- Returns JSON: { success: true, registered_count: N }
--           or: { error: "session_not_found" | "session_full" }
-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION register_for_strategy_session(
  p_session_id uuid,
  p_user_id text,
  p_user_email text,
  p_user_name text
) RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_seats int;
  v_registered_count int;
  v_session_tier text;
BEGIN
  SELECT total_seats, tier INTO v_total_seats, v_session_tier
  FROM strategy_sessions
  WHERE id = p_session_id AND published = true;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'session_not_found');
  END IF;

  SELECT COUNT(*) INTO v_registered_count
  FROM strategy_registrations
  WHERE session_id = p_session_id AND status = 'registered';

  IF v_registered_count >= v_total_seats THEN
    RETURN json_build_object('error', 'session_full');
  END IF;

  INSERT INTO strategy_registrations (session_id, user_id, user_email, user_name)
  VALUES (p_session_id, p_user_id, p_user_email, p_user_name)
  ON CONFLICT (session_id, user_id) DO NOTHING;

  SELECT COUNT(*) INTO v_registered_count
  FROM strategy_registrations
  WHERE session_id = p_session_id AND status = 'registered';

  RETURN json_build_object('success', true, 'registered_count', v_registered_count);
END;
$$;
