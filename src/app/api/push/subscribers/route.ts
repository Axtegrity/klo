import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getServiceSupabase();

  // Get subscriptions joined with profile names
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, platform, user_agent, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get user names for each unique user_id
  const userIds = [...new Set((subs || []).map((s) => s.user_id))];
  let profileMap: Record<string, { full_name: string | null; email?: string }> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    if (profiles) {
      profileMap = Object.fromEntries(
        profiles.map((p) => [p.id, { full_name: p.full_name }])
      );
    }
  }

  const subscribers = (subs || []).map((s) => ({
    ...s,
    user_name: profileMap[s.user_id]?.full_name || null,
    user_email: profileMap[s.user_id]?.email || null,
  }));

  // Stats
  const stats = {
    total: subscribers.length,
    web: subscribers.filter((s) => s.platform === "web").length,
    ios: subscribers.filter((s) => s.platform === "ios").length,
    android: subscribers.filter((s) => s.platform === "android").length,
  };

  return NextResponse.json({ subscribers, stats });
}
