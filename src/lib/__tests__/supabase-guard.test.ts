// Integration regression test for the 2026-04-12 incident.
//
// What happened: function-audit wrote "Function Audit Headline mntushsc" to
// page_configs.home.hero_config via /api/admin/creative-studio/pages/home
// while pointed at prod Supabase, and left it there for ~36 hours.
//
// What this test guards: running a service-role .update() on page_configs
// from a dev environment (NODE_ENV !== "production") where the current
// Supabase URL is NOT the configured DEV_SUPABASE_URL must throw a
// ProdMutationError before any network call is made.
//
// This test stays green even without a dev DB provisioned — it exercises
// the guard's decide() + Proxy logic directly, not a live connection.

import { describe, it, expect } from "vitest";
import { guardSupabase, ProdMutationError, decide } from "@/lib/supabase-guard";
import type { SupabaseClient } from "@supabase/supabase-js";

// Fake client shaped like @supabase/supabase-js — records every call so we
// can assert nothing escaped the guard.
function makeFakeClient() {
  const calls: unknown[][] = [];
  const fake = {
    from: (table: string) => ({
      select: (...args: unknown[]) => {
        calls.push(["select", table, args]);
        return { data: [], error: null };
      },
      update: (...args: unknown[]) => {
        calls.push(["update", table, args]);
        return { data: null, error: null };
      },
      insert: (...args: unknown[]) => {
        calls.push(["insert", table, args]);
        return { data: null, error: null };
      },
    }),
    rpc: (name: string, params: unknown) => {
      calls.push(["rpc", name, params]);
      return { data: null, error: null };
    },
  } as unknown as SupabaseClient;
  return { fake, calls };
}

describe("supabase-guard integration (KLO)", () => {
  it("regression: dev + prod URL + no flag = update on page_configs throws, no network call", () => {
    const { fake, calls } = makeFakeClient();
    const guarded = guardSupabase(fake, {
      currentUrl: "https://vlaccbbmwhpimorvvefh.supabase.co",
      nodeEnv: "development",
    });

    expect(() =>
      guarded.from("page_configs").update({ hero_config: { headline: "nope" } })
    ).toThrow(ProdMutationError);

    // Nothing escaped to the fake client.
    expect(calls).toEqual([]);
  });

  it("allows reads even when guard is active (admin dashboard must still function)", () => {
    const { fake, calls } = makeFakeClient();
    const guarded = guardSupabase(fake, {
      currentUrl: "https://vlaccbbmwhpimorvvefh.supabase.co",
      nodeEnv: "development",
    });

    guarded.from("page_configs").select("*");
    expect(calls).toEqual([["select", "page_configs", ["*"]]]);
  });

  it("allows writes when ALLOW_PROD_MUTATIONS=1 equivalent is set", () => {
    const { fake, calls } = makeFakeClient();
    const guarded = guardSupabase(fake, {
      currentUrl: "https://vlaccbbmwhpimorvvefh.supabase.co",
      nodeEnv: "development",
      allowMutations: true,
    });

    guarded.from("page_configs").update({ hero_config: null });
    expect(calls).toEqual([["update", "page_configs", [{ hero_config: null }]]]);
  });

  it("is a true no-op in production — guarded client is the same reference", () => {
    const { fake } = makeFakeClient();
    const guarded = guardSupabase(fake, {
      currentUrl: "https://vlaccbbmwhpimorvvefh.supabase.co",
      nodeEnv: "production",
    });
    expect(guarded).toBe(fake);
  });

  it("decide() returns the expected reason codes for every branch", () => {
    expect(
      decide({ currentUrl: "x", nodeEnv: "production" })
    ).toEqual({ allow: true, reason: "node_env_production" });

    expect(
      decide({ currentUrl: "x", nodeEnv: "development", allowMutations: true })
    ).toEqual({ allow: true, reason: "allow_prod_mutations_flag" });

    expect(
      decide({ currentUrl: "https://dev.x", devUrl: "https://dev.x", nodeEnv: "development" })
    ).toEqual({ allow: true, reason: "current_url_matches_dev_url" });

    expect(
      decide({ currentUrl: "https://prod.x", devUrl: "https://dev.x", nodeEnv: "development" })
    ).toEqual({ allow: false, reason: "would_write_to_non_dev_url" });
  });
});
