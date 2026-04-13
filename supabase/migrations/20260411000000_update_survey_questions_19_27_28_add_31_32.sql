-- ============================================================
-- Update survey questions 19, 27, 28 (open → single-select)
-- Add questions 31 (Name of Church) and 32 (Email) as optional
-- ============================================================

-- Q19: Convert from open-text to single-select, make required
UPDATE survey_questions
SET question_type = 'single',
    question_text = 'Are there ministry areas where AI should never be used?',
    options = '["Pastoral counseling and spiritual guidance", "Sermon preaching and delivery", "Prayer ministry and altar ministry", "Church discipline and sensitive member matters", "Financial decision-making without human oversight", "AI can be used in all areas if properly governed", "Unsure"]',
    required = true
WHERE survey_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND sort_order = 19;

-- Q27: Convert from open-text to single-select, make required
UPDATE survey_questions
SET question_type = 'single',
    question_text = 'What opportunity excites you most about AI for the Black Church?',
    options = '["Improving church administration and efficiency", "Enhancing communication and outreach", "Supporting sermon research and teaching preparation", "Expanding digital evangelism and discipleship", "Strengthening youth and next-generation engagement", "Increasing access to knowledge and resources", "I am not yet convinced AI presents meaningful opportunity"]',
    required = true
WHERE survey_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND sort_order = 27;

-- Q28: Convert from open-text to single-select, make required, update text
UPDATE survey_questions
SET question_type = 'single',
    question_text = 'What danger concerns you most about AI in church settings?',
    options = '["Loss of spiritual authenticity", "Inaccurate or misleading information", "Ethical misuse or manipulation", "Dependence on technology over discernment", "Data privacy and security concerns", "Bias or cultural misrepresentation", "Fear that leaders may rely on AI too heavily"]',
    required = true
WHERE survey_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND sort_order = 28;

-- Q31: Name of Church (optional) — idempotent: skip if a question with this
-- survey_id + sort_order already exists. An earlier version of this migration
-- lacked a guard and duplicated Q31/Q32 in prod on 2026-04-13 when it re-ran.
INSERT INTO survey_questions (survey_id, section_id, question_text, question_type, options, sort_order, required)
SELECT
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'a1000001-0000-0000-0000-000000000006',
  'Name of Church',
  'open',
  '[]',
  31,
  false
WHERE NOT EXISTS (
  SELECT 1 FROM survey_questions
  WHERE survey_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    AND sort_order = 31
);

-- Q32: Email (optional) — same idempotency guard as Q31.
INSERT INTO survey_questions (survey_id, section_id, question_text, question_type, options, sort_order, required)
SELECT
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'a1000001-0000-0000-0000-000000000006',
  'Email Address',
  'open',
  '[]',
  32,
  false
WHERE NOT EXISTS (
  SELECT 1 FROM survey_questions
  WHERE survey_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    AND sort_order = 32
);
