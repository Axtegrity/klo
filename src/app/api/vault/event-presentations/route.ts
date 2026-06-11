import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/vault/event-presentations
// Returns past published events that have at least one visible file.
// Free — no auth required. Separated from vault_content to avoid ghost CMS issues.
// Filters by is_visible in JS so this self-heals once PostgREST picks up the new column.
export async function GET() {
  const supabase = getServiceSupabase();

  const today = new Date().toISOString().split("T")[0];

  const { data: events, error } = await supabase
    .from("event_presentations")
    .select("id, title, conference_name, conference_location, event_date, slug, event_files(*)")
    .eq("is_published", true)
    .eq("display_on_events_page", true)
    .lt("event_date", today)
    .order("event_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!events || events.length === 0) {
    return NextResponse.json([]);
  }

  type FileRow = { id: string; event_id: string; file_name: string; file_type: string; file_url: string; file_size: string | null; is_visible?: boolean };

  // Filter to only events that have at least one visible file.
  // is_visible will be undefined until PostgREST schema cache refreshes — until then
  // the section stays empty (correct: Keith hasn't marked anything visible yet).
  const result = events
    .map((ev) => ({
      ...ev,
      event_files: ((ev.event_files ?? []) as FileRow[]).filter((f) => f.is_visible === true),
    }))
    .filter((ev) => ev.event_files.length > 0);

  return NextResponse.json(result);
}
