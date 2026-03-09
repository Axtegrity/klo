import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import type { AdminDashboardStats } from "@/types";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) return null;
  return session;
}

export async function GET() {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Run queries in parallel
  const [
    profilesRes,
    newUsers7Res,
    newUsers30Res,
    subscriptionsRes,
    advisorRes,
    assessmentsRes,
    strategyRoomsRes,
    vaultRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id, role"),
    supabase.from("profiles").select("id").gte("created_at", sevenDaysAgo),
    supabase.from("profiles").select("id").gte("created_at", thirtyDaysAgo),
    supabase.from("subscriptions").select("tier, status"),
    supabase.from("advisor_usage").select("message_count, tokens_used"),
    supabase.from("assessment_results").select("assessment_type"),
    supabase.from("strategy_rooms").select("is_active"),
    supabase.from("vault_content").select("content_type, tier_required"),
  ]);

  // Users — all free for now (no tiers)
  const profiles = profilesRes.data ?? [];
  const byTier = { free: profiles.length, pro: 0, executive: 0 };

  // Subscriptions — not active yet
  const subs = (subscriptionsRes.data ?? []).filter((s) => s.status === "active");
  const mrr = 0;

  // Advisor stats
  const advisorData = advisorRes.data ?? [];
  const totalMessages = advisorData.reduce((sum, a) => sum + (a.message_count ?? 0), 0);
  const totalTokens = advisorData.reduce((sum, a) => sum + (a.tokens_used ?? 0), 0);
  const uniqueAdvisorUsers = new Set(advisorData.map(() => "user")).size;

  // Assessments by type
  const assessmentData = assessmentsRes.data ?? [];
  const assessmentsByType: Record<string, number> = {};
  for (const a of assessmentData) {
    assessmentsByType[a.assessment_type] = (assessmentsByType[a.assessment_type] ?? 0) + 1;
  }

  // Strategy rooms
  const roomData = strategyRoomsRes.data ?? [];
  const activeRooms = roomData.filter((r) => r.is_active).length;

  // Vault content
  const vaultData = vaultRes.data ?? [];
  const vaultByType: Record<string, number> = {};
  const vaultByTier: Record<string, number> = {};
  for (const v of vaultData) {
    vaultByType[v.content_type] = (vaultByType[v.content_type] ?? 0) + 1;
    vaultByTier[v.tier_required] = (vaultByTier[v.tier_required] ?? 0) + 1;
  }

  const stats: AdminDashboardStats = {
    users: {
      total: profiles.length,
      newLast7Days: newUsers7Res.data?.length ?? 0,
      newLast30Days: newUsers30Res.data?.length ?? 0,
      byTier,
    },
    subscriptions: {
      total: subs.length,
      mrr,
    },
    advisor: {
      totalMessages,
      totalTokens,
      avgPerUser: uniqueAdvisorUsers > 0 ? Math.round(totalMessages / uniqueAdvisorUsers) : 0,
    },
    assessments: {
      totalCompleted: assessmentData.length,
      byType: assessmentsByType,
    },
    strategyRooms: {
      activeRooms,
    },
    vault: {
      totalContent: vaultData.length,
      byType: vaultByType,
      byTier: vaultByTier,
    },
  };

  return NextResponse.json(stats);
}
