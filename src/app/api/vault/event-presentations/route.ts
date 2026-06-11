import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/vault/event-presentations
// Returns visible files from past events for the vault presentations section.
// Free — no auth required. Separated from vault_content to avoid ghost CMS issues.
export async function GET() {
  const supabase = getServiceSupabase();

  const today = new Date().toISOString().split("T")[0];

  // Fetch past published events that have visible files
  const { data, error } = await supabase
    .from("event_presentations")
    .select("id, title, conference_name, conference_location, event_date, slug, event_files(id, file_name, file_type, file_url, file_size, is_visible)")
    .eq("is_published", true)
    .eq("display_on_events_page", true)
    .lt("event_date", today)
    .order("event_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Only return events that have at least one visible file
  const filtered = (data ?? [])
    .map((ev) => ({
      ...ev,
      event_files: (ev.event_files as { id: string; file_name: string; file_type: string; file_url: string; file_size: string | null; is_visible: boolean }[]).filter((f) => f.is_visible),
    }))
    .filter((ev) => ev.event_files.length > 0);

  return NextResponse.json(filtered);
}
