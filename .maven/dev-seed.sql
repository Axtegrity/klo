-- KLO dev-seed.sql — realistic fixture data for the klo-dev Supabase project.
--
-- Runs automatically after migrations when `maven-tool dev-supabase provision`
-- completes. Idempotent (ON CONFLICT UPDATE everywhere) so it can be re-run
-- any time to reset fixture data to a known-good state.
--
-- What this creates:
--   - 5 auth.users rows matching the CREDENTIAL_ACCOUNTS hard-coded in
--     src/lib/auth.ts (so NextAuth IDs match real DB rows)
--   - 5 profiles rows with realistic subscription tiers and org metadata
--     for tier-gate journey coverage:
--       Keith      → owner         (admin persona)
--       admin      → admin         (admin persona, no content authoring)
--       moderator  → moderator     (mid-tier admin)
--       appletest1 → subscriber    (paid persona — use for vault access flows)
--       appletest2 → free          (free persona — use for upgrade-prompt flows)
--   - 4 vault_content rows: 2 free-tier, 2 subscriber-tier, spanning categories
--   - 1 active survey ("ai-black-church") with show_on_homepage=true
--   - 2 assessment_results rows for appletest1 (realistic history for
--     dashboard/profile journeys)
--
-- What this does NOT create:
--   - Subscriptions (Stripe-driven, too stateful for a static seed)
--   - Push subscriptions (device-specific)
--   - Events/conferences (separate journey, separate seed eventually)
--   - Page configs (homepage works fine with defaults; opt in later)
--
-- Safe to delete + re-run: all INSERTs use ON CONFLICT DO UPDATE.

-- ─── auth.users ────────────────────────────────────────────────────
-- Bypass the on_auth_user_created trigger temporarily so we can insert
-- auth.users + profiles with matching real data without the trigger
-- creating stub profile rows that our ON CONFLICT then has to overwrite
-- (works either way, but disabling the trigger keeps the seed log clean).
alter table auth.users disable trigger on_auth_user_created;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, is_sso_user, is_anonymous
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
   'keith@keithlodom.io', crypt('dev-seed-password', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}',
   '{"full_name":"Keith L. Odom"}', false, false, false),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
   'admin@keithlodom.io', crypt('dev-seed-password', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}',
   '{"full_name":"KLO Admin"}', false, false, false),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated',
   'moderator@keithlodom.io', crypt('dev-seed-password', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}',
   '{"full_name":"KLO Moderator"}', false, false, false),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated',
   'appletest1@keithlodom.ai', crypt('dev-seed-password', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}',
   '{"full_name":"Apple Test 1"}', false, false, false),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated',
   'appletest2@keithlodom.ai', crypt('dev-seed-password', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}',
   '{"full_name":"Apple Test 2"}', false, false, false)
on conflict (id) do update set
  email = excluded.email,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

alter table auth.users enable trigger on_auth_user_created;

