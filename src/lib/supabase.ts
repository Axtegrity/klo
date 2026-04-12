import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { guardSupabase, guardOptionsFromEnv, decide } from "./supabase-guard";

/* ------------------------------------------------------------------ */
/*  Database type definitions                                          */
/* ------------------------------------------------------------------ */

export interface Profile {
  id: string;
  full_name: string | null;
  organization_name: string | null;
  organization_type: string | null;
  industry: string | null;
  team_size: string | null;
  subscription_tier: string;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssessmentResult {
  id: string;
  user_id: string;
  assessment_type: string;
  score: number;
  answers: Record<string, unknown>;
  recommendations: string[];
  created_at: string;
}

export interface VaultContent {
  id: string;
  title: string;
  slug: string;
  content_type: string;
  category: string;
  body: string;
  excerpt: string | null;
  tier_required: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface StrategyRoom {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  participants: string[];
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  tier: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  platform: "web" | "ios" | "android";
  token: string;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile };
      assessment_results: { Row: AssessmentResult };
      vault_content: { Row: VaultContent };
      strategy_rooms: { Row: StrategyRoom };
      subscriptions: { Row: Subscription };
      push_subscriptions: { Row: PushSubscription };
    };
  };
}

/* ------------------------------------------------------------------ */
/*  Browser client (public anon key)                                   */
/* ------------------------------------------------------------------ */

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.");
    }
    _supabase = guardSupabase(createClient(url, key), guardOptionsFromEnv());
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/* ------------------------------------------------------------------ */
/*  Server-side admin client (service role key)                        */
/* ------------------------------------------------------------------ */

let _serviceSupabase: SupabaseClient | null = null;

export function getServiceSupabase(): SupabaseClient {
  if (!_serviceSupabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. This function can only be called on the server."
      );
    }

    const raw = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Guard the service-role client against accidental prod mutations from
    // dev sessions. The guard is a no-op when NODE_ENV=production, so the
    // deployed app is unaffected. See src/lib/supabase-guard.ts for the
    // precedence rules. The boot log below makes the current mode visible
    // every time dev starts — if you see "mode=guard-active" and didn't
    // expect it, you're about to have writes rejected.
    const guardOpts = guardOptionsFromEnv();
    const guardDecision = decide(guardOpts);
    if (guardOpts.nodeEnv !== "production") {
      console.log(
        `[supabase-guard] mode=${guardDecision.allow ? "pass-through" : "guard-active"} ` +
          `reason=${guardDecision.reason} url=${guardOpts.currentUrl}`
      );
    }
    _serviceSupabase = guardSupabase(raw, guardOpts);
  }
  return _serviceSupabase;
}
