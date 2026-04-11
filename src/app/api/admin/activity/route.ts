import { NextResponse } from "next/server";
import { verifyCreativeStudioAdmin as verifyAdmin } from "@/lib/creative-studio-auth";
import { getServiceSupabase } from "@/lib/supabase";
import type { AdminActivityData, AdminTimeSeriesPoint } from "@/types";

export const dynamic = "force-dynamic";

function getLast30Days(): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function bucketByDate(
  rows: { created_at: string }[],
  days: string[]
): AdminTimeSeriesPoint[] {
  const counts: Record<string, number> = {};
  for (const day of days) counts[day] = 0;

  for (const row of rows) {
    const day = row.created_at.split("T")[0];
    if (day in counts) counts[day]++;
  }

  return days.map((date) => ({ date, count: counts[date] }));
}

export async function GET() {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const days = getLast30Days();
  const thirtyDaysAgo = days[0] + "T00:00:00.000Z";

  const [signupsRes, advisorRes, assessmentsRes, subscriptionsRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true }),
      supabase
        .from("advisor_usage")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true }),
      supabase
        .from("assessment_results")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true }),
      supabase
        .from("subscriptions")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true }),
    ]);

  const activity: AdminActivityData = {
    signups: bucketByDate(signupsRes.data ?? [], days),
    advisorUsage: bucketByDate(advisorRes.data ?? [], days),
    assessments: bucketByDate(assessmentsRes.data ?? [], days),
    subscriptionConversions: bucketByDate(subscriptionsRes.data ?? [], days),
  };

  return NextResponse.json(activity);
}