-- ─── profiles ──────────────────────────────────────────────────────
insert into profiles (id, full_name, organization_name, organization_type, industry, team_size, subscription_tier, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000001', 'Keith L. Odom', 'Axtegrity Consulting', 'company', 'technology', '10-50', 'owner', now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'KLO Admin',     'Studio Tim',           'company', 'technology', '1-10',  'admin', now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'KLO Moderator', 'Studio Tim',           'company', 'technology', '1-10',  'admin', now(), now()),
  ('00000000-0000-0000-0000-000000000004', 'Apple Test 1',  'Apple Review',         'company', 'technology', '1-10',  'subscriber', now(), now()),
  ('00000000-0000-0000-0000-000000000005', 'Apple Test 2',  'Apple Review',         'company', 'technology', '1-10',  'free', now(), now())
on conflict (id) do update set
  full_name = excluded.full_name,
  organization_name = excluded.organization_name,
  subscription_tier = excluded.subscription_tier,
  updated_at = now();

-- ─── vault_content ─────────────────────────────────────────────────
-- Mix of tiers so journey tests can verify tier-gated visibility:
--   free tier:       2 entries (visible to everyone signed in)
--   subscriber:      2 entries (subscriber + owner/admin see, free does not)
insert into vault_content (id, title, slug, content_type, category, body, excerpt, tier_required, published, created_at, updated_at) values
  ('11111111-1111-1111-1111-111111111001', 'AI for Pastors — Getting Started',
   'ai-for-pastors-getting-started', 'briefing', 'AI & Ethics',
   'A practical starter guide for pastors exploring AI in their ministry. Covers common questions about ChatGPT for sermon prep, ethical boundaries, and the three questions every church leader should ask before adopting any AI tool.',
   'Starter guide for pastors exploring AI — ethical framing + first steps.',
   'free', true, now(), now()),
  ('11111111-1111-1111-1111-111111111002', 'Digital Leadership 101',
   'digital-leadership-101', 'briefing', 'Leadership',
   'The foundations of leading through digital transformation — for leaders who did not grow up digital-native but need to lead teams that did. Five principles, real examples, no jargon.',
   'Digital transformation for leaders who want to lead, not just adapt.',
   'free', true, now(), now()),
  ('11111111-1111-1111-1111-111111111003', 'The AI Readiness Scorecard',
   'ai-readiness-scorecard', 'assessment-guide', 'AI & Ethics',
   'Deep dive into the AI Readiness assessment — what each score means, what to do with your results, and a 90-day action plan based on where you land. Includes downloadable worksheet.',
   'Premium companion to the AI Readiness assessment — scoring + 90-day plan.',
   'subscriber', true, now(), now()),
  ('11111111-1111-1111-1111-111111111004', 'Strategic Planning in an AI Era',
   'strategic-planning-ai-era', 'strategy-guide', 'Strategy',
   'How to do 3-year strategic planning when the technology landscape shifts every 6 months. A practical framework for leaders who need to commit to direction without locking themselves out of emerging opportunities.',
   'Strategic planning framework for leaders navigating rapid AI change.',
   'subscriber', true, now(), now())
on conflict (id) do update set
  title = excluded.title,
  body = excluded.body,
  tier_required = excluded.tier_required,
  published = excluded.published,
  updated_at = now();

-- ─── surveys (matches prod — "The State of AI in the Black Church") ─
-- Only seed if the surveys table exists (introduced in migration
-- 20260407000000_surveys.sql). Guarded so partial schemas don't error.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'surveys') then
    insert into surveys (id, title, slug, description, is_active, show_on_homepage, created_at, updated_at) values
      ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
       'The State of AI in the Black Church',
       'ai-black-church',
       'A national study to understand how Black churches, pastors, leaders, and congregations are thinking about artificial intelligence.',
       true, true, now(), now())
    on conflict (id) do update set
      title = excluded.title,
      is_active = true,
      show_on_homepage = true,
      updated_at = now();
  end if;
end$$;

-- ─── assessment_results for appletest1 (subscriber with history) ────
-- Gives dashboard/profile journeys a non-empty state to render.
-- Only seed if the table exists (defensive — same guard as surveys).
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'assessment_results') then
    insert into assessment_results (id, user_id, assessment_type, score, answers, recommendations, created_at) values
      ('22222222-2222-2222-2222-222222222001',
       '00000000-0000-0000-0000-000000000004',
       'ai_readiness', 72,
       '{"q1":"agree","q2":"strongly_agree","q3":"neutral"}'::jsonb,
       array['Invest in foundational AI literacy training for your leadership team',
             'Pilot one low-stakes AI tool in a single department before expanding',
             'Establish an AI ethics review process before your first production deployment'],
       now() - interval '14 days'),
      ('22222222-2222-2222-2222-222222222002',
       '00000000-0000-0000-0000-000000000004',
       'digital_leadership', 84,
       '{"q1":"strongly_agree","q2":"agree","q3":"agree"}'::jsonb,
       array['Your digital leadership foundation is strong — focus on team enablement next',
             'Consider mentoring other leaders navigating the same transition'],
       now() - interval '7 days')
    on conflict (id) do update set
      score = excluded.score,
      answers = excluded.answers,
      recommendations = excluded.recommendations;
  end if;
end$$;

-- ─── seed complete ─────────────────────────────────────────────────
-- Summary counts — visible in the provision tool's output:
select 'auth.users' as table_name, count(*) as row_count from auth.users
union all select 'profiles',         count(*) from profiles
union all select 'vault_content',    count(*) from vault_content;
