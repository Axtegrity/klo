-- ============================================================
-- 007_conference.sql — Conference Companion tables
-- ============================================================

-- App-wide settings (key-value store)
create table if not exists app_settings (
  key   text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Seed seminar_mode setting
insert into app_settings (key, value)
values ('seminar_mode', '{"active": false}'::jsonb)
on conflict (key) do nothing;

-- Conference polls
create table if not exists conference_polls (
  id           uuid primary key default gen_random_uuid(),
  question     text not null,
  options      jsonb not null default '[]'::jsonb,
  is_active    boolean not null default true,
  show_results boolean not null default false,
  created_at   timestamptz not null default now(),
  closed_at    timestamptz
);

-- Poll votes (anonymous, fingerprint-based dedup)
create table if not exists conference_poll_votes (
  id                uuid primary key default gen_random_uuid(),
  poll_id           uuid not null references conference_polls(id) on delete cascade,
  option_index      integer not null,
  voter_fingerprint text not null,
  created_at        timestamptz not null default now(),
  constraint unique_poll_vote unique (poll_id, voter_fingerprint)
);

create index if not exists idx_poll_votes_poll_id on conference_poll_votes(poll_id);

-- Conference questions (anonymous Q&A)
create table if not exists conference_questions (
  id          uuid primary key default gen_random_uuid(),
  text        text not null,
  author_name text not null default 'Anonymous',
  upvotes     integer not null default 0,
  is_answered boolean not null default false,
  is_hidden   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Question upvotes (fingerprint-based dedup)
create table if not exists conference_question_upvotes (
  id                uuid primary key default gen_random_uuid(),
  question_id       uuid not null references conference_questions(id) on delete cascade,
  voter_fingerprint text not null,
  created_at        timestamptz not null default now(),
  constraint unique_question_upvote unique (question_id, voter_fingerprint)
);

create index if not exists idx_question_upvotes_question_id on conference_question_upvotes(question_id);

-- Word cloud entries
create table if not exists conference_word_cloud (
  id                uuid primary key default gen_random_uuid(),
  word              text not null,
  voter_fingerprint text not null,
  created_at        timestamptz not null default now()
);

-- ============================================================
-- RLS Policies
-- ============================================================

alter table app_settings enable row level security;
alter table conference_polls enable row level security;
alter table conference_poll_votes enable row level security;
alter table conference_questions enable row level security;
alter table conference_question_upvotes enable row level security;
alter table conference_word_cloud enable row level security;

-- app_settings: public read, admin write (admin write handled by service role key)
create policy "app_settings_public_read" on app_settings
  for select using (true);

-- conference_polls: public read, admin manage via service role
create policy "conference_polls_public_read" on conference_polls
  for select using (true);

-- conference_poll_votes: public insert/read
create policy "conference_poll_votes_public_read" on conference_poll_votes
  for select using (true);

create policy "conference_poll_votes_public_insert" on conference_poll_votes
  for insert with check (true);

-- conference_questions: public insert, visible-only read
create policy "conference_questions_public_read" on conference_questions
  for select using (is_hidden = false);

create policy "conference_questions_public_insert" on conference_questions
  for insert with check (true);

-- conference_question_upvotes: public insert/read
create policy "conference_question_upvotes_public_read" on conference_question_upvotes
  for select using (true);

create policy "conference_question_upvotes_public_insert" on conference_question_upvotes
  for insert with check (true);

-- conference_word_cloud: public insert/read
create policy "conference_word_cloud_public_read" on conference_word_cloud
  for select using (true);

create policy "conference_word_cloud_public_insert" on conference_word_cloud
  for insert with check (true);

-- ============================================================
-- Realtime publication
-- ============================================================

alter publication supabase_realtime add table app_settings;
alter publication supabase_realtime add table conference_polls;
alter publication supabase_realtime add table conference_poll_votes;
alter publication supabase_realtime add table conference_questions;
alter publication supabase_realtime add table conference_question_upvotes;
alter publication supabase_realtime add table conference_word_cloud;
