-- Push opt-in funnel + send audit
-- Additive: never alters existing tables.

-- ---------------------------------------------------------------
-- push_optin_events: every time we show/accept/decline/dismiss
-- the push opt-in prompt for a user. Lets admins see conversion
-- and prevents re-nagging users who've explicitly declined.
-- ---------------------------------------------------------------
create table if not exists push_optin_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  -- prompt_shown: banner rendered
  -- enabled: user tapped Enable AND permission was granted AND subscription persisted
  -- declined: user tapped "No thanks" (hard no — don't re-prompt)
  -- dismissed: user closed the banner without a decision (soft — re-surface after 7d)
  -- ios_install_shown: iOS Safari non-standalone — shown the "Add to Home Screen" modal instead
  action text not null check (action in ('prompt_shown','enabled','declined','dismissed','ios_install_shown')),
  -- 'web' | 'ios' | 'android' | 'ios-safari'
  platform text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_optin_events_user_id on push_optin_events(user_id);
create index if not exists idx_push_optin_events_action on push_optin_events(action);
create index if not exists idx_push_optin_events_created_at on push_optin_events(created_at desc);

alter table push_optin_events enable row level security;

-- Service role writes everything (routes use service client); user can read their own.
create policy "Users read own optin events"
  on push_optin_events for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- notifications_sent: audit row for every /api/notify/send call.
-- One row per send (not per recipient) so we can see history.
-- ---------------------------------------------------------------
create table if not exists notifications_sent (
  id uuid primary key default gen_random_uuid(),
  sent_by uuid references profiles(id) on delete set null,
  title text not null,
  body text not null,
  url text,
  tag text,
  -- 'broadcast' | 'user' | 'users'
  audience_type text not null check (audience_type in ('broadcast','user','users')),
  -- For single-user / list targets, snapshot of who was addressed.
  target_user_ids uuid[],
  total_targets integer not null default 0,
  push_sent integer not null default 0,
  push_failed integer not null default 0,
  push_cleaned integer not null default 0,
  email_sent integer not null default 0,
  email_failed integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_sent_created_at on notifications_sent(created_at desc);
create index if not exists idx_notifications_sent_sent_by on notifications_sent(sent_by);

alter table notifications_sent enable row level security;

-- Only admins/owners will ever read this; route uses service client.
-- No user-facing select policy by design.
