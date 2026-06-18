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

  const userId = (session.user as { id?: string }).id;
  const appRole = (session.user as { role?: string }).role;
  const supabase = getServiceSupabase();

  // Admins and moderators: return the currently live event
  if (appRole === "owner" || appRole === "admin" || appRole === "moderator") {
    const { data: event } = await supabase
      .from("event_presentations")
      .select("id, title, seminar_mode")
      .eq("seminar_mode", true)
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ event: event ?? null });
  }

  // Hosts: return their assigned event only if it is currently live
  if (userId) {
    const { data: hostRole } = await supabase
      .from("conference_user_roles")
      .select("event_id")
      .eq("user_id", userId)
      .eq("role", "host")
      .not("event_id", "is", null)
      .limit(1)
      .maybeSingle();

    if (hostRole?.event_id) {
      const { data: event } = await supabase
        .from("event_presentations")
        .select("id, title, seminar_mode")
        .eq("id", hostRole.event_id)
        .eq("seminar_mode", true)
        .maybeSingle();

      return NextResponse.json({ event: event ?? null });
    }
  }

  return NextResponse.json({ event: null });
}
