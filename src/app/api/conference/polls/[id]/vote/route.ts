import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { pollVoteSchema } from "@/lib/validation";
import { shouldRejectTestIdentifier } from "@/lib/test-fingerprint-guard";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = pollVoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid option_index and voter_id required" }, { status: 400 });
  }
  const { option_index, voter_id } = parsed.data;

  if (shouldRejectTestIdentifier(voter_id)) {
    return NextResponse.json({ error: "Invalid voter_id" }, { status: 400 });
  }

  // Use client-generated session ID instead of IP-based fingerprint
  // This allows all users on shared WiFi to vote independently
  const fingerprint = voter_id.slice(0, 64);
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
