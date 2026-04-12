-- ============================================================
-- Seed: State of AI in the Black Church Survey
-- 32 questions across 6 sections
-- ============================================================

-- Create the survey
INSERT INTO surveys (id, title, slug, description, intro_text, is_active, show_on_homepage)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'The State of AI in the Black Church',
  'ai-black-church',
  'A national study to understand how Black churches, pastors, leaders, and congregations are thinking about artificial intelligence.',
  'Artificial Intelligence is rapidly reshaping how people communicate, learn, work, and make decisions—and the church cannot afford to be absent from that conversation. Yet while national studies continue to explore AI adoption across faith communities, the Black Church is often missing from the data, despite its historic role as a leader in shaping culture, community, justice, and spiritual formation. The State of AI in the Black Church Survey was created to help change that. This national study seeks to better understand how Black churches, pastors, leaders, and congregations are thinking about artificial intelligence, where it is already being used, what concerns exist, and what opportunities may lie ahead. Our goal is simple: to ensure that the voice, values, wisdom, and realities of the Black Church are represented in one of the most important technological conversations of our time.',
  true,
  true
);

-- Create sections
INSERT INTO survey_sections (id, survey_id, title, description, sort_order) VALUES
  ('a1000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Church Profile & Leadership Context', 'Who is responding? What type of church is represented?', 1),
  ('a1000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'AI Awareness & Understanding', 'What do leaders actually know?', 2),
  ('a1000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Current Use of AI in Ministry', 'What are churches actually doing?', 3),
  ('a1000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Theology, Ethics & Trust', 'Critical section because this is where Black Church voice matters deeply.', 4),
  ('a1000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Readiness, Training & Capacity', 'Where are the gaps?', 5),
  ('a1000001-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Future Outlook for the Black Church', 'This is where your research becomes powerful nationally.', 6);

-- ============================================================
-- SECTION 1: Church Profile & Leadership Context (Q1-Q5)
-- ============================================================

INSERT INTO survey_questions (survey_id, section_id, question_text, question_type, options, sort_order, required) VALUES

-- Q1
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000001',
 'What is your role in the church?', 'single',
 '["Senior Pastor", "Executive Pastor", "Associate Minister", "Administrative Leader", "Technology Leader", "Ministry Leader", "Other"]',
 1, true),

-- Q2
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000001',
 'What denomination or fellowship is your church affiliated with?', 'single',
 '["African Methodist Episcopal (AME) Church", "African Methodist Episcopal Zion (AME Zion) Church", "Christian Methodist Episcopal (CME) Church", "Church of God in Christ", "Full Gospel Baptist Church Fellowship", "Pentecostal Assemblies of the World (PAW)", "Progressive National Baptist Convention", "National Baptist Convention of America", "National Baptist Convention USA", "Church of Our Lord Jesus Christ of the Apostolic Faith (COOLJC)", "Bible Way Church World Wide", "United Holy Church of America", "Mount Sinai Holy Church of America", "Non Denominational", "Other"]',
 2, true),

-- Q3
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000001',
 'What is your church''s approximate weekly attendance?', 'single',
 '["Under 100", "100–250", "250–500", "500–1,000", "1,000+"]',
 3, true),

-- Q4
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000001',
 'Where is your church located?', 'single',
 '["Urban", "Suburban", "Rural"]',
 4, true),

-- Q5
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000001',
 'Does your church currently have a dedicated technology or media ministry?', 'single',
 '["Yes", "No", "In Development"]',
 5, true),

-- ============================================================
-- SECTION 2: AI Awareness & Understanding (Q6-Q10)
-- ============================================================

-- Q6
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000002',
 'How familiar are you with Artificial Intelligence (AI)?', 'single',
 '["Very familiar", "Somewhat familiar", "Heard of it but limited understanding", "Not familiar"]',
 6, true),

-- Q7
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000002',
 'Which of the following best describes your understanding of AI?', 'single',
 '["I use it regularly", "I understand basic concepts", "I am still learning", "I have concerns and limited knowledge"]',
 7, true),

-- Q8
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000002',
 'Which AI tools have you heard of?', 'multi',
 '["ChatGPT", "Claude", "Gemini", "Microsoft Copilot", "Other"]',
 8, true),

-- Q9
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000002',
 'Do you believe AI will significantly impact ministry in the next 5 years?', 'single',
 '["Yes", "No", "Unsure"]',
 9, true),

-- Q10
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000002',
 'What best describes your overall perspective toward AI?', 'single',
 '["Excited", "Curious", "Cautious", "Concerned", "Opposed"]',
 10, true),

-- ============================================================
-- SECTION 3: Current Use of AI in Ministry (Q11-Q15)
-- ============================================================

