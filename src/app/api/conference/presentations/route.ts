import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("conference_presentations")
    .select("id, title, description, category, conference_presentation_files(id, file_name, file_type, file_url, file_size)")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
