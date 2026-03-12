import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Upstash-backed rate limiters for API endpoints.
 *
 * Requires env vars:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * Falls back to a no-op (always allows) if env vars are missing,
 * so the app still works in development without Upstash.
 */

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

function createLimiter(
  prefix: string,
  requests: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1]
) {
  if (!hasUpstash) return null;
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `ratelimit:${prefix}`,
  });
}

// ── Limiters per endpoint ──────────────────────────────────
// Register: 5 per minute (brute-force protection)
export const registerLimiter = createLimiter("register", 5, "1 m");

// Contact form: 3 per hour (spam protection)
export const contactLimiter = createLimiter("contact", 3, "1 h");

// AI Advisor: 30 per hour (cost protection)
export const advisorLimiter = createLimiter("advisor", 30, "1 h");

// Maven webhook: 10 per minute (abuse protection)
export const mavenWebhookLimiter = createLimiter("maven-webhook", 10, "1 m");

// ── Helper ─────────────────────────────────────────────────

export async function checkLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ allowed: boolean; remaining: number }> {
  if (!limiter) {
    // Upstash not configured — allow all (dev mode)
    return { allowed: true, remaining: 999 };
  }
  const result = await limiter.limit(identifier);
  return { allowed: result.success, remaining: result.remaining };
}

/**
 * Extract client IP from request headers (works on Vercel).
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
