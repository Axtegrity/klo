-- Add join_url to strategy_sessions for meeting/Zoom/Teams links
ALTER TABLE strategy_sessions ADD COLUMN IF NOT EXISTS join_url text;
