import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "token is required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const userId = (session.user as { id?: string }).id;

    // For web push, token could be the endpoint or the full subscription JSON
    const tokenValue = typeof token === "object" ? JSON.stringify(token) : token;

    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("token", tokenValue);

    if (error) {
      console.error("[Push Unsubscribe] Error:", error);
      return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
