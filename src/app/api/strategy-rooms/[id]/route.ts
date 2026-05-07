import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

// GET /api/strategy-rooms/[id]
// [id] is the slug. Public. Returns session with registered_count.
// If user is logged in, also returns is_registered.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: slug } = await params;
    const supabase = getServiceSupabase();

    const { data: session, error } = await supabase
      .from("strategy_sessions")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (error) {
      console.error("[GET /api/strategy-rooms/[id]]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Compute registered_count
    const { count: registeredCount } = await supabase
      .from("strategy_registrations")
      .select("*", { count: "exact", head: true })
      .eq("session_id", session.id)
      .eq("status", "registered");

    // Check if current user is registered
    let isRegistered = false;
    try {
      const userSession = await getServerSession(authOptions);
      if (userSession?.user) {
        const userId = (userSession.user as { id?: string }).id;
        if (userId) {
          const { data: reg } = await supabase
            .from("strategy_registrations")
            .select("id")
            .eq("session_id", session.id)
            .eq("user_id", userId)
            .maybeSingle();
          isRegistered = !!reg;
        }
      }
    } catch {
      // Not logged in — is_registered stays false
    }

    return NextResponse.json({
      data: {
        ...session,
        registered_count: registeredCount ?? 0,
        is_registered: isRegistered,
      },
    });
  } catch (err) {
    console.error("[GET /api/strategy-rooms/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
