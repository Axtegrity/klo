import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getServiceSupabase } from "@/lib/supabase";

function getFingerprint(req: Request): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  return createHash("sha256").update(`${ip}:${ua}`).digest("hex");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceSupabase();

  // Anonymous fingerprint upvote — all users use this path.
  // Authenticated likes use the separate /like endpoint.
  const fingerprint = getFingerprint(request);

  const { error: upvoteError } = await supabase
    .from("conference_question_upvotes")
    .insert({ question_id: id, voter_fingerprint: fingerprint });

  if (upvoteError) {
    if (upvoteError.code === "23505") {
      return NextResponse.json({ error: "Already upvoted" }, { status: 409 });
    }
    return NextResponse.json({ error: upvoteError.message }, { status: 500 });
  }

  // Atomic increment via RPC
  await supabase.rpc("increment_question_upvotes", { question_id: id });

  return NextResponse.json({ success: true, type: "upvote" }, { status: 201 });
}
