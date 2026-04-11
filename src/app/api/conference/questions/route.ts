import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyConferenceRole } from "@/lib/conference-auth";
import { questionSubmitSchema } from "@/lib/validation";

function getFingerprint(req: Request): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  return createHash("sha256").update(`${ip}:${ua}`).digest("hex");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isAdminRequest = searchParams.get("admin") === "true";
  const sessionId = searchParams.get("session_id");
  const eventId = searchParams.get("event_id");
  const showArchived = searchParams.get("archived") === "true";

  // Check if caller is admin/moderator
  let isPrivileged = false;
  if (isAdminRequest || showArchived) {
    const auth = await verifyConferenceRole(["admin", "moderator"]);
    isPrivileged = !!auth;
  }

  const supabase = getServiceSupabase();
  let query = supabase
    .from("conference_questions")
    .select("*")
    .order("likes", { ascending: false })
    .order("upvotes", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  // Filter by event or session
  if (eventId) {
    query = query.eq("event_id", eventId);
  } else if (sessionId) {
    query = query.eq("session_id", sessionId);
  }

  // Non-privileged users: hide hidden questions, hide archived, only show released
  // Also verify parent session is active (if question belongs to a session)
  if (!isPrivileged) {
    query = query.eq("is_hidden", false).is("archived_at", null).eq("released", true);

    // Filter out questions from inactive sessions
    if (sessionId) {
      const { data: sess } = await supabase
        .from("conference_sessions")
        .select("is_active")
        .eq("id", sessionId)
        .single();
      if (!sess?.is_active) {
        return NextResponse.json([]);
      }
    }
  } else if (showArchived) {
    // Admin requesting archived only
    query = query.not("archived_at", "is", null);
  } else if (!isAdminRequest) {
    // Regular request: exclude archived
    query = query.is("archived_at", null);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=2, stale-while-revalidate=5" },
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = questionSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Question text required" }, { status: 400 });
  }
  const { text, author_name, session_id } = parsed.data;

  const fingerprint = getFingerprint(request);
  const supabase = getServiceSupabase();

  // Rate limit: max 3 submissions per fingerprint per 60 seconds
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count: recentCount, error: rlError } = await supabase
    .from("conference_questions")
    .select("*", { count: "exact", head: true })
    .eq("fingerprint", fingerprint)
    .gte("created_at", oneMinuteAgo);

  if (rlError) {
    return NextResponse.json({ error: "Rate limit check failed" }, { status: 500 });
  }

  if ((recentCount ?? 0) >= 3) {
    return NextResponse.json(
      { error: "Please wait before submitting another question." },
      { status: 429 }
    );
  }

  // Use profanity-checking RPC
  const { data, error } = await supabase.rpc("submit_conference_question", {
    p_text: text.trim(),
    p_author_name: author_name?.trim() || "Anonymous",
    p_session_id: session_id || null,
    p_fingerprint: fingerprint,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // data is the jsonb result from the function
  const result = data as { ok: boolean; reason?: string; flagged?: string[] };

  if (!result.ok) {
    return NextResponse.json(
      { error: "Content blocked", reason: result.reason, flagged: result.flagged },
      { status: 422 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
