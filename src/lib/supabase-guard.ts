// Supabase prod-write guard.
//
// Vendored from ~/maven-tools/lib/supabase-guard/src/index.js. Keep in sync —
// that package owns the canonical implementation and the test suite. When
// the guard changes, copy src/index.js → here (translating to TS) and run
// the upstream tests at ~/maven-tools/lib/supabase-guard/test/ to confirm.
//
// What this solves
// ----------------
// KLO's .env.local points NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// at the prod Supabase project — same as Vercel. Any `bun run dev` session,
// admin UI click, test tool run, or seeder writes straight into production.
// The 2026-04-12 incident (Function Audit Headline mntushsc polluting the
// home page for ~36 hours) was one shape of this exposure.
//
// The guard wraps a Supabase client with a Proxy and throws on write
// operations (insert/update/upsert/delete, rpc, storage uploads) whenever
// dev is pointed at a non-dev URL. The guard is a true no-op when
// NODE_ENV === 'production', so the deployed app is unaffected.
//
// Precedence: production > ALLOW_PROD_MUTATIONS=1 > currentUrl === DEV_SUPABASE_URL > block.

import type { SupabaseClient } from "@supabase/supabase-js";

export interface GuardDetails {
  operation: string;
  resource: string;
  currentUrl: string;
  devUrl?: string;
}

export class ProdMutationError extends Error {
  readonly name = "ProdMutationError" as const;
  readonly details: GuardDetails;

  constructor(details: GuardDetails) {
    const { operation, resource, currentUrl, devUrl } = details;
    const lines = [
      `Blocked ${operation} on ${resource} — dev environment attempted to write to production Supabase.`,
      ``,
      `  Target URL:  ${currentUrl}`,
      devUrl
        ? `  Dev URL:     ${devUrl} (from DEV_SUPABASE_URL)`
        : `  Dev URL:     <not configured — set DEV_SUPABASE_URL in .env.local>`,
      ``,
      `To proceed, one of:`,
      `  1. Point NEXT_PUBLIC_SUPABASE_URL at a dedicated dev Supabase project (preferred)`,
      `  2. Set ALLOW_PROD_MUTATIONS=1 for this session (escape hatch — leaves an audit trail)`,
    ];
    super(lines.join("\n"));
    this.details = details;
  }
}

export interface GuardOptions {
  currentUrl: string;
  devUrl?: string;
  allowMutations?: boolean;
  nodeEnv: string;
  readOnlyRpc?: string[];
  onBlock?: (error: ProdMutationError) => void;
}

export interface GuardDecision {
  allow: boolean;
  reason:
    | "node_env_production"
    | "allow_prod_mutations_flag"
    | "current_url_matches_dev_url"
    | "would_write_to_non_dev_url";
}

export function decide(opts: Omit<GuardOptions, "readOnlyRpc" | "onBlock">): GuardDecision {
  if (opts.nodeEnv === "production") return { allow: true, reason: "node_env_production" };
  if (opts.allowMutations) return { allow: true, reason: "allow_prod_mutations_flag" };
  if (opts.devUrl && opts.currentUrl && opts.currentUrl === opts.devUrl) {
    return { allow: true, reason: "current_url_matches_dev_url" };
  }
  return { allow: false, reason: "would_write_to_non_dev_url" };
}

const WRITE_METHODS_FROM = new Set(["insert", "update", "upsert", "delete"]);
const WRITE_METHODS_STORAGE = new Set([
  "upload",
  "remove",
  "move",
  "copy",
  "createSignedUploadUrl",
  "uploadToSignedUrl",
]);

/**
 * Wrap a Supabase client so write operations throw in dev when pointed at a
 * non-dev database. Returns the client unchanged when writes are allowed —
 * zero runtime overhead for the common production path.
 */
export function guardSupabase<T extends SupabaseClient>(client: T, options: GuardOptions): T {
  const decision = decide(options);
  if (decision.allow) return client;

  const readOnlyRpc = new Set(options.readOnlyRpc ?? []);
  const { currentUrl, devUrl, onBlock } = options;

  const raise = (operation: string, resource: string): never => {
    const err = new ProdMutationError({ operation, resource, currentUrl, devUrl });
    if (onBlock) {
      try {
        onBlock(err);
      } catch {
        /* never let logging break the throw */
      }
    }
    throw err;
  };

  const guardFromBuilder = (builder: unknown, table: string): unknown =>
    new Proxy(builder as object, {
      get(target, prop, receiver) {
        if (typeof prop === "string" && WRITE_METHODS_FROM.has(prop)) {
          return () => raise(prop, `from("${table}")`);
        }
        const value = Reflect.get(target, prop, receiver);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });

  const guardStorageBucket = (bucket: unknown, name: string): unknown =>
    new Proxy(bucket as object, {
      get(target, prop, receiver) {
        if (typeof prop === "string" && WRITE_METHODS_STORAGE.has(prop)) {
          return () => raise(prop, `storage.from("${name}")`);
        }
        const value = Reflect.get(target, prop, receiver);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });

  const guardedStorage = client.storage
    ? new Proxy(client.storage as object, {
        get(target, prop, receiver) {
          if (prop === "from") {
            return (name: string) =>
              guardStorageBucket((target as { from: (n: string) => unknown }).from(name), name);
          }
          const value = Reflect.get(target, prop, receiver);
          return typeof value === "function" ? value.bind(target) : value;
        },
      })
    : client.storage;

  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === "from") {
        return (table: string) =>
          guardFromBuilder((target as { from: (t: string) => unknown }).from(table), table);
      }
      if (prop === "rpc") {
        return (name: string, ...args: unknown[]) => {
          if (readOnlyRpc.has(name)) {
            return (target as { rpc: (n: string, ...a: unknown[]) => unknown }).rpc(name, ...args);
          }
          return raise("rpc", `rpc("${name}")`);
        };
      }
      if (prop === "storage") {
        return guardedStorage;
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  }) as T;
}

/**
 * Build GuardOptions from process.env. Centralized so every caller gets the
 * same environment-derived config and logs the same boot-time summary.
 */
export function guardOptionsFromEnv(): GuardOptions {
  const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const devUrl = process.env.DEV_SUPABASE_URL || undefined;
  const allowMutations = process.env.ALLOW_PROD_MUTATIONS === "1";
  const nodeEnv = process.env.NODE_ENV ?? "development";

  return {
    currentUrl,
    devUrl,
    allowMutations,
    nodeEnv,
    onBlock: (err) => {
      // Log before throwing so the server log has a clear breadcrumb even
      // when the error bubbles up into a 500 page or API response.
      console.error("[supabase-guard]", err.message);
    },
  };
}
