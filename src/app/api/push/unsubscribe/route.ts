import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { pushUnsubscribeSchema } from "@/lib/validation";
import { logError, logRequest } from "@/lib/logger";

export async function DELETE(request: NextRequest) {
  logRequest(request);
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await request.json();
    const parsed = pushUnsubscribeSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "token is required" }, { status: 400 });
    }
    const { token } = parsed.data;

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
      logError(error, { endpoint: '/api/push/unsubscribe' });
      return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