-- Q11
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000003',
 'Is anyone in your church currently using AI for ministry-related work?', 'single',
 '["Yes", "No", "Unsure"]',
 11, true),

-- Q12
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000003',
 'In which areas is AI currently being used?', 'multi',
 '["Sermon research", "Writing communications", "Social media content", "Graphic design", "Administrative tasks", "Budgeting/Data analysis", "None"]',
 12, true),

-- Q13
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000003',
 'Have you personally used AI to assist in sermon preparation?', 'single',
 '["Frequently", "Occasionally", "Never"]',
 13, true),

-- Q14
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000003',
 'Has AI been used in your church for member engagement or communication?', 'single',
 '["Yes", "No", "Planning to"]',
 14, true),

-- Q15
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000003',
 'Have you explored AI chatbots for your church website or ministry?', 'single',
 '["Yes", "No", "Interested but not yet"]',
 15, true),

-- ============================================================
-- SECTION 4: Theology, Ethics & Trust (Q16-Q20)
-- ============================================================

-- Q16
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000004',
 'Do you believe AI can be used ethically in ministry?', 'single',
 '["Yes", "No", "Unsure"]',
 16, true),

-- Q17
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000004',
 'What concerns you most about AI in church settings?', 'multi',
 '["Accuracy", "Bias", "Loss of authenticity", "Job displacement", "Spiritual misuse", "Privacy concerns"]',
 17, true),

-- Q18
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000004',
 'Do you believe AI should assist but never replace pastoral discernment?', 'single',
 '["Strongly agree", "Agree", "Neutral", "Disagree"]',
 18, true),

-- Q19
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000004',
 'Are there ministry areas where AI should never be used?', 'single',
 '["Pastoral counseling and spiritual guidance", "Sermon preaching and delivery", "Prayer ministry and altar ministry", "Church discipline and sensitive member matters", "Financial decision-making without human oversight", "AI can be used in all areas if properly governed", "Unsure"]',
 19, true),

-- Q20
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000004',
 'Should churches establish AI guidelines or policies?', 'single',
 '["Yes", "No", "Unsure"]',
 20, true),

-- ============================================================
-- SECTION 5: Readiness, Training & Capacity (Q21-Q25)
-- ============================================================

-- Q21
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000005',
 'Does your church currently offer training on emerging technology?', 'single',
 '["Yes", "No"]',
 21, true),

-- Q22
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000005',
 'Would your leadership team benefit from AI training?', 'single',
 '["Yes", "No", "Unsure"]',
 22, true),

-- Q23
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000005',
 'Which area would you most want training in?', 'single',
 '["Sermon support", "Administration", "Security", "Youth engagement", "Church communications", "AI ethics"]',
 23, true),

-- Q24
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000005',
 'Does your church have someone qualified to guide AI adoption?', 'single',
 '["Yes", "No", "Not sure"]',
 24, true),

-- Q25
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000005',
 'Would you attend a conference focused on AI and ministry?', 'single',
 '["Yes", "No", "Possibly"]',
 25, true),

-- ============================================================
-- SECTION 6: Future Outlook for the Black Church (Q26-Q30)
-- ============================================================

-- Q26
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000006',
 'Do you believe Black churches risk falling behind if AI is ignored?', 'single',
 '["Yes", "No", "Unsure"]',
 26, true),

-- Q27
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000006',
 'What opportunity excites you most about AI for the Black Church?', 'single',
 '["Improving church administration and efficiency", "Enhancing communication and outreach", "Supporting sermon research and teaching preparation", "Expanding digital evangelism and discipleship", "Strengthening youth and next-generation engagement", "Increasing access to knowledge and resources", "I am not yet convinced AI presents meaningful opportunity"]',
 27, true),

-- Q28
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000006',
 'What danger concerns you most about AI in church settings?', 'single',
 '["Loss of spiritual authenticity", "Inaccurate or misleading information", "Ethical misuse or manipulation", "Dependence on technology over discernment", "Data privacy and security concerns", "Bias or cultural misrepresentation", "Fear that leaders may rely on AI too heavily"]',
 28, true),

-- Q29
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000006',
 'In 3 years, do you expect your church to be using AI more, less, or the same?', 'single',
 '["More", "Same", "Less"]',
 29, true),

-- Q30
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000006',
 'Would you support a national initiative focused on AI readiness in Black churches?', 'single',
 '["Yes", "No", "Need more information"]',
 30, true),

-- Q31 (optional)
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000006',
 'Name of Church', 'open',
 '[]',
 31, false),

-- Q32 (optional)
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1000001-0000-0000-0000-000000000006',
 'Email Address', 'open',
 '[]',
 32, false);
