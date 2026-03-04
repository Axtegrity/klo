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
  const body = await request.json();
  const { option_index } = body;

  if (typeof option_index !== "number" || option_index < 0) {
    return NextResponse.json({ error: "Valid option_index required" }, { status: 400 });
  }

  const fingerprint = getFingerprint(request);
  const supabase = getServiceSupabase();

  // Verify poll exists and is active
  const { data: poll } = await supabase
    .from("conference_polls")
    .select("options, is_active")
    .eq("id", id)
    .single();

  if (!poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  if (!poll.is_active) {
    return NextResponse.json({ error: "Poll is closed" }, { status: 400 });
  }

  const options = poll.options as string[];
  if (option_index >= options.length) {
    return NextResponse.json({ error: "Invalid option index" }, { status: 400 });
  }

  const { error } = await supabase
    .from("conference_poll_votes")
    .insert({ poll_id: id, option_index, voter_fingerprint: fingerprint });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already voted" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
