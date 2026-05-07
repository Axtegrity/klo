import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { sendStrategyRoomConfirmation } from "@/lib/email";
import { strategyRegisterLimiter, checkLimit } from "@/lib/ratelimit";

// Subscription tier hierarchy — matches useSubscription.ts and /api/subscription
// "free" has no access to any paid sessions.
// "pro" can access pro-tier sessions.
// "executive" can access both pro and executive sessions.
const TIER_HIERARCHY: Record<string, number> = { free: 0, pro: 1, executive: 2 };

// Roles that bypass tier checks entirely (internal/admin accounts)
const BYPASS_ROLES = new Set(["owner", "admin"]);

function tierSatisfies(userTier: string, requiredTier: string): boolean {
  const userLevel = TIER_HIERARCHY[userTier] ?? 0;
  const requiredLevel = TIER_HIERARCHY[requiredTier] ?? 999;
  return userLevel >= requiredLevel;
}

// POST /api/strategy-rooms/[id]/register
// Registers the logged-in user for the session (slug-based [id]).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userSession = await getServerSession(authOptions);
    if (!userSession?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 10 strategy room registrations per hour per user
    const userId = (userSession.user as { id?: string }).id ?? userSession.user.email ?? "unknown";
    const { allowed } = await checkLimit(strategyRegisterLimiter, `strategy-reg:${userId}`);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { id: slug } = await params;
    const supabase = getServiceSupabase();

    // Fetch session
    const { data: stratSession, error: sessionError } = await supabase
      .from("strategy_sessions")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (sessionError) {
      console.error("[POST /api/strategy-rooms/[id]/register]", sessionError);
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    if (!stratSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Tier gate — server-side, using subscription_tier from the JWT (set by auth.ts
    // from profile.subscription_tier). Roles "owner" and "admin" bypass all tier gates.
    const userRole = (userSession.user as { role?: string }).role ?? "free";
    const userSubscriptionTier = (userSession.user as { subscriptionTier?: string }).subscriptionTier ?? "free";
    const sessionTier: string = stratSession.tier;

    if (!BYPASS_ROLES.has(userRole) && !tierSatisfies(userSubscriptionTier, sessionTier)) {
      return NextResponse.json(
        { error: "Upgrade required", requiredTier: sessionTier },
        { status: 403 }
      );
    }

    // Atomic seat check + insert via DB function (prevents TOCTOU race condition)
    const userEmail = userSession.user.email ?? "";
    const userName = userSession.user.name ?? null;

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "register_for_strategy_session",
      {
        p_session_id: stratSession.id,
        p_user_id: userId,
        p_user_email: userEmail,
        p_user_name: userName,
      }
    );

    if (rpcError) {
      console.error("[POST /api/strategy-rooms/[id]/register] rpc", rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    const result = rpcResult as { error?: string; success?: boolean; registered_count?: number };

    if (result?.error === "session_not_found") {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (result?.error === "session_full") {
      return NextResponse.json({ error: "Session is full" }, { status: 409 });
    }
    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Send confirmation email — fire and forget, never fail the request
    try {
      await sendStrategyRoomConfirmation({
        to: userEmail,
        name: userName,
        sessionTitle: stratSession.title,
        sessionDate: stratSession.date,
        sessionTime: stratSession.time,
        facilitator: stratSession.facilitator,
        tier: stratSession.tier as "pro" | "executive",
      });
    } catch (emailErr) {
      console.error("[POST /api/strategy-rooms/[id]/register] email", emailErr);
      // Intentionally not returning an error — email is best-effort
    }

    return NextResponse.json({ registered_count: result.registered_count ?? 0 });
  } catch (err) {
    console.error("[POST /api/strategy-rooms/[id]/register]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/strategy-rooms/[id]/register
// Cancels the logged-in user's registration.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userSession = await getServerSession(authOptions);
    if (!userSession?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: slug } = await params;
    const supabase = getServiceSupabase();

    // Fetch session
    const { data: stratSession, error: sessionError } = await supabase
      .from("strategy_sessions")
      .select("id")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (sessionError) {
      console.error("[DELETE /api/strategy-rooms/[id]/register]", sessionError);
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    if (!stratSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const userId = (userSession.user as { id?: string }).id ?? "";

    const { error: deleteError } = await supabase
      .from("strategy_registrations")
      .delete()
      .eq("session_id", stratSession.id)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("[DELETE /api/strategy-rooms/[id]/register] delete", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const { count: newCount } = await supabase
      .from("strategy_registrations")
      .select("*", { count: "exact", head: true })
      .eq("session_id", stratSession.id)
      .eq("status", "registered");

    return NextResponse.json({ registered_count: newCount ?? 0 });
  } catch (err) {
    console.error("[DELETE /api/strategy-rooms/[id]/register]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
