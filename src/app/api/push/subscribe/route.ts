import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { pushSubscribeSchema } from "@/lib/validation";
import { logError, logRequest } from "@/lib/logger";

export async function POST(request: NextRequest) {
  logRequest(request);
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await request.json();
    const parsed = pushSubscribeSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "platform and token are required" },
        { status: 400 }
      );
    }
    const { platform, token, userAgent } = parsed.data;

    // For web push, token is a JSON-stringified PushSubscription
    const tokenValue = platform === "web" ? JSON.stringify(token) : token;

    const supabase = getServiceSupabase();
    const userId = (session.user as { id?: string }).id;

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        platform,
        token: tokenValue,
        user_agent: userAgent || request.headers.get("user-agent") || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,token" }
    );

    if (error) {
      logError(error, { endpoint: '/api/push/subscribe' });
      return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
