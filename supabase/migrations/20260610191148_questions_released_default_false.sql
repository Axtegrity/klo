-- Fix single-release mode: questions must arrive hidden until admin releases them.
-- Previously DEFAULT true meant every submitted question was immediately visible
-- to guests even when the session was in single-release mode.

ALTER TABLE conference_questions
  ALTER COLUMN released SET DEFAULT false;

-- Also update the submit RPC to be explicit so it never relies on the column default.
CREATE OR REPLACE FUNCTION submit_conference_question(
  p_text text,
  p_author_name text DEFAULT 'Anonymous',
  p_session_id uuid DEFAULT NULL,
  p_fingerprint text DEFAULT NULL
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

  INSERT INTO conference_questions ("text", author_name, session_id, released)
  VALUES (p_text, p_author_name, p_session_id, false);

  RETURN jsonb_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
