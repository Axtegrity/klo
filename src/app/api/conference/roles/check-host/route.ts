import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ isHost: false });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ isHost: false });
  }

  const supabase = getServiceSupabase();

  // Check if user has host role scoped to any event with seminar_mode active
  const { data } = await supabase
    .from("conference_user_roles")
    .select("id, event_id")
    .eq("user_id", userId)
    .eq("role", "host")
    .not("event_id", "is", null)
    .limit(1)
    .maybeSingle();

  if (!data?.event_id) {
    return NextResponse.json({ isHost: false });
  }

  // Verify the event is currently live
  const { data: event } = await supabase
    .from("event_presentations")
    .select("id")
    .eq("id", data.event_id)
    .eq("seminar_mode", true)
    .maybeSingle();

  return NextResponse.json({ isHost: !!event });
}
