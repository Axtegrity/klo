import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getServiceSupabase } from "@/lib/supabase";

function getFingerprint(req: Request): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  return createHash("sha256").update(`${ip}:${ua}`).digest("hex");
}

export async function GET() {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("conference_word_cloud")
    .select("word");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aggregate word counts
  const counts: Record<string, number> = {};
  for (const row of data || []) {
    const w = row.word.toLowerCase();
    counts[w] = (counts[w] || 0) + 1;
  }

  const entries = Object.entries(counts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { word } = body;

  if (!word?.trim() || word.trim().length > 30) {
    return NextResponse.json(
      { error: "Word required (max 30 characters)" },
      { status: 400 }
    );
  }

  const fingerprint = getFingerprint(request);
  const supabase = getServiceSupabase();

  const { error } = await supabase
    .from("conference_word_cloud")
    .insert({ word: word.trim().toLowerCase(), voter_fingerprint: fingerprint });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
