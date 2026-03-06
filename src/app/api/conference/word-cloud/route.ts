import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

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

  const supabase = getServiceSupabase();

  const { error } = await supabase
    .from("conference_word_cloud")
    .insert({ word: word.trim().toLowerCase() });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
