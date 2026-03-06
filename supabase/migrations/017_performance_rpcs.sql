-- Word cloud aggregation: GROUP BY in SQL instead of fetching all rows
CREATE OR REPLACE FUNCTION get_word_cloud_counts()
RETURNS TABLE(word TEXT, count BIGINT) AS $$
  SELECT LOWER(w.word) AS word, COUNT(*) AS count
  FROM conference_word_cloud w
  GROUP BY LOWER(w.word)
  ORDER BY count DESC;
$$ LANGUAGE sql STABLE;

-- Poll vote counts: aggregate in SQL instead of fetching every vote row
CREATE OR REPLACE FUNCTION get_poll_vote_counts()
RETURNS TABLE(poll_id UUID, option_index INT, cnt BIGINT) AS $$
  SELECT v.poll_id, v.option_index, COUNT(*) AS cnt
  FROM conference_poll_votes v
  GROUP BY v.poll_id, v.option_index;
$$ LANGUAGE sql STABLE;
