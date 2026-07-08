-- 20260610000003: Wire event_id through submit_conference_question RPC
-- The event_id column already exists (migration 024) but was never populated.
-- This adds p_event_id to the RPC so questions are properly scoped to their event.

CREATE OR REPLACE FUNCTION submit_conference_question(
  p_text text,
  p_author_name text DEFAULT 'Anonymous',
  p_session_id uuid DEFAULT NULL,
  p_fingerprint text DEFAULT NULL,
  p_event_id uuid DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_flagged text[];
  v_clean text;
BEGIN
  v_clean := lower(p_text);
  SELECT array_agg(term) INTO v_flagged
  FROM conference_profanity_terms
  WHERE v_clean LIKE '%' || term || '%';

  IF v_flagged IS NOT NULL AND array_length(v_flagged, 1) > 0 THEN
    INSERT INTO conference_profanity_log (original_text, flagged_terms, action, voter_fingerprint)
    VALUES (p_text, v_flagged, 'blocked', p_fingerprint);
    RETURN jsonb_build_object('ok', false, 'reason', 'profanity', 'flagged', to_jsonb(v_flagged));
  END IF;

  INSERT INTO conference_questions (text, author_name, session_id, event_id)
  VALUES (p_text, p_author_name, p_session_id, p_event_id);

  RETURN jsonb_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
