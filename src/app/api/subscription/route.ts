import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/*  GET /api/subscription                                               */
/*  Returns the authenticated user's subscription tier from Supabase.   */
/* ------------------------------------------------------------------ */

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const userId = (session.user as { id?: string }).id;
  const userRole = (session.user as { role?: string }).role;

  // Admin and owner roles always get executive access
  if (userRole === "admin" || userRole === "owner") {
    return NextResponse.json({ tier: "executive" });
  }

  if (!userId) {
    return NextResponse.json({ tier: "free" });
  }

  try {
    const supabase = getServiceSupabase();
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .single();

    return NextResponse.json({
      tier: profile?.subscription_tier ?? "free",
    });
  } catch {
    return NextResponse.json({ tier: "free" });
  }
}
