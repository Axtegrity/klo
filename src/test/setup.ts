/**
 * Global test setup — runs before every test file.
 *
 * Sets the minimum env vars that route handlers check for at module
 * load time (Supabase client factory, Upstash, NextAuth secret).
 * Real network calls are suppressed via vi.mock() in each test file.
 */

process.env.NEXTAUTH_SECRET = "test-secret-at-least-32-chars-long!";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
// No UPSTASH env vars intentionally → ratelimit falls back to allow-all (null limiter)
