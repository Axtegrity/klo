// Rejects client-supplied identifier values that use reserved test prefixes
// when running in production. Prevents automated probes (e.g. Maven audit
// agents, stray curl requests) from inserting synthetic rows into prod
// analytics tables.
//
// Scope: apply to anonymous-write endpoints that persist a client-provided
// identifier (fingerprint, submitter email, handle). Do NOT apply to:
//   - Authenticated endpoints (session check is sufficient)
//   - Webhook receivers with HMAC signatures (maven/webhook, stripe/webhook)
//   - Free-text content fields (comments, messages) — real users legitimately
//     type "test" in those.

const RESERVED_PREFIXES = ["test-", "maven-", "quill-", "audit-"] as const;

function isProductionEnv(): boolean {
  // Vercel sets VERCEL_ENV to "production" only on main-branch deploys.
  // Preview and local default through to allowing reserved prefixes so the
  // guard itself can be exercised in CI and preview URLs.
  return process.env.VERCEL_ENV === "production";
}

export function hasReservedTestPrefix(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = value.toLowerCase();
  return RESERVED_PREFIXES.some((p) => v.startsWith(p));
}

// Returns true when the given identifier should be rejected in this environment.
// Always returns false outside production so tests and preview probes work.
export function shouldRejectTestIdentifier(value: string | null | undefined): boolean {
  if (!isProductionEnv()) return false;
  return hasReservedTestPrefix(value);
}

export const __RESERVED_PREFIXES_FOR_TESTS = RESERVED_PREFIXES;
