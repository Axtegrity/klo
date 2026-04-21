import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyCreativeStudioAdmin } from "@/lib/creative-studio-auth";

export const dynamic = "force-dynamic";

type Channel = "push" | "email" | "both" | "none";

export async function GET() {
  const session = await verifyCreativeStudioAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();

  const [profilesRes, subsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("push_subscriptions")
      .select("user_id, platform"),
  ]);

  if (profilesRes.error) {
    return NextResponse.json({ error: profilesRes.error.message }, { status: 500 });
  }
  if (subsRes.error) {
    return NextResponse.json({ error: subsRes.error.message }, { status: 500 });
  }

  const platformsByUser = new Map<string, Set<string>>();
  for (const sub of subsRes.data ?? []) {
    const set = platformsByUser.get(sub.user_id) ?? new Set<string>();
    set.add(sub.platform);
    platformsByUser.set(sub.user_id, set);
  }

  const users = (profilesRes.data ?? []).map((p) => {
    const platforms = Array.from(platformsByUser.get(p.id) ?? []);
    const hasPush = platforms.length > 0;
    const hasEmail = !!p.email;
    const channel: Channel = hasPush && hasEmail
      ? "both"
      : hasPush
        ? "push"
        : hasEmail
          ? "email"
          : "none";
    return {
      id: p.id,
      name: p.full_name ?? null,
      email: p.email ?? null,
      platforms,
      channel,
      created_at: p.created_at,
    };
  });

  const stats = {
    total: users.length,
    push: users.filter((u) => u.channel === "push" || u.channel === "both").length,
    email: users.filter((u) => u.channel === "email" || u.channel === "both").length,
    web: (subsRes.data ?? []).filter((s) => s.platform === "web").length,
    ios: (subsRes.data ?? []).filter((s) => s.platform === "ios").length,
    android: (subsRes.data ?? []).filter((s) => s.platform === "android").length,
  };

  return NextResponse.json({ users, stats });
}
