import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { logError, logRequest } from "@/lib/logger";

const optInEventSchema = z.object({
  action: z.enum(["prompt_shown", "enabled", "declined", "dismissed", "ios_install_shown"]),
  platform: z.string().min(1).max(50),
  userAgent: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  logRequest(request);
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = optInEventSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { action, platform, userAgent } = parsed.data;
  const userId = (session.user as { id?: string }).id ?? null;

  const supabase = getServiceSupabase();
  const { error } = await supabase.from("push_optin_events").insert({
    user_id: userId,
    action,
    platform,
    user_agent: userAgent || request.headers.get("user-agent") || null,
  });

  if (error) {
    logError(error, { endpoint: "/api/push/optin-event" });
    return NextResponse.json({ error: "Failed to log event" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  // Return the current user's decision state so the client can decide
  // whether to show the banner without re-triggering the permission flow.
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ decision: null, lastDismissedAt: null });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("push_optin_events")
    .select("action, created_at")
    .eq("user_id", userId)
    .in("action", ["enabled", "declined", "dismissed"])
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ decision: null, lastDismissedAt: null });
  }

  const rows = data ?? [];
  const enabled = rows.find((r) => r.action === "enabled");
  const declined = rows.find((r) => r.action === "declined");
  const dismissed = rows.find((r) => r.action === "dismissed");

  // Hard decisions win over soft dismissals.
  let decision: "enabled" | "declined" | null = null;
  if (enabled && declined) {
    decision = new Date(enabled.created_at) > new Date(declined.created_at) ? "enabled" : "declined";
  } else if (enabled) {
    decision = "enabled";
  } else if (declined) {
    decision = "declined";
  }

  return NextResponse.json({
    decision,
    lastDismissedAt: dismissed?.created_at ?? null,
  });
}
