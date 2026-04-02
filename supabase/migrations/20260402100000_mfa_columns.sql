-- Add TOTP-based MFA columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_enabled boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_secret text;           -- AES-256-GCM encrypted TOTP secret
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_backup_codes text[];   -- bcrypt-hashed one-time recovery codes
