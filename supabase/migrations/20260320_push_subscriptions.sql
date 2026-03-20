-- Push notification subscriptions (web push + native device tokens)
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 'web' for Web Push API, 'ios' for APNs, 'android' for FCM
  platform text not null check (platform in ('web', 'ios', 'android')),
  -- For web: JSON-stringified PushSubscription object
  -- For native: device token string
  token text not null,
  -- User agent for debugging
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Prevent duplicate subscriptions
  unique (user_id, token)
);

-- Index for fast lookups when broadcasting
create index if not exists idx_push_subscriptions_user_id on push_subscriptions(user_id);
create index if not exists idx_push_subscriptions_platform on push_subscriptions(platform);

-- RLS policies
alter table push_subscriptions enable row level security;

-- Users can manage their own subscriptions
create policy "Users can insert own subscriptions"
  on push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can view own subscriptions"
  on push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can delete own subscriptions"
  on push_subscriptions for delete
  using (auth.uid() = user_id);

-- Service role can do everything (for admin broadcast)
-- (service role bypasses RLS by default)
