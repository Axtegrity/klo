import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getServiceSupabase } from "@/lib/supabase";

function getFingerprint(req: Request): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  return createHash("sha256").update(`${ip}:${ua}`).digest("hex");
}

function normalizeForProfanity(text: string): string {
  return text
    .toLowerCase()
    // Strip zero-width characters
    .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, "")
    // Collapse multiple spaces
    .replace(/\s+/g, " ")
    .trim()
    // Basic leetspeak substitutions
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s");
}

export async function GET() {
  const supabase = getServiceSupabase();

  // Use SQL-side aggregation instead of fetching all rows
  const { data, error } = await supabase.rpc("get_word_cloud_counts");

  if (error) {
    // Fallback to client-side aggregation if RPC doesn't exist yet
    const { data: rawData, error: rawError } = await supabase
      .from("conference_word_cloud")
      .select("word");

    if (rawError) {
      return NextResponse.json({ error: rawError.message }, { status: 500 });
    }

    const counts: Record<string, number> = {};
    for (const row of rawData || []) {
      const w = row.word.toLowerCase();
      counts[w] = (counts[w] || 0) + 1;
    }

    const entries = Object.entries(counts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json(entries, {
      headers: { "Cache-Control": "public, s-maxage=2, stale-while-revalidate=5" },
    });
  }

  return NextResponse.json(data || [], {
    headers: { "Cache-Control": "public, s-maxage=2, stale-while-revalidate=5" },
  });
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

  // Rate limit: max 5 submissions per fingerprint in 60 seconds
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count: recentCount, error: rlError } = await supabase
    .from("conference_word_cloud")
    .select("*", { count: "exact", head: true })
    .eq("voter_fingerprint", fingerprint)
    .gte("created_at", oneMinuteAgo);

  if (rlError) {
    return NextResponse.json({ error: rlError.message }, { status: 500 });
  }

  if ((recentCount ?? 0) >= 5) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a moment." },
      { status: 429 }
    );
  }

  // Profanity check
  const { data: profanityTerms, error: profError } = await supabase
    .from("conference_profanity_terms")
    .select("term");

  if (profError) {
    return NextResponse.json({ error: profError.message }, { status: 500 });
  }

  const normalized = normalizeForProfanity(word.trim());
  const blockedTerms = (profanityTerms || [])
    .map((row: { term: string }) => row.term.toLowerCase())
    .filter((term: string) => normalized.includes(term));

  if (blockedTerms.length > 0) {
    return NextResponse.json(
      { error: "Content blocked", reason: "profanity", flagged: blockedTerms },
      { status: 422 }
    );
  }

  const { error } = await supabase
    .from("conference_word_cloud")
    .insert({ word: word.trim().toLowerCase(), voter_fingerprint: fingerprint });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
