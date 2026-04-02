-- Add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_type text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team_size text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_failed boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_failed_at timestamptz;

-- Also drop the FK constraint on id->auth.users if it exists,
-- so credential accounts with hardcoded UUIDs can have profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
